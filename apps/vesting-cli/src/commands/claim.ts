import {VestmentArgs} from "../types.js";
import {contractUtil, vestingContractData} from "./common.js";

export async function claim(args: VestmentArgs) {
  const vestmentId = contractUtil.sizedBytesFrom(contractUtil.fromHex(args.vestmentId), 32);
  const {
    wallet,
    deployedContract,
  } = await vestingContractData(args);
  wallet.start();
  await wallet.syncedState();

  const tx = await deployedContract.callTx.claim(vestmentId);
  const [claimedAmount, maybeRemaining] = tx.private.result;

  let remainingAmount = null;
  if (maybeRemaining.is_some) {
    remainingAmount = maybeRemaining.value;
  }

  console.log('Claimed', {
    claimedAmount,
    remainingAmount
  });

  await wallet.close();
}
