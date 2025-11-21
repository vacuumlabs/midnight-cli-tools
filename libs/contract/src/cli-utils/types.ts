import {SupportedModule} from "../loadedContracts.js";

export type PrivateStateArgs = {
  privateState: any | undefined,
}

export type RebuildContractArgs = {
  module: SupportedModule;
  address: string;
}

export type LoadContractArgs = {
  contract: string;
};

export type RestoreDeployedContractArgs = RebuildContractArgs & LoadContractArgs & PrivateStateArgs;
