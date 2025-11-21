import {Role} from "./sdk-hd/index.js";
import {Observable} from "rxjs";
import {
  BalanceTransactionToProve,
  NothingToProve,
  ProvingRecipe, TokenTransfer,
  TransactionIdentifier, TransactionToProve,
  WalletState, Transaction, CoinInfo
} from "./api/index.js";

export type AddressDerivationConfig = {
  derived_account?: number,
  derived_role?: Role,
  derivation_index?: number,
}

export type SerializableWallet = {
  mnemonics?: string[],
  seed: string,
  state: string,
}

export type WalletRunState = 'new' | 'syncing' | 'closing' | 'closed';

// ---
// Copy&Paste exports from '@midnight-ntwrk/wallet'
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

export interface Resource {
  start(): void;

  close(): Promise<void>;
}

/**
 * Wallet API
 *
 * @remarks
 * Wallet is a data structure that holds the state of the wallet and provides methods for proving, balancing, and submitting transactions.
 */
export interface Wallet {
  /**
   * Observable (rx.js) stream of {@link WalletState}
   *
   * @remarks
   * Should update every time there's a state update
   */
  state(): Observable<WalletState>;

  /**
   * Calls the proving server with the proving recipe and returns the proven transaction or error.
   *
   * @remarks
   * - Proof generation takes time and resources, therefore depending on the user's computer specs, this can be an expensive operation
   * - There can be wallet implementations that do not need to support proving, in which case this method should return an error
   *
   * @param recipe {@link ProvingRecipe} with data to prove
   * @returns Transaction or error
   */
  proveTransaction(recipe: ProvingRecipe): Promise<Transaction>;

  /**
   * Balances the provided transaction.
   *
   * @remarks
   * Balancing a transaction means that for any given output and transaction fees, the wallet will take the available coins
   * from the state to cover them.
   *
   * @param tx Transaction to balance
   * @param newCoins {@link CoinInfo} array of coins created by the transaction, which the wallet will watch for and apply to the state
   *
   * The `newCoins` parameter should be used in cases where a new coin is created (for example, a DApp mints a coin and wants to send it to the wallet).
   * Because of how Midnight works, newly created coins must be explicitly sent to the wallet using this method. This allows the wallet to monitor them and
   * incorporate them into its state.
   *
   * @returns {@link BalanceTransactionToProve} or {@link NothingToProve} recipe (for the already balanced transaction) or error.
   */
  balanceTransaction(tx: Transaction, newCoins: CoinInfo[]): Promise<BalanceTransactionToProve | NothingToProve>;

  /**
   * Submits the provided transaction to the node
   *
   * @param tx Transaction to submit
   * @returns {@link TransactionIdentifier} - First transaction identifier from identifiers list or error
   */
  submitTransaction(tx: Transaction): Promise<TransactionIdentifier>;

  /**
   * Prepares a transfer transaction
   *
   * @param outputs An array of {@link TokenTransfer} a user wants to perform.
   *
   * @returns Recipe with {@link TransactionToProve} or error
   */
  transferTransaction(outputs: TokenTransfer[]): Promise<TransactionToProve>;

  /**
   * Serializes and returns the current state of the wallet which contains:
   * - The zswap local state
   * - The transaction history
   * - The offset in the blockchain corresponding to this state
   * - The protocol version
   * - The network ID
   *
   * @returns Serialized {@link WalletState} in stringified JSON format
   */
  serializeState(): Promise<string>;
}
