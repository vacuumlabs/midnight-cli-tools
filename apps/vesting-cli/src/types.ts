import {WalletLoadingArgs} from "@cap/wallet/cli-utils";

export type CommonArgs = {
  address: string,
} & WalletLoadingArgs;

export type CreateVestmentArgs = {
  tokenType: string,
  amount: number,
  duration: number,
  beneficiary: string,
} & CommonArgs;


export type VestmentArgs = {
  vestmentId: string,
} & CommonArgs;
