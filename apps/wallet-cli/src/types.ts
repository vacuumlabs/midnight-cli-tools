import {AddressDerivationArgs, WalletBuilderArgs} from "@cap/wallet/cli-utils";

export type GenerateArgs = {
  output: string | undefined;
  override: boolean | undefined;
  mnemonics: (string | number)[] | undefined;
} & WalletBuilderArgs &
  AddressDerivationArgs;
