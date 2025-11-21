import {Argv} from 'yargs';
import {
  AddressDerivationArgs,
  WalletBuilderArgs,
  WalletLoadingArgs
} from "./types.js";
import {Roles} from "../sdk-hd/index.js";
import {
  NetworkId as MidnightNetworkId,
  setNetworkId
} from "@midnight-ntwrk/midnight-js-network-id";

export function listEnumVariantNames(enumType: any): string[] {
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

export function extendWalletBuildingOptions<T>(
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
      description: 'Type of network to which wallet belongs to',
      type: 'string',
      choices: listEnumVariantNames(MidnightNetworkId),
      default: MidnightNetworkId.TestNet
    })
    .middleware((args) => {
      setNetworkId(args.networkId as MidnightNetworkId);
    }) as unknown as Argv<T & WalletBuilderArgs>;
}

export function extendWalletLoadingOptions<T>(yargs: Argv<T>): Argv<T & WalletLoadingArgs> {
  return extendAddressDerivationOptions(extendWalletBuildingOptions(yargs))
    .option('wallet', {
      description: 'Path to serialized wallet info produced with `generate` command',
      type: "string",
    })
    .demandOption('wallet') as Argv<T & WalletLoadingArgs>;
}
