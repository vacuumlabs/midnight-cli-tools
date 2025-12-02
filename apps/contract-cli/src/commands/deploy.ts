import {WalletBuilder} from '@cap/wallet';

import {deployContract} from '@midnight-ntwrk/midnight-js-contracts';
import {
  getNetworkId,
} from '@midnight-ntwrk/midnight-js-network-id';

import {DeployContractArgs} from '../types.js';
import {loadedContracts, RestoredContract} from "@cap/contract";


export async function deploy(args: DeployContractArgs) {
  const wallet = await WalletBuilder.load(args);
  wallet.start();
  await wallet.syncedState();

  const loadedContract = loadedContracts[args.module];

  const contractProviders = await wallet.buildContractProviders(loadedContract.contractBaseDir, args);

  const initialPrivateState = (args.privateState ?? loadedContract.initialPrivateState);

  console.log('Deploying contract', {
    contractDir: loadedContract.contractBaseDir,
    networkId: getNetworkId(),
  });

  const deployedContract = await deployContract(contractProviders, {
    privateStateId: loadedContract.privateStateId,
    contract: loadedContract.instance,
    initialPrivateState: initialPrivateState,
    args: loadedContract.initialStateParameters,
  });

  console.log('Contract deployed', {
    networkId: getNetworkId(),
    contractModule: args.module,
    contractAddress: deployedContract.deployTxData.public.contractAddress,
    privateState: initialPrivateState,
  });

  if (args.output != null) {
    const contract = new RestoredContract(loadedContract, deployedContract.deployTxData.public.contractAddress, getNetworkId(), initialPrivateState);
    const path = await contract.dumpToFile(args.output, args.override);
    console.log('Contract stored', {
      path
    });
  }

  wallet.close();
}

