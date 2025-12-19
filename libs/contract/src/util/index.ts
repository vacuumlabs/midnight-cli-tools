import {getNetworkId} from "@midnight-ntwrk/midnight-js-network-id";

export * from "./forwarding-witnesses.js";
export * from "./types.js";

import {bech32m} from 'bech32';
import {createCoinInfo, encodeCoinInfo, encodeCoinPublicKey, nativeToken, TokenType} from "@midnight-ntwrk/ledger";
import {EncodedCoinInfo} from "@midnight-ntwrk/compact-runtime";

type Bytes<N extends number> = Uint8Array<{byteLength: N} & ArrayBuffer>

type EitherCoinAddressOrContractAddress = {
  is_left: boolean,
  left: {
    bytes: Bytes<32>
  },
  right: {
    bytes: Bytes<32>
  },
};

export function emptyBytes<N extends number>(size: N): Bytes<N> {
  return new Uint8Array(size).fill(0) as Bytes<N>;
}

export function randomBytes<N extends number>(size: N): Bytes<N> {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return bytes as Bytes<N>;
}

export function sizedBytesFrom<N extends number>(input: ArrayLike<number>, size: N): Bytes<N> {
  const bytes = Uint8Array.from(input);
  if (bytes.length != size) {
    throw new Error('Address length is not correct', {
      cause: {
        expected: size,
        got: bytes.length
      }
    });
  }

  return bytes as Bytes<N>;
}

export function fromHex(hex: string): Uint8Array {
  return Buffer.from(hex, 'hex');
}

export function toHex(value: ArrayLike<number>): string {
  return Buffer.from(value).toString('hex');
}

export function epochToDate(epoch: bigint): Date {
  return new Date(Number(epoch) * 1000);
}

export function coin(value: bigint, tokenType: TokenType = nativeToken()): EncodedCoinInfo {
  const coinInfo = createCoinInfo(tokenType, value);
  return encodeCoinInfo(coinInfo);
}

export function argToBigInt(argValue: number): bigint {
  try {
    return BigInt(argValue);
  } catch (error) {
    throw new Error('Failed to convert amount to integer', {
      cause: {
        amount: argValue,
        error,
      }
    });
  }
}

export function argToCoinAddress(argValue: string): EitherCoinAddressOrContractAddress {
  const networkId = getNetworkId().toLowerCase();
  const bechGenericHRP = 'mn_shield-cpk_';
  const bechNetworkHRP = `${bechGenericHRP}${networkId}`;

  let bytes: Uint8Array;
  if (argValue.startsWith(bechGenericHRP)) {
    if (!argValue.startsWith(bechNetworkHRP)) {
      // Bech32m HRP separator. If the separator is not on the correct position, right after name of the network, the
      // address is either way incorrect.
      const sepPos = argValue.indexOf('1');
      const addrNtwrkId = argValue.slice(bechGenericHRP.length, sepPos > -1 ? sepPos : argValue.length);
      throw new Error('Bech32m address belongs to wrong network', {
        cause: {
          expected: networkId,
          got: addrNtwrkId
        }
      });
    } else {
      const {words} = bech32m.decode(argValue);
      bytes = Uint8Array.from(bech32m.fromWords(words));
    }
  } else {
    bytes = encodeCoinPublicKey(argValue);
  }

  return {
    is_left: true,
    left: {
      bytes: sizedBytesFrom(bytes, 32),
    },
    right: {
      bytes: emptyBytes(32),
    },
  };
}

export function hexEncodedCoinPublicKeyToBech32m(encoded: string): string {
  const networkId = getNetworkId();
  const bechGenericHRP = 'mn_shield-cpk_';
  const bechNetworkHRP = `${bechGenericHRP}${networkId}`;
  const bytes = sizedBytesFrom(fromHex(encoded), 32);
  return bech32m.encode(bechNetworkHRP, bech32m.toWords(bytes));

}

export function hexToBech32(addr: string): string {
  let addrBytes = fromHex(addr);
  if (addrBytes.length != 32) {
    if (addr.startsWith('0200')) {
      addr = addr.slice(4);
      addrBytes = fromHex(addr);
      if (addrBytes.length != 32) {
        throw new Error('Invalid address length');
      }
    } else {
      throw new Error('Invalid address length');
    }
  }

  const words = bech32m.toWords(addrBytes);
  const networkId = getNetworkId().toLowerCase();
  return bech32m.encode(`mn_shield-addr_${networkId}`, words);
}

export function toPrintableLedgerState(rawLedger: any): any {
  if (rawLedger == null) {
    return rawLedger;
  }

  let printable: Record<string, any> = {};

  for (const property of Object.getOwnPropertyNames(rawLedger)) {
    if (property === "__wbg_ptr") {
      // Observing WASM bindgen pointer. These thing have no informational value. Just strip them out.
      return undefined;
    }

    let propValue = rawLedger[property];
    let descriptor = Object.getOwnPropertyDescriptor(rawLedger, property);

    if (descriptor && typeof descriptor.get === 'function') {
      propValue = descriptor.get();
    }

    if (propValue instanceof Uint8Array) {
      propValue = {
        type: 'Uint8Array',
        hex: Buffer.from(propValue).toString("hex")
      };
    } else if (Array.isArray(propValue)) {
      propValue = propValue.map(toPrintableLedgerState);
    } else if (typeof propValue === "object") {
      propValue = toPrintableLedgerState(propValue);
    }

    if (propValue != null) {
      printable[property] = propValue;
    }
  }

  return printable
}
