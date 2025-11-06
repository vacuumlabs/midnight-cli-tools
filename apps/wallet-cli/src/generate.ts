import {GenerateArgs} from "./types.js";

import {deriveAddressSeedFromMnemonicWords, ExtendedWallet, WalletBuilder} from "@cap/wallet";
import {generateMnemonicWords, Roles} from "@cap/wallet/sdk-hd";
import {WalletAddresses} from "@cap/wallet/api";

import {NetworkId} from "@midnight-ntwrk/zswap";
import fs from "node:fs/promises";

export default async function generateWallet(args: GenerateArgs) {
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

  wallet.start();

  if (args.output != null) {
    await serialize(wallet, mnemonicsWords, args.output, args.override || false);
  } else {
    await printState(wallet, mnemonicsWords);
  }

  wallet.close();
}

async function serialize(wallet: ExtendedWallet, mnemonics: string[], output: string, override: boolean) {
  let path;
  if (output.endsWith('.wallet.json')) {
    path = output;
  } else if (output.endsWith('.json')) {
    const len = output.length;
    const withoutExtension = output.substring(0, len - '.json'.length);
    path = `${withoutExtension}.wallet.json`
  } else {
    path = `${output}.wallet.json`
  }

  // Check if file exists already
  if (!override) {
    let alreadyExists = false;

    try {
      // Check if file is visible to the process
      await fs.access(path, fs.constants.F_OK);
      alreadyExists = true;
    } catch (error) {
      const typedError: {code: string | undefined} = error as {code: string | undefined};

      // 'ENOENT' - file does not exist. Everything else is some permission bullshit. and would be thrown during write.
      if (typedError.code !== 'ENOENT') {
        throw error;
      }
    }

    if (alreadyExists) {
      throw new Error(`Wallet '${path}' already exists`);
    }
  }

  let serializedState = await wallet.serializeState();

  await fs.writeFile(path, JSON.stringify({
    mnemonics,
    state: serializedState
  }, null, 2));

  console.log(`Generated wallet has been stored in '${path}'`);
}

async function printState(wallet: ExtendedWallet, mnemonics: string[]) {
  let syncedState = await wallet.syncedState();
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
