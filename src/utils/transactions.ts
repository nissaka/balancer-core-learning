import {
  Account,
  Connection,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';

export async function sendTransaction(
  connection: Connection,
  wallet: any,
  instructions: TransactionInstruction[],
  signers: Account[],
  awaitConfirmation = true,
): Promise<string> {
  let transaction = new Transaction();

  instructions.forEach(instruction => transaction.add(instruction));

  transaction.recentBlockhash = (
    await connection.getRecentBlockhash('max')
  ).blockhash;

  transaction.setSigners(
    // fee payied by the wallet owner
    wallet.publicKey,
    ...signers.map(s => s.publicKey),
  );

  if (signers.length > 0) {
    transaction.partialSign(...signers);
  }

  transaction = await wallet.signTransaction(transaction);

  const rawTransaction = transaction.serialize();
  const options = {
    skipPreflight: true,
    commitment: 'singleGossip',
  };

  const txid = await connection.sendRawTransaction(rawTransaction, options);

  if (awaitConfirmation) {
    const status = (
      await connection.confirmTransaction(
        txid,
        options && (options.commitment as any),
      )
    ).value;

    if (status?.err) {
      throw status.err;
    }
  }

  return txid;
}
