import {WitnessContext} from '@midnight-ntwrk/compact-runtime';

/**
 * Create witness instance, that forwards all values to the property of private state with same name as the witness.
 */
export function privateStateForwardingWitnesses(): any {
  return new Proxy({}, {
    get(t: {}, property: string | symbol, _r: any): any {
      if (!Object.hasOwn(t, property)) {
        (t as any)[property] = (context: WitnessContext<any, any>): [any, any] => [context.privateState, context.privateState[property]];
      }
      return (t as any)[property]
    }
  });
}
