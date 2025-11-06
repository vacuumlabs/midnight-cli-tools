import {HDKey} from "@scure/bip32";

export enum Roles {
  NightExternal = 0,
  NightInternal = 1,
  Dust = 2,
  Zswap = 3,
  Metadata = 4,
}

export type Role = typeof Roles[keyof typeof Roles];

export class HDWallet {
  private readonly rootKey: HDKey;

  private constructor(seed: HDKey) {
    this.rootKey = seed;
  }

  static fromSeed(seed: Uint8Array): HDWallet {
    return new HDWallet(HDKey.fromMasterSeed(seed));
  }

  public selectAccount(account: number): AccountKey {
    return new AccountKey(this.rootKey, account);
  }
}

export class AccountKey {
  private rootKey: HDKey;
  private account: number;

  constructor(rootKey: HDKey, account: number) {
    this.rootKey = rootKey;
    this.account = account;
  }

  selectRole(role: Role): RoleKey {
    return new RoleKey(this.rootKey, this.account, role);
  }
}

const PURPOSE = 44;
const COIN_TYPE = 2400;

export class RoleKey {
  private rootKey: HDKey;
  private account: number;
  private role: Role;

  constructor(rootKey: HDKey, account: number, role: Role) {
    this.rootKey = rootKey;
    this.account = account;
    this.role = role;
  }

  deriveKeyAt(index: number): Uint8Array {
    const path = `m/${PURPOSE}'/${COIN_TYPE}'/${this.account}'/${this.role}/${index}`;
    const derivedKey = this.rootKey.derive(path);

    if (derivedKey.privateKey == null) {
      throw new Error("Key out of bounds")
    }

    return derivedKey.privateKey;
  }
}
