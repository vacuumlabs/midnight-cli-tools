import {LoadedContract, loadedContracts, SupportedModule} from "../loadedContracts.js";
import {getNetworkId, NetworkId} from "@midnight-ntwrk/midnight-js-network-id";
import {ContractProviders} from "@midnight-ntwrk/midnight-js-contracts";
import asyncFs from "node:fs/promises";
import {RestoreDeployedContractArgs} from "../cli-utils/index.js";
import fs from "node:fs";
import {BlockHashConfig, BlockHeightConfig, ContractStateObservableConfig} from "@midnight-ntwrk/midnight-js-types";
import {map, Observable} from "rxjs";
import {toPrintableLedgerState} from "./index.js";

export type SerializableContract = {
  moduleName: SupportedModule,
  contractAddress: string,
  networkId: NetworkId,
  privateState?: any,
};

export class RestoredContract {
  readonly contract: LoadedContract<any>;
  readonly contractAddress: string;
  readonly networkId: NetworkId;
  readonly privateState: any | undefined;

  constructor(contract: LoadedContract<any>, contractAddress: string, networkId?: NetworkId, privateState?: any) {
    this.contract = contract;
    this.contractAddress = contractAddress;
    this.networkId = networkId ?? getNetworkId();
    this.privateState = privateState;
  }

  public async dumpToFile(outputFile: string, override?: boolean): Promise<string> {
    let path;
    if (outputFile.endsWith('.contract.json')) {
      path = outputFile;
    } else if (outputFile.endsWith('.json')) {
      const len = outputFile.length;
      const withoutExtension = outputFile.substring(0, len - '.json'.length);
      path = `${withoutExtension}.wallet.json`;
    } else {
      path = `${outputFile}.wallet.json`;
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

  public async getPublicState(contractProviders: ContractProviders, config?: BlockHeightConfig | BlockHashConfig): Promise<any> {
    const state = await contractProviders.publicDataProvider.queryContractState(this.contractAddress, config);
    if (state == null) {
      return state;
    }

    return this.contract.module.ledger(state.data);
  }

  public getObservablePublicState(
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

  static async load(args: RestoreDeployedContractArgs): Promise<RestoredContract> {
    if (args.contract != null) {
      const rawContractInfo = await asyncFs.readFile(args.contract, 'utf-8');
      const restoreInfo: SerializableContract = JSON.parse(rawContractInfo);
      const contract = loadedContracts[restoreInfo.moduleName];

      return new RestoredContract(contract, restoreInfo.contractAddress, restoreInfo.networkId, restoreInfo.privateState);
    } else {
      const contract = loadedContracts[args.module];

      return new RestoredContract(contract, args.address, undefined, args.privateState);
    }
  }
}
