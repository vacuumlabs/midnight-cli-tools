import {SyncArgs} from "../types.js";
import {WalletBuilder} from "@cap/wallet";

import {runWatchMode, resolvePaths} from "@cap/tui";

export async function syncWallet(args: SyncArgs) {
  let wallet = await WalletBuilder.load(args);
  wallet.start();

  if (args.watch) {
    runWatchMode(wallet, wallet.state(), args.paths);
  } else {
    const syncedState = await wallet.syncedState();
    console.dir(resolvePaths(syncedState, args.paths, args.allowUndefined ?? true), {
      depth: null,
    });

    wallet.close();
  }
}
