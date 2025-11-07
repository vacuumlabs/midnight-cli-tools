import {hideBin} from 'yargs/helpers';
import yargs, {Argv} from 'yargs';

import '@cap/monkeypatch';
import {
  extendAddressDerivationOptions,
  extendWalletBuilderOptions,
  extendWalletGenerationOptions,
  extendWalletLoadingOptions
} from "@cap/wallet/cli-utils";
import {generateWallet, syncWallet} from "./commands/index.js";

yargs(hideBin(process.argv))
  // Generate wallet
  .command('generate', 'Generate new wallet', (yargs: Argv) => {
    return extendAddressDerivationOptions(extendWalletGenerationOptions(yargs))
      .array('mnemonics')
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
      .strictOptions();
  }, generateWallet)

  // Synchronize wallet
  .command('sync', 'Synchronize existing wallet state and display current basic information', (yargs: Argv) => {
    return extendAddressDerivationOptions(extendWalletBuilderOptions(extendWalletLoadingOptions(yargs)))
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
  }, syncWallet)

  // --
  .strictCommands()
  .demandCommand()
  .fail((msg, err, argv) => {
    if (err == null) {
      console.error(msg);
      return false;
    } else {
      err.stack = '';
      console.dir(err, {
        depth: null,
      })
      return false;
    }
  })
  .wrap(null)
  .parse();
