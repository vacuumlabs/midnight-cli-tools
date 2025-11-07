import {AddressDerivationArgs, WalletBuilderArgs, WalletGenerationArgs, WalletLoadingArgs} from "@cap/wallet/cli-utils";

export type GenerateArgs = {
  output: string | undefined;
  override: boolean | undefined;
  mnemonics: (string | number)[] | undefined;
} & WalletGenerationArgs &
  AddressDerivationArgs;

export type SyncArgs = {
  paths: (string | number)[] | undefined,
  allowUndefined: boolean | undefined,
  watch: boolean | undefined,
} & WalletBuilderArgs & WalletLoadingArgs & AddressDerivationArgs;
