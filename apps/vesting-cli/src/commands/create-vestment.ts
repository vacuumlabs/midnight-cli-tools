import {CreateVestmentArgs} from "../types.js";
import {contractUtil, vestingContractData} from './common.js'

import {
  createCoinInfo,
  encodeCoinInfo,
} from "@midnight-ntwrk/ledger";

export async function createVestment(args: CreateVestmentArgs) {
  const amount = contractUtil.argToBigInt(args.amount);
  const duration = contractUtil.argToBigInt(args.duration);
  const coinInfo = createCoinInfo(args.tokenType, amount);
  const encodedCoinInfo = encodeCoinInfo(coinInfo);
  const beneficiary = contractUtil.argToCoinAddress(args.beneficiary);

  const {
    wallet,
    deployedContract,
  } = await vestingContractData(args);
  wallet.start();
  await wallet.syncedState();

  const tx = await deployedContract.callTx.createVestment(
    encodedCoinInfo,
    duration,
    beneficiary,
  );

  console.log('New vestment created', {
    vestmentId: contractUtil.toHex(tx.private.result),
    txInfo: {
      txHash: tx.public.txHash,
      txId: tx.public.txId,
      blockHash: tx.public.blockHash,
      blockHeight: tx.public.blockHeight,
    }
  })

  wallet.close();
}
