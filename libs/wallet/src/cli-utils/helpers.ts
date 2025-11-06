import {Argv} from 'yargs';
import {AddressDerivationArgs, WalletBuilderArgs} from "./types.js";
import {Roles} from "../sdk-hd/index.js";
import {NetworkId} from "@midnight-ntwrk/zswap";

function listEnumVariantNames(enumType: any): string[] {
  return Object.keys(enumType)
    .map((key) => enumType[key])
    .filter((value) => typeof value === 'string');
}

export function extendAddressDerivationOptions<T>(
  yargs: Argv<T>
): Argv<T & AddressDerivationArgs> {
  return yargs
    .option('select-account', {
      type: 'number',
      description: 'Which account to select when deriving wallet address',
      default: 0,
    })
    .option('address-role', {
      type: 'string',
      description: 'Role of the address used when deriving the wallet',
      choices: listEnumVariantNames(Roles),
      default: 'Zswap',
    })
    .options('derivation-index', {
      type: 'number',
      description: 'Index of derived address',
      default: 0,
    }) as unknown as Argv<T & AddressDerivationArgs>;
}

export function extendWalletBuilderOptions<T>(
  yargs: Argv<T>
): Argv<T & WalletBuilderArgs> {
  return yargs
    .option('indexer-url', {
      description: 'URL to Midnight Indexer',
      default: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
    })
    .option('indexer-ws-url', {
      description: 'URL to WebSocket of Midnight Indexer',
      default: 'wss://indexer.testnet-02.midnight.network/api/v1/graphql/ws',
    })
    .option('prover-url', {
      description: 'URL to prover server',
      default: 'http://localhost:6300',
    })
    .option('node-url', {
      description: 'URL to the Midnight Node',
      default: 'https://rpc.testnet-02.midnight.network',
    })
    .option('network-id', {
      description: 'Type of network',
      choices: listEnumVariantNames(NetworkId),
      default: 'TestNet',
    }) as unknown as Argv<T & WalletBuilderArgs>;
}
