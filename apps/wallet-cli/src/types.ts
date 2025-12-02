import {AddressDerivationArgs, WalletLoadingArgs, WalletBuilderArgs} from "@cap/wallet/cli-utils";

export type GenerateArgs = {
  output: string | undefined;
  override: boolean | undefined;
  mnemonics: (string | number)[] | undefined;
  seed: string | undefined;
} & AddressDerivationArgs & WalletBuilderArgs;

export type SyncArgs = {
  paths: (string | number)[] | undefined,
  allowUndefined: boolean | undefined,
  watch: boolean | undefined,
  noSync: boolean | undefined,
} & WalletLoadingArgs;

export type TransferArgs = {
  amount: string,
  type: string,
  receiver: string,
} & WalletLoadingArgs;
