import {hideBin} from 'yargs/helpers';
import yargs, {Argv} from 'yargs';

import '@cap/monkeypatch';
import {
  extendAddressDerivationOptions,
  extendWalletBuildingOptions,
  extendWalletLoadingOptions,
} from "@cap/wallet/cli-utils";
import {generateWallet, syncWallet, transfer} from "./commands/index.js";
import {nativeToken} from "@midnight-ntwrk/zswap";

yargs(hideBin(process.argv))
  // Generate wallet
  .command('generate', 'Generate new wallet', (yargs: Argv) => {
    return extendWalletBuildingOptions(extendAddressDerivationOptions(
      yargs
        .array('mnemonics')
        .option('seed', {
          alias: ['s'],
          type: 'string',
          description: 'seed to generate wallet with'
        })
        .option('output', {
          alias: ['o'],
          type: 'string',
          description: 'path where to save newly generated wallet',
        })
        .option('override', {
          alias: ['x'],
          type: 'boolean',
          description: 'flag to override existing wallet, if file on `--output` already exists',
        })
    ));
  }, generateWallet)

  // Synchronize wallet
  .command('sync', 'Synchronize existing wallet state and display current basic information', (yargs: Argv) => {
    return extendWalletLoadingOptions(yargs)
      .array('paths')
      .option('allow-undefined', {
        alias: ['u'],
        type: 'boolean',
        description: 'Do not throw error, if property on path does not exists',
      })
      .option('watch', {
        alias: ['w'],
        type: 'boolean',
        description: 'Run sync in watch mode, awaiting changed in the wallet state',
      })
      .option('no-sync', {
        type: 'boolean',
        description: 'Run sync without actually syncing the state. Should be used, when querying always available info, like addresses',
      });
  }, syncWallet)

  // Transfer funds
  .command('transfer', 'Transfer fund to address', (yargs: Argv) => {
    return extendWalletLoadingOptions(yargs)
      .option('amount', {
        alias: ['a'],
        description: 'number of coins to be sent',
        type: 'string',
      })
      .option('type', {
        alias: ['t'],
        description: 'Type of coin that will be transferred',
        type: 'string',
        default: nativeToken(),
      })
      .option('receiver', {
        alias: ['r'],
        description: 'Receivers address',
        type: 'string'
      })
      .demandOption(['amount', 'receiver']);
  }, transfer)
  .env('CAP')

  // --
  .strictCommands()
  .demandCommand()
  .fail((msg, err, argv) => {
    if (err == null) {
      console.error(msg);
    } else {
      console.dir(err, {
        depth: null,
      })
    }
  })
  .wrap(null)
  .parse();
