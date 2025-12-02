import {hideBin} from "yargs/helpers";
import yargs, {Argv} from "yargs";
import {extendWalletLoadingOptions} from "@cap/wallet/cli-utils";
import {createVestment} from "./commands/index.js";
import {CommonArgs} from "./types.js";
import {nativeToken} from "@midnight-ntwrk/ledger";
import {vestmentInfo} from "./commands/vestment-info.js";
import {claim} from "./commands/claim.js";

extendWalletLoadingOptions(
  yargs(hideBin(process.argv))
    .option('address', {
      description: 'Deployed contract address',
      type: 'string',
    })
    .demandOption('address')
)
  .command('createVestment', 'Create new vestment', (yargs: Argv<CommonArgs>) => {
    return yargs
      .option('tokenType', {
        description: 'Type of the coin token to be used for vestment',
        alias: ['t'],
        default: nativeToken(),
        type: 'string',
      })
      .options('amount', {
        description: 'Amount to be vested. Must be an integer value',
        alias: ['a'],
        type: 'number',
      })
      .option('duration', {
        description: 'Duration of the vestment in seconds',
        alias: ['d'],
        type: 'number',
      })
      .option('beneficiary', {
        description: 'bech32m address or hex encoded coin public key',
        alias: ['b'],
        type: 'string'
      })
      .demandOption(['tokenType', 'amount', 'duration', 'beneficiary']);
  }, createVestment)
  .command('vestmentInfo', 'Get existing vestment info', (yargs: Argv<CommonArgs>) => {
    return yargs
      .option('vestmentId', {
        description: 'Hex encoded 32 bytes ID of the existing vestment',
        alias: ['id'],
        type: 'string',
      })
      .demandOption(['vestmentId']);
  }, vestmentInfo)
  .command('claim', 'Send all claimable coins to the beneficiary of specific vesting contract', (yargs: Argv<CommonArgs>) => {
    return yargs
      .option('vestmentId', {
        description: 'Hex encoded 32 bytes ID of the existing vestment',
        alias: ['id'],
        type: 'string',
      })
      .demandOption(['vestmentId']);
  }, claim)
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
