import {WalletBuilder as MidnightWalletBuilder} from "@midnight-ntwrk/wallet";
import {CoinInfo, NetworkId, Transaction as ZswapTransaction} from "@midnight-ntwrk/zswap";
import {ContractProviders} from "@midnight-ntwrk/midnight-js-contracts";
import {TransactionId, Transaction as LedgerTransaction} from "@midnight-ntwrk/ledger";
import {indexerPublicDataProvider} from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import {levelPrivateStateProvider} from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import {NodeZkConfigProvider} from "@midnight-ntwrk/midnight-js-node-zk-config-provider";
import {httpClientProofProvider} from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import {getLedgerNetworkId, getZswapNetworkId} from "@midnight-ntwrk/midnight-js-network-id";

import {
  WalletProvider,
  MidnightProvider,
  UnbalancedTransaction,
  BalancedTransaction,
  createBalancedTx
} from "@midnight-ntwrk/midnight-js-types";

import * as fs from "node:fs/promises";
import {firstValueFrom, lastValueFrom, Observable, takeWhile} from "rxjs";

import {LogLevel, Resource, SerializableWallet, Wallet, WalletRunState} from "./types.js";
import {
  WalletState,
  ProvingRecipe,
  BalanceTransactionToProve,
  NothingToProve,
  TransactionIdentifier,
  TokenTransfer,
  TransactionToProve
} from "./api/index.js";
import {AddressDerivationArgs, WalletBuilderArgs, WalletLoadingArgs} from "./cli-utils/index.js";
import {deriveAddressSeedFromMnemonicWords} from "./utils.js";
import {Roles} from "./sdk-hd/index.js";
import {createHash} from "node:crypto";

export class WalletBuilder {
  /**
   * Create an instance of a new wallet from a given seed
   * @param indexerUri PubSub-Indexer HTTP URI
   * @param indexerWsUri PubSub-Indexer Websockets URI
   * @param proverServerUri Prover server URI
   * @param substrateNodeUri Node URI
   * @param seed A BIP32 compatible mnemonic seed phrase hex encoded
   * @param networkId The network identifier (TestNet, MainNet, or Undeployed)
   * @param minLogLevel Only statements with this level and above will be logged
   * @param discardTxHistory If transaction history should be discarded or kept in memory - undefined will default to false
   */
  static async build(
    indexerUri: string,
    indexerWsUri: string,
    proverServerUri: string,
    substrateNodeUri: string,
    seed: string,
    networkId: NetworkId,
    minLogLevel?: LogLevel,
    discardTxHistory?: boolean,
  ): Promise<ExtendedWallet> {
    return MidnightWalletBuilder.build(
      indexerUri,
      indexerWsUri,
      proverServerUri,
      substrateNodeUri,
      seed,
      networkId,
      minLogLevel,
      discardTxHistory
    ).then((wallet) => new _InternalWallet(wallet, this.internalWalletId(seed)));
  }

  // ---
  // Functionality extension
  static async load(args: (WalletLoadingArgs & WalletBuilderArgs & AddressDerivationArgs)): Promise<ExtendedWallet> {
    const fileContent = await fs.readFile(args.wallet, 'utf-8');
    const loadedWalletData: SerializableWallet = JSON.parse(fileContent);
    const seed = await deriveAddressSeedFromMnemonicWords(
      loadedWalletData.mnemonics,
      {
        derived_account: args.account,
        derived_role: Roles[args.addressRole],
        derivation_index: args.index,
      }
    );

    const baseWallet = await MidnightWalletBuilder.restore(
      args.indexerUrl,
      args.indexerWsUrl,
      args.proverUrl,
      args.nodeUrl,
      seed,
      loadedWalletData.state,
    );

    return new _InternalWallet(baseWallet, this.internalWalletId(seed));
  }

  private static internalWalletId(walletSeed: string): string {
    return createHash('sha256').update(walletSeed).digest('hex');
  }
}

type ResourcedWallet = Resource & Wallet;

export class ExtendedWallet implements Resource, Wallet {
  readonly internalId: string;

  private midnightWallet: ResourcedWallet;
  private _runState: WalletRunState = 'new';

  protected constructor(wallet: ResourcedWallet, id: string) {
    this.internalId = id;
    this.midnightWallet = wallet;
  }

  get runState(): WalletRunState {
    return this._runState;
  }

  // ---
  // Functionality extensions
  /**
   * Load fully synced state from internal state observer. This should be used only on
   * `started` wallet.
   *
   * @throws
   * `Error` when called on wallet, which `start` function was not called.
   *
   * @remarks
   * The state can & will de-sync on its own. This should be used in scenarios when the state
   * is used for direct processing or snapshotting. This value should not be used for caching.
   */
  syncedState(): Promise<WalletState> {
    this.assertState('syncing');

    return lastValueFrom(
      this.state().pipe(takeWhile((state) => !state.syncProgress?.synced, true))
    );
  }

  /**
   * Load currently synced state from internal state observer. This is usable, even if wallet did not start syncing,
   * even tho the returned state can be out-of-date. Some of the data is correct (like associated addresses).
   */
  currentState(): Promise<WalletState> {
    return firstValueFrom(
      this.state()
    );
  }

