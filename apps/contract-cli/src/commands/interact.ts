import {WalletBuilder} from "@cap/wallet";
import {RestoredContract, toPrintableLedgerState} from "@cap/contract";
import {InteractArgs} from "../types.js";
import {Contract} from "@midnight-ntwrk/midnight-js-types";
import {evaluateWithExtensions} from "@cap/contract/cli-utils";
import {findDeployedContract} from "@midnight-ntwrk/midnight-js-contracts";

export async function interact(args: InteractArgs): Promise<void> {
  const wallet = await WalletBuilder.load(args);
  wallet.start();

  const restoredContract = await RestoredContract.load(args);
  const contractProviders = await wallet.buildContractProviders(restoredContract.contract.contractBaseDir, args);

  const initialPrivateState = args.privateState ?? restoredContract.contract.initialPrivateState;

  console.log("Searching for deployed contract", {
    address: restoredContract.contractAddress
  })

  const foundDeployedContract = await findDeployedContract(contractProviders as any, {
    contractAddress: restoredContract.contractAddress,
    contract: restoredContract.contract.instance as Contract,
    privateStateId: restoredContract.contract.privateStateId,
    initialPrivateState: initialPrivateState
  });

  const circuitTxConstructor = foundDeployedContract.callTx[args.circuit];
  if (circuitTxConstructor == null) {
    throw new Error('Circuit not found', {
      cause: {
        circuit: args.circuit
      }
    });
  }

  console.log("Parsing args", {
    args: args.arguments
  });
  const constructorArgs = await evaluateWithExtensions(args.arguments);
  console.log("Calling circuit", {
    circuitName: args.circuit,
    circuit: circuitTxConstructor,
    args: constructorArgs,
  });
  const tx = await circuitTxConstructor(...constructorArgs);
  console.log(tx);
  console.log(toPrintableLedgerState(initialPrivateState));

  // TODO: Finish this.

  wallet.close();
}

