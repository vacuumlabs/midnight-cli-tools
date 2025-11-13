import {ObserveContractArgs} from "../types.js";

import {setNetworkId} from "@midnight-ntwrk/midnight-js-network-id";

import {WalletBuilder} from "@cap/wallet";
import {RestoredContract, toPrintableLedgerState} from "@cap/contract";
import {runWatchMode} from "@cap/tui";

export async function observe(args: ObserveContractArgs) {
  const wallet = await WalletBuilder.load(args);
  wallet.start();

  const restoredContract = await RestoredContract.load(args);
  setNetworkId(restoredContract.networkId);

  const contractProviders = await wallet.buildContractProviders(restoredContract.contract.contractBaseDir, args);

  if (args.watch) {
    const observableState = restoredContract.getObservablePublicState(contractProviders, true);
    runWatchMode(wallet, observableState);
  } else {
    const publicState= await restoredContract.getPublicState(contractProviders);
    console.log(toPrintableLedgerState(publicState));
    wallet.close();
  }
}
