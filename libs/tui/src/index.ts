import util from "node:util";
import blessed from "blessed";

import {ExtendedWallet} from "@cap/wallet";
import {Observable} from "rxjs";
import History from "./history.js";

export function runWatchMode(
  wallet: ExtendedWallet,
  observable: Observable<any>,
  watchPaths?: (string | number)[]
) {
  const screen = blessed.screen({
    title: 'Wallet watch mode'
  });
  const history = new History();

  const infoBoxContent = (): string => {
    const currentIndex = history.length == 0 ? 0 : history.currentIndex() + 1;
    const length = history.length == 0 ? 0 : history.length;
    return `{bold}Use mouse wheel to scroll content. Arrow keys left & right to see previous values.{/} Showing value {yellow-fg}${currentIndex}{/} of {yellow-fg}${length}{/}. Press {bold}{red-fg}Ctrl+C{/} to quit...`;
  };

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
    content: infoBoxContent(),
    tags: true,
  });

  screen.append(contentBox);
  screen.append(infoBox);

  async function stopGracefully() {
    screen.destroy();
    await wallet.close();
  }

  function renderContent() {
    contentBox.setContent(util.inspect(resolvePaths(history.getCurrentValue(), watchPaths, true), {
      colors: true,
      depth: null,
      sorted: true,
    }));
    infoBox.setContent(infoBoxContent());
    screen.render();
  }

  screen.key(['C-c'], async () => {
    await stopGracefully();
  });
  screen.render();

  screen.key(['left', 'down'], (_, k) => {
    history.decrementIndex();
    renderContent();
  });

  screen.key(['right', 'uo'], (_, k) => {
    history.incrementIndex();
    renderContent();
  })

  observable.subscribe((state: any) => {
    // TODO: Fix handling thrown errors, to not garble the screen... Sometimes.
    try {
      history.push(state);
      renderContent();
    } catch (error) {
      (async () => await stopGracefully())();
      throw error;
    }
  })
}

export function resolvePaths(obj: any, paths: (string | number)[] | undefined, allowUndefined: boolean): any {
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
