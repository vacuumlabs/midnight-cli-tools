import "@cap/monkeypatch";
import {
  extendWalletLoadingOptions,
  listEnumVariantNames
} from "@cap/wallet/cli-utils";

import yargs, {Argv} from "yargs";
import {hideBin} from "yargs/helpers";

import {SupportedModule} from "@cap/contract";

import {deploy, observe} from "./commands/index.js";
import {DeployContractArgs} from "./types.js";
import {extendRestoreContractOptions, extendPrivateStateOptions} from "@cap/contract/cli-utils";
import {interact} from "./commands/interact.js";

yargs(hideBin(process.argv))
  .command('deploy', 'Deploy contract', (yargs: Argv) => {
    return extendWalletLoadingOptions(extendPrivateStateOptions(yargs
      .option('module', {
        alias: ['m'],
        describe: 'Contract to deploy',
        choices: listEnumVariantNames(SupportedModule),
      })
      .option('output', {
        alias: ['o'],
        describe: 'Path to the output file, where info about deployed contract is saved',
      })
      .option('override', {
        alias: ['x'],
        describe: 'Override existing contract info',
      })
      .demandOption(['module']))) as unknown as Argv<DeployContractArgs>;
  }, deploy)
  .command('observe', 'Observe public state of deployed contract', (yargs: Argv) => {
    return extendWalletLoadingOptions(extendRestoreContractOptions(yargs
      .option('raw', {
        type: 'boolean',
        describe: 'Skip ledger deserialization, printing the raw state'
      })
      .option('watch', {
        type: 'boolean',
        describe: 'Stream changes of contract state',
      })));
  }, observe)
  .command('interact', 'Interact with deployed contract', (yargs: Argv) => {
    return extendWalletLoadingOptions(extendRestoreContractOptions(yargs
      .option('arguments', {
        type: 'string',
        describe: 'Arguments of the constructor in javascript array format',
        default: '[]'
      })
      .option('circuit', {
        type: 'string',
        describe: 'Name of circuit to be called',
      })
      .demandOption(['circuit'])
    ))
  }, interact)
  .env('CAP')
  .demandCommand()
  .wrap(null)
  .showHelpOnFail(false)
  .fail((msg, err) => {
    if (msg) {
      console.log(msg);
    } else {
      // err.stack = ''
      console.dir(err, {
        depth: null
      });
    }
    process.exit(1);
  })
  .parse()
