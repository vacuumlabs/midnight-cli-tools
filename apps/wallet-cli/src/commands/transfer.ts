import {TransferArgs} from "../types.js";
import {WalletBuilder} from "@cap/wallet";

export async function transfer(args: TransferArgs) {
  const wallet = await WalletBuilder.load(args);
  wallet.start();

  try {
    const transferRecipe = await wallet.transferTransaction([
      {
        amount: BigInt(args.amount),
        type: args.type,
        receiverAddress: args.receiver,
      }
    ]);

    console.log('Proving transfer transaction. This might take a minute ...');
    const provenTransaction = await wallet.proveTransaction(transferRecipe);
    console.log('Transaction proven. Submitting.');
    const transactionIdentifier = await wallet.submitTransaction(provenTransaction);
    console.log('Transaction submitted. It may take a while this changes propagate', {transactionIdentifier})
  } finally {
    await wallet.close();
    await wallet.dumpToFile(args.wallet);
  }
}
