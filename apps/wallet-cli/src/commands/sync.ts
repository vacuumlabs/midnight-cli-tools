import {SyncArgs} from "../types.js";
import {ExtendedWallet, WalletBuilder} from "@cap/wallet";

import blessed from 'blessed';
import util from 'node:util';

export async function syncWallet(args: SyncArgs) {
  let wallet = await WalletBuilder.load(args);
  wallet.start();

  if (args.watch) {
    runWatchMode(wallet, args.paths ?? []);
  } else {
    let syncedState = await wallet.syncedState();
    console.dir(resolvePaths(syncedState, args.paths, args.allowUndefined ?? false), {
      depth: null,
    });
    wallet.close();
  }

  await wallet.dumpToFile(args.wallet);
}

function runWatchMode(wallet: ExtendedWallet, watchPaths: (string|number)[]) {
  const screen = blessed.screen({
    title: 'Wallet watch mode'
  });

  async function stopGracefully() {
    screen.destroy();
    await wallet.close();
  }

  const contentBox = blessed.box({
    top: 0,
    left: 0,
    bottom: 2,
    width: '100%',
    tags: true,
    mouse: true,
    scrollable: true,
  })
  const infoBox = blessed.text({
    bottom: 0,
    left: 0,
    height: 1,
    width: '100%',
    content: '{bold}Use mouse wheel to scroll;{/} Press {bold}{red-fg}Ctrl+C{/} to quit...',
    tags: true,
  });

  screen.append(contentBox);
  screen.append(infoBox);

  screen.key(['C-c'], async () => {
    await stopGracefully();
  });
  screen.render();

  wallet.state().subscribe((syncedState) => {
    // TODO: Fix handling thrown errors, to not garble the screen... Sometimes.
    try {
      contentBox.setContent(util.inspect(resolvePaths(syncedState, watchPaths, true), {
        colors: true,
        depth: null,
        sorted: true,
      }));
      screen.render();
    } catch (error) {
      (async () => await stopGracefully())();
      throw error;
    }
  })
}

function resolvePaths(obj: any, paths: (string | number)[] | undefined, allowUndefined: boolean): any {
  if (paths == null || paths.length === 0) {
    return obj;
  }

  const constructed: Record<string, any> = {};

  for (const path of paths) {
    constructed[path.toString()] = resolvePath(obj, path, allowUndefined);
  }

  return constructed;
}

function resolvePath(obj: any, path: (string | number), allowUndefined: boolean): any {
  let currentValue = obj;

  if (typeof path === 'number') {
    return currentValue[path];
  }

  let pos = -1;
  while (pos < path.length) {
    let nextPos = path.indexOf('.', pos + 1);
    if (nextPos === -1) {
      nextPos = path.length;
    }

    const propertyName = path.substring(pos + 1, nextPos);
    if (!currentValue.hasOwnProperty(propertyName) && !allowUndefined) {
      throw new Error('Undefined value on path', {
        cause: {
          fullPath: path,
          existingSubpath: path.substring(0, pos),
          existingObjectOnSubpath: currentValue,
          nonExistentProperty: propertyName,
        }
      });
    }

    currentValue = currentValue[propertyName];
    pos = nextPos;
  }

  return currentValue;
}
