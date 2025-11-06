import {hideBin} from 'yargs/helpers';
import yargs, {Argv} from 'yargs';

import generateWallet from "./generate.js";

import '@cap/monkeypatch';
import {extendAddressDerivationOptions, extendWalletBuilderOptions} from "@cap/wallet/cli-utils";

yargs(hideBin(process.argv))
  .command('generate', 'Generate new wallet', (yargs: Argv) => {
    return extendAddressDerivationOptions(
      extendWalletBuilderOptions(
        yargs
          .array('mnemonics')
          .option('output', {
            alias: ['o'],
            type: 'string',
            description: 'path where to save newly generated wallet',
          })
          .option('override', {
            alias: ['x'],
            type: "boolean",
            description: 'flag to override existing wallet, if file on `--output` already exists',
          })
          .strictOptions()
      )
    );
  }, generateWallet)
  .strictCommands()
  .demandCommand()
  .wrap(null)
  .parse();
