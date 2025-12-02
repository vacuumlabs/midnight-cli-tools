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
    const observable = args.raw
      ? restoredContract.getObservableContractState(contractProviders, true)
      : restoredContract.getObservableLedger(contractProviders, true);
    runWatchMode(wallet, observable);
  } else {
    const state = args.raw
      ? (await restoredContract.getFullStateRepresentation(contractProviders))
      : toPrintableLedgerState(await restoredContract.getLedger(contractProviders));
    console.log(state);
    wallet.close();
  }
}
