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
};

export type WalletGenerationArgs = {
  networkId: keyof typeof NetworkId;
} & WalletBuilderArgs;

export type WalletLoadingArgs = {
  wallet: string,
}
