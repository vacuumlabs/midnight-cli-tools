import * as contractUtil from "@cap/contract";
import {CommonArgs} from "../types.js";
import {RestoredContract, SupportedModule} from "@cap/contract";
import {ContractProviders, findDeployedContract, FoundContract} from "@midnight-ntwrk/midnight-js-contracts";
import {ExtendedWallet, WalletBuilder} from "@cap/wallet";

import {Contract as VestingContract} from "@cap/vesting-contract/compiled";

export {contractUtil};

export async function vestingContractData(args: CommonArgs): Promise<{
  wallet: ExtendedWallet,
  restoredContract: RestoredContract<SupportedModule.VestingContract>,
  contractProviders: ContractProviders<VestingContract<undefined>>,
  deployedContract: FoundContract<VestingContract<undefined>>
}> {
  const wallet = await WalletBuilder.load(args);
  const restoredContract = await RestoredContract.loadAs({
    module: SupportedModule.VestingContract,
    address: args.address
  });
  const contractProviders = await wallet.buildContractProviders(restoredContract.contract.contractBaseDir, args);
  const deployedContract = await findDeployedContract(contractProviders, {
    contractAddress: restoredContract.contractAddress,
    contract: restoredContract.contract.instance,
    privateStateId: restoredContract.contract.privateStateId,
    initialPrivateState: restoredContract.contract.initialPrivateState,
  });

  return {
    wallet,
    restoredContract,
    contractProviders: contractProviders as any,
    deployedContract: deployedContract as any,
  };
}
