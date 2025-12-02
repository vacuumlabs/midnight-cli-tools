import {
  ContractClass,
  LoadedContract,
  loadedContracts,
  SupportedModule
} from "../loadedContracts.js";
import {getNetworkId, NetworkId} from "@midnight-ntwrk/midnight-js-network-id";
import {ContractProviders} from "@midnight-ntwrk/midnight-js-contracts";
import asyncFs from "node:fs/promises";
import {RestoreDeployedContractArgs} from "../cli-utils/index.js";
import fs from "node:fs";
import {
  BlockHashConfig,
  BlockHeightConfig, Contract,
  ContractStateObservableConfig,
} from "@midnight-ntwrk/midnight-js-types";
import {firstValueFrom, map, Observable} from "rxjs";
import {toPrintableLedgerState} from "./index.js";
import {WitnessContext, witnessContext} from "@midnight-ntwrk/compact-runtime";
import {ContractState, StateValue} from "@midnight-ntwrk/ledger";

export type SerializableContract = {
  moduleName: SupportedModule,
  contractAddress: string,
  networkId: NetworkId,
  privateState?: any,
};

type WitnessCircuitId<TContract extends Contract = Contract> = keyof TContract['witnesses'] & string;
type WitnessParameters<TContract extends Contract<TPrivateState>, TWitness extends WitnessCircuitId<TContract>, TPrivateState = any> =
  Parameters<TContract['witnesses'][TWitness]> extends [WitnessContext<any, TPrivateState>, ...infer TParams] ? TParams : never;
type WitnessReturnType<TContract extends Contract<TPrivateState>, TWitness extends WitnessCircuitId, TPrivateState = any> =
  ReturnType<TContract['witnesses'][TWitness]> extends [TPrivateState, ...infer TRest] ? TRest : never;

type WitnessCallInterface<TContract extends Contract<TPrivateState>, TPrivateState = any> = {
  [TWitnessId in WitnessCircuitId<TContract>]: (...args: WitnessParameters<TContract, TWitnessId>) => [...WitnessReturnType<TContract, TWitnessId>];
};

type WitnessCallInterfaceOf<TContract, TPrivateState = any> = TContract extends Contract<TPrivateState>
  ? WitnessCallInterface<TContract, TPrivateState>
  : never;

export class RestoredContract<TSupportedModule extends SupportedModule = any, TPrivateState = any> {
  readonly contract: LoadedContract<TSupportedModule, TPrivateState>;
  readonly contractAddress: string;
  readonly networkId: NetworkId;
  readonly privateState?: TPrivateState;

  constructor(contract: LoadedContract<TSupportedModule>, contractAddress: string, networkId?: NetworkId, privateState?: any) {
    this.contract = contract;
    this.contractAddress = contractAddress;
    this.networkId = networkId ?? getNetworkId();
    this.privateState = privateState;
  }

  public async dumpToFile(outputFile: string, override?: boolean): Promise<string> {
    let path;
    if (outputFile.endsWith('.cnt.json')) {
      path = outputFile;
    } else if (outputFile.endsWith('.json')) {
      const len = outputFile.length;
      const withoutExtension = outputFile.substring(0, len - '.json'.length);
      path = `${withoutExtension}.cnt.json`;
    } else {
      path = `${outputFile}.cnt.json`;
    }

    if (!override) {
      let alreadyExists = false;

      try {
        await asyncFs.access(path, fs.constants.F_OK);
        alreadyExists = true;
      } catch (error) {
        const typeError: { code: string | undefined } = error as { code: string | undefined };

        if (typeError.code !== 'ENOENT') {
          throw error;
        }
      }

      if (alreadyExists) {
        throw new Error("Contract already exists", {
          cause: {
            path
          }
        });
      }
    }

    let serializableContract: SerializableContract = {
      moduleName: this.contract.moduleName,
      contractAddress: this.contractAddress,
      networkId: this.networkId,
      privateState: this.privateState,
    };

    await asyncFs.writeFile(path, JSON.stringify(serializableContract, null, 2));
    return path;
  }

