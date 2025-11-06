import {Roles, joinMnemonicWords, HDWallet} from "./sdk-hd/index.js";
import {AddressDerivationConfig} from "./types.js";
import {mnemonicToSeed} from "@scure/bip39";

export async function deriveAddressSeedFromMnemonicWords(
  words: string[],
  {
    derived_account = 0,
    derived_role = Roles.Zswap,
    derivation_index = 0
  }: AddressDerivationConfig = {}
): Promise<string> {
  const seedBytes = await mnemonicToSeed(joinMnemonicWords(words));
  const wallet = HDWallet.fromSeed(seedBytes);
  const derivedAccountKey = wallet
    .selectAccount(derived_account)
    .selectRole(derived_role)
    .deriveKeyAt(derivation_index);

  return Buffer.from(derivedAccountKey).toString('hex');
}
