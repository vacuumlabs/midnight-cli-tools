import {Roles} from "../sdk-hd/index.js";
import {NetworkId} from "@midnight-ntwrk/zswap";

export type AddressDerivationArgs = {
  account: number;
  addressRole: keyof typeof Roles;
  index: number;
};

export type WalletBuilderArgs = {
  indexerUrl: string;
  indexerWsUrl: string;
  proverServerUrl: string;
  nodeUrl: string;
  networkId: keyof typeof NetworkId;
};