  public async sync(contractProviders: ContractProviders): Promise<void> {
    await firstValueFrom(this.getObservableLedger(contractProviders));
  }

  public async getLedger(contractProviders: ContractProviders, config?: BlockHeightConfig | BlockHashConfig): Promise<any> {
    const state = await contractProviders.publicDataProvider.queryContractState(this.contractAddress, config);
    if (state == null) {
      return state;
    }

    return this.contract.module.ledger(state.data);
  }

  public getObservableLedger(
    contractProviders: ContractProviders,
    asPrintable?: boolean,
    config?: ContractStateObservableConfig
  ): Observable<any> {
    return contractProviders.publicDataProvider.contractStateObservable(this.contractAddress, config ?? {type: 'latest'})
      .pipe(map((cState) => {
        let value = this.contract.module.ledger(cState.data);
        if (asPrintable) {
          value = toPrintableLedgerState(value);
        }
        return value;
      }));
  }

  public async getFullStateRepresentation(contractProviders: ContractProviders, config?: BlockHeightConfig | BlockHashConfig): Promise<{
    zswapState: string,
    contractState: string,
  }> {
    let [zswapState, contractState] = (await contractProviders.publicDataProvider.queryZSwapAndContractState(this.contractAddress, config))!;
    return {
      zswapState: zswapState.toString(true),
      contractState: contractState.toString(true),
    }
  }

  public async getContractStateValue(contractProviders: ContractProviders, config?: BlockHeightConfig | BlockHashConfig): Promise<StateValue | undefined> {
    return (await contractProviders.publicDataProvider.queryContractState(this.contractAddress, config))?.data;
  }

  public getObservableContractState<T extends boolean | undefined>(contractProviders: ContractProviders, asPrintable?: T, config?: BlockHeightConfig | BlockHashConfig): Observable<ContractState | string> {
    return contractProviders.publicDataProvider.contractStateObservable(this.contractAddress, config ?? {type: 'latest'})
      .pipe(map((state) => {
        if (asPrintable) {
          return state.data.toString(true);
        } else {
          return state;
        }
      }));
  }

  public async getCallableWitnesses(providers: ContractProviders<ContractClass<TSupportedModule>>): Promise<WitnessCallInterfaceOf<ContractClass<TSupportedModule>>> {
    const ledger = await this.getLedger(providers);
    const witnessCtx = witnessContext(ledger, this.privateState, this.contractAddress);
    const witnessCallInterface: WitnessCallInterfaceOf<ContractClass<TSupportedModule>> = {} as any;

    for (const property of Object.getOwnPropertyNames(this.contract.instance.witnesses)) {
      (witnessCallInterface as any)[property] = (...params: any) => {
        const vals = (this.contract.instance.witnesses as any)[property](witnessCtx, ...params);
        return (vals as Array<any>).slice(1);
      };
    }

    return witnessCallInterface;
  };

  static async load(args: RestoreDeployedContractArgs): Promise<RestoredContract> {
    if (args.contract != null) {
      const rawContractInfo = await asyncFs.readFile(args.contract, 'utf-8');
      const restoreInfo: SerializableContract = JSON.parse(rawContractInfo);
      const contract = loadedContracts[restoreInfo.moduleName];

      return new RestoredContract(contract, restoreInfo.contractAddress, restoreInfo.networkId, restoreInfo.privateState);
    } else {
      const contract = loadedContracts[args.module as SupportedModule];

      return new RestoredContract(contract, args.address as string, undefined, args.privateState);
    }
  }

  static async loadAs<TSupportedModule extends SupportedModule, TPrivateState = any>(args: {
    privateState?: any,
    module: TSupportedModule,
    address: string,
  }): Promise<RestoredContract<TSupportedModule, TPrivateState>> {
    return await RestoredContract.load(args);
  }
}
