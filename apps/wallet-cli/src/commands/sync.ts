import {SyncArgs} from "../types.js";
import {WalletBuilder} from "@cap/wallet";

import {runWatchMode} from "@cap/tui";

export async function syncWallet(args: SyncArgs) {
  let wallet = await WalletBuilder.load(args);
  wallet.start();

  if (args.watch) {
    runWatchMode(wallet, wallet.state(), args.paths);
  } else {
    let syncedState = await wallet.syncedState();
    console.dir(syncedState, {
      depth: null,
    });
    wallet.close();
  }
}
