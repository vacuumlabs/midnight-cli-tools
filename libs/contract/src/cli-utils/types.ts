import {SupportedModule} from "../loadedContracts.js";
import {NetworkId} from "@midnight-ntwrk/midnight-js-network-id";

export type PrivateStateArgs = {
  privateState: any | undefined,
}

export type RebuildContractArgs = {
  module: SupportedModule;
  contractAddress: string;
  networkId: NetworkId;
}

export type LoadContractArgs = {
  contract: string;
};

export type RestoreDeployedContractArgs = RebuildContractArgs & LoadContractArgs & PrivateStateArgs;
