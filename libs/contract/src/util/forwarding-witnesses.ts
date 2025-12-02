import {WitnessContext} from '@midnight-ntwrk/compact-runtime';
import {DefaultWitnesses as TimeWitnesses} from "@cap/common-contracts/time";
import {DefaultWitnesses as MathWitnesses} from "@cap/common-contracts/math";

/**
 * Create witness instance, that forwards all values to the property of private state with same name as the witness.
 * Contains implementations witnesses from common modules.
 */
export function privateStateForwardingWitnesses(customWitnesses: any = {}): any {
  return new Proxy({
      ...MathWitnesses,
      ...TimeWitnesses,
      ...customWitnesses
    },
    {
      get(t: any, property: string | symbol, _r: any): any {
        if (!Object.hasOwn(t, property)) {
          t[property] = (context: WitnessContext<any, any>): [any, any] => [context.privateState, context.privateState[property]];
        }
        return t[property];
      }
    });
}
