import {WitnessContext} from '@midnight-ntwrk/compact-runtime';

export type Witnesses<L, T> = {
  secondsFromUnixEpoch_unsafe(context: WitnessContext<L, T>): [T, bigint];
}

export const DefaultWitnesses: Witnesses<any, any> = {
  secondsFromUnixEpoch_unsafe(context: WitnessContext<any, any>): [any, bigint] {
    return [context.privateState, BigInt(Math.ceil(new Date().getTime() / 1000))];
  }
}
