import {VestmentArgs} from "../types.js";
import {contractUtil, vestingContractData} from './common.js';
import {
  decodeCoinPublicKey,
  decodeContractAddress,
  decodeQualifiedCoinInfo
} from "@midnight-ntwrk/ledger";


export async function vestmentInfo(args: VestmentArgs) {
  const vestmentId = contractUtil.sizedBytesFrom(contractUtil.fromHex(args.vestmentId), 32);
  const {
    wallet,
    deployedContract,
  } = await vestingContractData(args);
  wallet.start();
  await wallet.syncedState();

  const tx = await deployedContract.callTx.vestmentInfo(vestmentId);

  let beneficiaryType: 'CoinPublicKey' | 'ContractAddress';
  let beneficiary: string;
  if (tx.private.result.beneficiary.is_left) {
    beneficiaryType = 'CoinPublicKey';
    beneficiary = contractUtil.hexEncodedCoinPublicKeyToBech32m(decodeCoinPublicKey(tx.private.result.beneficiary.left.bytes));
  } else {
    beneficiaryType = 'ContractAddress';
    beneficiary = decodeContractAddress(tx.private.result.beneficiary.right.bytes);
  }

  console.log('Vestment info', {
    vestmentId: args.vestmentId,
    start: contractUtil.epochToDate(tx.private.result.start),
    end: contractUtil.epochToDate(tx.private.result.end),
    totalAmount: tx.private.result.totalAmount,
    claimableAmount: tx.private.result.claimableAmount,
    beneficiaryType,
    beneficiary,
    vestingCoin: decodeQualifiedCoinInfo(tx.private.result.vestingCoin),
  });

  wallet.close();
}
