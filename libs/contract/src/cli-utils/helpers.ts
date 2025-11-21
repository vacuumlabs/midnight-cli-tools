import {ArgumentsCamelCase, Argv} from "yargs";

import {PrivateStateArgs, RestoreDeployedContractArgs} from "./types.js";
import {SupportedModule} from "../loadedContracts.js";

export function listEnumVariantNames(enumType: any): string[] {
  return Object.keys(enumType)
    .map((key) => enumType[key])
    .filter((value) => typeof value === 'string');
}

export async function evaluateWithExtensions(jsCode: string) {
  // @ts-ignore
  const util = await import("../util/index.js");

  return eval(jsCode);
}

export async function buildPrivateState<T extends object>(args: (string | number)[], object?: T): Promise<T> {
  // Much wow, much safety 🤩

  // @ts-ignore
  const util = await import("../util/index.js");


  let privateState = object ?? ({} as T);
  for (const expression of args) {
    if (typeof expression === 'number') {
      throw new Error('Expected private state property in format `<propertyName>=<expression>`', {
        cause: {
          got: expression
        }
      });
    }

    eval(expression);
  }

  return privateState;
}

async function addPrivateState<T extends {
  privateState: (string | number)[] | undefined,
  "private-state": (string | number)[] | undefined,
}>(args: ArgumentsCamelCase<T>): Promise<void> {
  if (args.privateState == null || args.privateState.length == 0) {
    args.privateState = undefined;
    return;
  }

  const privateState = await buildPrivateState(args.privateState);

  (args as any).privateState = privateState;
  (args as any)['private-state'] = privateState;
}

export function extendPrivateStateOptions<T>(yargs: Argv<T>): Argv<T & PrivateStateArgs> {
  return yargs.array("private-state")
    .middleware((args) => addPrivateState(args)) as unknown as Argv<T & PrivateStateArgs>;
}

export function extendRestoreContractOptions<T>(yargs: Argv<T>): Argv<T & RestoreDeployedContractArgs> {
  return extendPrivateStateOptions(yargs
    .option("module", {
      description: "Module name of deployed contract",
      type: "string",
      choices: listEnumVariantNames(SupportedModule)
    })
    .option("address", {
      description: "Address of deployed contract",
      type: "string",
    })
    .option("contract", {
      description: "Path to serialized deployed contract information",
      type: "string"
    })
    .check(argv => {
      const hasContractPath = argv.contract != null;
      const hasModuleInfo = argv.module != null && argv.address != null;

      if (hasContractPath && hasModuleInfo) {
        throw new Error("Both contract path and module information options provided, only one can be used");
      }

      if (!hasContractPath && !hasModuleInfo) {
        throw new Error("Either contract path or module info is required");
      }

      return argv;
    })) as unknown as Argv<T & RestoreDeployedContractArgs>;
}
