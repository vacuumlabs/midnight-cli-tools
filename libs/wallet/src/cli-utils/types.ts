import {Roles} from "../sdk-hd/index.js";
import {NetworkId} from "@midnight-ntwrk/midnight-js-network-id";

export type AddressDerivationArgs = {
  account: number;
  addressRole: keyof typeof Roles;
  index: number;
};

export type WalletBuilderArgs = {
  indexerUrl: string;
  indexerWsUrl: string;
  proverUrl: string;
  nodeUrl: string;
  networkId: NetworkId,
};

export type WalletLoadingArgs = {
  wallet: string,
} & WalletBuilderArgs & AddressDerivationArgs;
