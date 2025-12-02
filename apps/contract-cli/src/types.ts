import {WalletLoadingArgs} from "@cap/wallet/cli-utils";
import {SupportedModule} from "@cap/contract";
import {RestoreDeployedContractArgs, PrivateStateArgs} from "@cap/contract/cli-utils";

export type DeployContractArgs = {
  module: SupportedModule;
  output: string | undefined;
  override: boolean | undefined;
} & WalletLoadingArgs & PrivateStateArgs;

export type ObserveContractArgs = {
  watch: boolean | undefined,
  raw: boolean | undefined,
} & WalletLoadingArgs & RestoreDeployedContractArgs;

export type InteractArgs = {
  circuit: string,
  arguments: string,
} & WalletLoadingArgs & RestoreDeployedContractArgs;
