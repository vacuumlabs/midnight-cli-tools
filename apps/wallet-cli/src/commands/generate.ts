import {GenerateArgs} from "../types.js";

import {
  deriveAddressSeedFromMnemonicWords,
  ExtendedWallet,
  WalletBuilder
} from "@cap/wallet";
import {generateMnemonicWords, Roles} from "@cap/wallet/sdk-hd";
import {WalletAddresses} from "@cap/wallet/api";

import {NetworkId} from "@midnight-ntwrk/zswap";

export async function generateWallet(args: GenerateArgs) {
  const mnemonicsWords = args.mnemonics?.map((value) => value.toString()) || generateMnemonicWords();
  const addressSeed = await deriveAddressSeedFromMnemonicWords(
    mnemonicsWords,
    {
      derived_account: args.account,
      derived_role: Roles[args.addressRole],
      derivation_index: args.index,
    }
  );

  const wallet = await WalletBuilder.build(
    args.indexerUrl,
    args.indexerWsUrl,
    args.proverServerUrl,
    args.nodeUrl,
    addressSeed,
    NetworkId[args.networkId]
  );

  if (args.output != null) {
    await wallet.dumpToFile(args.output, mnemonicsWords, args.override);
  } else {
    await printState(wallet, mnemonicsWords);
  }
}

async function printState(wallet: ExtendedWallet, mnemonics: string[]) {
  let syncedState = await wallet.currentState();
  let printableState: WalletAddresses = {
    address: syncedState.address,
    coinPublicKey: syncedState.coinPublicKey,
    encryptionPublicKey: syncedState.encryptionPublicKey
  };

  console.log({
    mnemonics,
    state: printableState
  });
}
