import {WitnessContext} from '@midnight-ntwrk/compact-runtime';

export type Witnesses<L, T> = {
  divMod_unsafe(context: WitnessContext<L, T>, x: bigint, y: bigint): [T, [bigint, bigint]];
};

export const DefaultWitnesses: Witnesses<any, any> = {
  divMod_unsafe(context: WitnessContext<any, any>, x: bigint, y: bigint): [any, [bigint, bigint]] {
    return [context.privateState, [x / y, x % y]];
  },
};
