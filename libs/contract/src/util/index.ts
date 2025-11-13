export * from "./forwarding-witnesses.js";
export * from "./types.js";

export function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function fromHex(hex: string): Uint8Array {
  return Buffer.from(hex, 'hex');
}

export function toPrintableLedgerState(rawLedger: any): any {
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
