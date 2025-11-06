import {WalletBuilder as MidnightWalletBuilder} from "@midnight-ntwrk/wallet";
import {LogLevel, Resource, Wallet} from "./types.js";
import {CoinInfo, NetworkId, Transaction} from "@midnight-ntwrk/zswap";
import {lastValueFrom, Observable, takeWhile} from "rxjs";
import {
  WalletState,
  ProvingRecipe,
  BalanceTransactionToProve,
  NothingToProve,
  TransactionIdentifier,
  TokenTransfer,
  TransactionToProve
} from "./api/types.js";

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
  static build(
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
    ).then((wallet) => new ExtendedWallet(wallet));
  }
}

type ResourcedWallet = Resource & Wallet;

export class ExtendedWallet implements Resource, Wallet {
  midnightWallet: ResourcedWallet;
  started: boolean = false;

  constructor(wallet: ResourcedWallet) {
    this.midnightWallet = wallet;
  }

  // Extensions
  /**
   * Load fully synced state from internal state observer.
   *
   * @remarks
   * The state can & will de-sync on its own. This should be used in scenarios when the state
   * is used for direct processing or snapshotting. This value should not be used for caching.
   */
  syncedState(): Promise<WalletState> {
    if (!this.started) {
      throw new Error("Cannot await synced state on wallet, that did not start syncing");
    }

    return lastValueFrom(
      this.state().pipe(takeWhile((state) => !state.syncProgress?.synced, true))
    );
  }

  // Implements
  state(): Observable<WalletState> {
    return this.midnightWallet.state();
  }

  proveTransaction(recipe: ProvingRecipe): Promise<Transaction> {
    return this.midnightWallet.proveTransaction(recipe);
  }

  balanceTransaction(tx: Transaction, newCoins: CoinInfo[]): Promise<BalanceTransactionToProve | NothingToProve> {
    return this.midnightWallet.balanceTransaction(tx, newCoins);
  }

  submitTransaction(tx: Transaction): Promise<TransactionIdentifier> {
    return this.midnightWallet.submitTransaction(tx);
  }

  transferTransaction(outputs: TokenTransfer[]): Promise<TransactionToProve> {
    return this.midnightWallet.transferTransaction(outputs);
  }

  serializeState(): Promise<string> {
    return this.midnightWallet.serializeState();
  }

  start(): void {
    this.midnightWallet.start();
    this.started = true;
  }

  close(): Promise<void> {
    return this.midnightWallet.close();
  }

}
