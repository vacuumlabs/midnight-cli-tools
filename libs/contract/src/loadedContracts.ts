import * as BulletinBoard from "@cap/bulletin-board-contract/compiled";
import * as Counter from "@cap/counter-contract/compiled";
import * as Vesting from "@cap/vesting-contract/compiled";
import * as Test from "@cap/test-contract/compiled";
import * as Vote from "@cap/voting-contract/compiled";
import {createRequire} from "node:module";
import path from "node:path";
import {Contract, InitialStateParameters, Witnesses} from "@midnight-ntwrk/midnight-js-types";
import {privateStateForwardingWitnesses} from "@cap/contract";
import {randomBytes} from "@cap/contract";
import {MerkleTreePath, WitnessContext} from "@midnight-ntwrk/compact-runtime";
import {fromHex} from "./util/index.js";

const require = createRequire(import.meta.url);

export type ContractClassOf<TModule> =
  TModule extends { Contract: { new(...args: any[]): infer TContract } }
    ? TContract extends Contract
      ? TContract
      : never
    : never;

export type ContractClass<TSupportedModule extends SupportedModule> = ContractClassOf<(typeof loadedModules)[TSupportedModule]>;

function instantiateContract<TSupportedModule extends SupportedModule>(supportedModule: TSupportedModule, witnesses: any): ContractClass<TSupportedModule> {
  const module = loadedModules[supportedModule];

  return new (module.Contract as {
    new<T, TWitnesses extends Witnesses<T>>(witnesses: TWitnesses): Contract<any, TWitnesses>
  })(privateStateForwardingWitnesses(witnesses)) as ContractClass<TSupportedModule>;
}

function resolveContractPath(contractModule: string): string {
  const parsedPathToIndexFile = path.parse(require.resolve(contractModule));
  return path.resolve(parsedPathToIndexFile.dir, '..');
}

export class LoadedContract<
  TSupportedModule extends SupportedModule,
  TPrivateState = any,
> {
  readonly moduleName: TSupportedModule;
  readonly module: typeof loadedModules[TSupportedModule];
  readonly instance: ContractClass<TSupportedModule>;
  readonly privateStateId: string;
  readonly contractBaseDir: string;
  readonly initialPrivateState: TPrivateState;
  readonly initialStateParameters: InitialStateParameters<ContractClass<TSupportedModule>>;

  private constructor(
    supportedModule: TSupportedModule,
    initialPrivateState: TPrivateState,
    initialStateParams: InitialStateParameters<ContractClass<TSupportedModule>>,
    witnesses: any = {},
  ) {
    this.moduleName = supportedModule;
    this.module = loadedModules[supportedModule];
    this.instance = instantiateContract(supportedModule, witnesses);
    this.privateStateId = supportedModule;
    this.contractBaseDir = resolveContractPath(supportedModule);
    this.initialPrivateState = initialPrivateState;
    this.initialStateParameters = initialStateParams;
  }

  static create<
    TSupportedModule extends SupportedModule,
    TPrivateState,
  >(
    supportedModule: TSupportedModule,
    privateState: TPrivateState,
    {
      stateParams,
      customWitnesses
    }: {
      stateParams?: InitialStateParameters<ContractClass<TSupportedModule>> extends []
        ? undefined
        : InitialStateParameters<ContractClass<TSupportedModule>>,
      customWitnesses?: any,
    } = {}
  ): LoadedContract<TSupportedModule, TPrivateState> {
    return new LoadedContract(
      supportedModule,
      privateState,
      (stateParams ?? []) as InitialStateParameters<ContractClass<TSupportedModule>>,
      customWitnesses
    );
  }
}

export enum SupportedModule {
  BulletinBoard = '@cap/bulletin-board-contract/compiled',
  Counter = '@cap/counter-contract/compiled',
  VestingContract = '@cap/vesting-contract/compiled',
  TestContract = '@cap/test-contract/compiled',
  VotingContract = '@cap/voting-contract/compiled',
}

export const loadedModules = {
  [SupportedModule.BulletinBoard]: BulletinBoard,
  [SupportedModule.Counter]: Counter,
  [SupportedModule.VestingContract]: Vesting,
  [SupportedModule.TestContract]: Test,
  [SupportedModule.VotingContract]: Vote,
};

export const loadedContractConstructors = {
  [SupportedModule.BulletinBoard]: BulletinBoard.Contract,
  [SupportedModule.Counter]: Counter.Contract,
  [SupportedModule.VestingContract]: Vesting.Contract,
  [SupportedModule.VotingContract]: Vote.Contract,
}

export const loadedContracts = {
  [SupportedModule.BulletinBoard]: LoadedContract.create(
    SupportedModule.BulletinBoard,
    {
      localSecretKey: randomBytes(32),
    }
  ),
  [SupportedModule.Counter]: LoadedContract.create(
    SupportedModule.Counter,
    {},
    {
      stateParams: [0n]
    }
  ),
  [SupportedModule.VestingContract]: LoadedContract.create(
    SupportedModule.VestingContract,
    {}
  ),
  [SupportedModule.TestContract]: LoadedContract.create(
    SupportedModule.TestContract,
    {}
  ),
  [SupportedModule.VotingContract]: LoadedContract.create(
    SupportedModule.VotingContract,
    {},
    {
      stateParams: [[
        fromHex("DEADBEEF"),
        fromHex("DECAFBAD"),
        fromHex("8FA1AFE1"),
        fromHex("F00DF00D"),
      ]],
      customWitnesses: {
        findVotingKey(context: WitnessContext<Vote.Ledger, any>, votingKey: Uint8Array): [any, MerkleTreePath<Uint8Array>] {
          const path = context.ledger.authorizedVoters.findPathForLeaf(votingKey);
          if (path == null) {
            throw new Error("Not authorized voting key", {
              cause: {
                votingKey
              }
            });
          }

          return [
            context.privateState,
            path,
          ];
        }
      }
    }
  )
};