  async buildWalletProvider(): Promise<WalletProvider & MidnightProvider> {
    const wallet = this;
    const state = await wallet.currentState();
    return {
      coinPublicKey: state.coinPublicKey,
      encryptionPublicKey: state.encryptionPublicKey,
      balanceTx(ledgerTransaction: UnbalancedTransaction, newCoins: CoinInfo[]): Promise<BalancedTransaction> {
        wallet.assertState('syncing');

        return wallet.balanceTransaction(
          ZswapTransaction.deserialize(ledgerTransaction.serialize(getLedgerNetworkId()), getZswapNetworkId()),
          newCoins
        )
          .then((tx) => wallet.proveTransaction(tx))
          .then((zswapTx) => LedgerTransaction.deserialize(zswapTx.serialize(getZswapNetworkId()), getLedgerNetworkId()))
          .then(createBalancedTx);
      },
      submitTx(tx: BalancedTransaction): Promise<TransactionId> {
        wallet.assertState('syncing');

        return wallet.submitTransaction(tx);
      }
    };
  }

  async buildContractProviders(
    pathToContract: string,
    {
      indexerUrl,
      indexerWsUrl,
      proverUrl,
    }: WalletBuilderArgs
  ): Promise<ContractProviders> {
    const walletProvider = await this.buildWalletProvider();

    return {
      privateStateProvider: levelPrivateStateProvider(),
      publicDataProvider: indexerPublicDataProvider(
        indexerUrl,
        indexerWsUrl
      ),
      zkConfigProvider: new NodeZkConfigProvider(pathToContract),
      proofProvider: httpClientProofProvider(proverUrl),
      walletProvider: walletProvider,
      midnightProvider: walletProvider,
    };
  }

  /**
   * Serialize wallet into file on specified path.
   * @param outputFile Path to the file to serialize wallet into.
   * @param mnemonics Mnemonic words associated with this wallet. (Those are not stored directly in the wallet & are needed).
   * @param override Override file, if it already exists.
   */
  async dumpToFile(outputFile: string, mnemonics?: string[], override: boolean = false): Promise<string> {
    let path;
    if (outputFile.endsWith('.wallet.json')) {
      path = outputFile;
    } else if (outputFile.endsWith('.json')) {
      const len = outputFile.length;
      const withoutExtension = outputFile.substring(0, len - '.json'.length);
      path = `${withoutExtension}.wallet.json`
    } else {
      path = `${outputFile}.wallet.json`
    }

    // Check if file exists already
    if (mnemonics != null && !override) {
      let alreadyExists = false;

      try {
        // Check if file is visible to the process
        await fs.access(path, fs.constants.F_OK);
        alreadyExists = true;
      } catch (error) {
        const typedError: { code: string | undefined } = error as { code: string | undefined };

        // 'ENOENT' - file does not exist. Everything else is some permission bullshit. and would be thrown during write.
        if (typedError.code !== 'ENOENT') {
          throw error;
        }
      }

      if (alreadyExists) {
        throw new Error(`Wallet '${path}' already exists`);
      }
    }

    if (mnemonics == null) {
      const fileContent = await fs.readFile(path, 'utf-8');
      const loadedWalletData: SerializableWallet = JSON.parse(fileContent);
      mnemonics = loadedWalletData.mnemonics;
    }

    let serializedState = await this.serializeState();
    let serializableWallet: SerializableWallet = {
      mnemonics,
      state: serializedState,
    };

    await fs.writeFile(path, JSON.stringify(serializableWallet, null, 2));
    return path;
  }

  // ---
  // Private methods
  private assertState(...expectedStates: [WalletRunState, ...WalletRunState[]]) {
    if (!expectedStates.includes(this.runState)) {
      throw new Error(`Available only for '${expectedStates.join(', ')}' wallet. Currently in '${this._runState}' state`);
    }
  }

  // ---
  // Interface Implementation
  state(): Observable<WalletState> {
    return this.midnightWallet.state();
  }

  proveTransaction(recipe: ProvingRecipe): Promise<ZswapTransaction> {
    return this.midnightWallet.proveTransaction(recipe);
  }

  balanceTransaction(tx: ZswapTransaction, newCoins: CoinInfo[]): Promise<BalanceTransactionToProve | NothingToProve> {
    return this.midnightWallet.balanceTransaction(tx, newCoins);
  }

  submitTransaction(tx: ZswapTransaction): Promise<TransactionIdentifier> {
    return this.midnightWallet.submitTransaction(tx);
  }

  transferTransaction(outputs: TokenTransfer[]): Promise<TransactionToProve> {
    return this.midnightWallet.transferTransaction(outputs);
  }

  serializeState(): Promise<string> {
    return this.midnightWallet.serializeState();
  }

  start(): void {
    this.assertState('new');
    this.midnightWallet.start();
    this._runState = 'syncing';
  }

  async close(): Promise<void> {
    this.assertState('new', 'syncing');
    this._runState = 'closing';
    await this.midnightWallet.close();
    this._runState = 'closed';
  }
}


class _InternalWallet extends ExtendedWallet {
  constructor(wallet: ResourcedWallet, id: string) {
    super(wallet, id);
  }
}
