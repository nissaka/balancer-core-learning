const {
    Connection,
    clusterApiUrl,
    Keypair,
    TransactionInstruction,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL,
    PublicKey,
    sendAndConfirmTransaction,
} = require("@solana/web3.js");
const { nu64, struct, u8 } = require("buffer-layout");
const { getTokenByMintAddress, NATIVE_SOL, TOKENS } = require("../utils/token");
const { TokenAmount } = require("../utils/safe-math");
const {
    createAssociatedTokenAccountIfNotExist,
    createTokenAccountIfNotExist,
} = require("../utils/web3");
const { closeAccount } = require("@project-serum/serum/lib/token-instructions");

// get instruction
const swapInstruction = (
    // tokenProgramId,
    programId,
    // amm
    ammId,
    ammAuthority,
    ammOpenOrders,
    ammTargetOrders,
    poolCoinTokenAccount,
    poolPcTokenAccount,
    // serum
    serumProgramId,
    serumMarket,
    serumBids,
    serumAsks,
    serumEventQueue,
    serumCoinVaultAccount,
    serumPcVaultAccount,
    serumVaultSigner,
    // user
    userSourceTokenAccount,
    userDestTokenAccount,
    userOwner,
    // amount
    amountIn,
    minAmountOut
) => {
    const dataLayout = struct([
        u8("instruction"),
        nu64("amountIn"),
        nu64("minAmountOut"),
    ]);

    const keys = [
        // spl token
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        // amm
        { pubkey: ammId, isSigner: false, isWritable: true },
        { pubkey: ammAuthority, isSigner: false, isWritable: false },
        { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
        { pubkey: ammTargetOrders, isSigner: false, isWritable: true },
        { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
        // serum
        { pubkey: serumProgramId, isSigner: false, isWritable: false },
        { pubkey: serumMarket, isSigner: false, isWritable: true },
        { pubkey: serumBids, isSigner: false, isWritable: true },
        { pubkey: serumAsks, isSigner: false, isWritable: true },
        { pubkey: serumEventQueue, isSigner: false, isWritable: true },
        { pubkey: serumCoinVaultAccount, isSigner: false, isWritable: true },
        { pubkey: serumPcVaultAccount, isSigner: false, isWritable: true },
        { pubkey: serumVaultSigner, isSigner: false, isWritable: false },
        { pubkey: userSourceTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userDestTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userOwner, isSigner: true, isWritable: false },
    ];

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 9,
            amountIn,
            minAmountOut,
        },
        data
    );

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
};

// get transaction
const swap = async (
    connection,
    wallet,
    poolInfo,
    fromCoinMint,
    toCoinMint,
    fromTokenAccount,
    toTokenAccount,
    aIn,
    aOut
) => {
    const transaction = new Transaction();
    const signers = [];
    const owner = wallet.publicKey;

    const from = getTokenByMintAddress(fromCoinMint);
    const to = getTokenByMintAddress(toCoinMint);
    if (!from || !to) {
        throw new Error("Miss token info");
    }

    const amountIn = new TokenAmount(aIn, from.decimals, false);
    const amountOut = new TokenAmount(aOut, to.decimals, false);

    let fromMint = fromCoinMint;
    let toMint = toCoinMint;

    if (fromMint === NATIVE_SOL.mintAddress) {
        fromMint = TOKENS.WSOL.mintAddress;
    }
    if (toMint === NATIVE_SOL.mintAddress) {
        toMint = TOKENS.WSOL.mintAddress;
    }

    let wrappedSolAccount = null;
    let wrappedSolAccount2 = null;

    if (fromCoinMint === NATIVE_SOL.mintAddress) {
        wrappedSolAccount = await createTokenAccountIfNotExist(
            connection,
            wrappedSolAccount,
            owner,
            TOKENS.WSOL.mintAddress,
            getBigNumber(amountIn.wei) + 1e7,
            transaction,
            signers
        );
    }
    if (toCoinMint === NATIVE_SOL.mintAddress) {
        wrappedSolAccount2 = await createTokenAccountIfNotExist(
            connection,
            wrappedSolAccount2,
            owner,
            TOKENS.WSOL.mintAddress,
            1e7,
            transaction,
            signers
        );
    }

    const newFromTokenAccount = await createAssociatedTokenAccountIfNotExist(
        fromTokenAccount,
        owner,
        fromMint,
        transaction
    );
    const newToTokenAccount = await createAssociatedTokenAccountIfNotExist(
        toTokenAccount,
        owner,
        toMint,
        transaction
    );

    transaction.add(
        swapInstruction(
            new PublicKey(poolInfo.programId),
            new PublicKey(poolInfo.ammId),
            new PublicKey(poolInfo.ammAuthority),
            new PublicKey(poolInfo.ammOpenOrders),
            new PublicKey(poolInfo.ammTargetOrders),
            new PublicKey(poolInfo.poolCoinTokenAccount),
            new PublicKey(poolInfo.poolPcTokenAccount),
            new PublicKey(poolInfo.serumProgramId),
            new PublicKey(poolInfo.serumMarket),
            new PublicKey(poolInfo.serumBids),
            new PublicKey(poolInfo.serumAsks),
            new PublicKey(poolInfo.serumEventQueue),
            new PublicKey(poolInfo.serumCoinVaultAccount),
            new PublicKey(poolInfo.serumPcVaultAccount),
            new PublicKey(poolInfo.serumVaultSigner),
            wrappedSolAccount ?? newFromTokenAccount,
            wrappedSolAccount2 ?? newToTokenAccount,
            owner,
            Math.floor(getBigNumber(amountIn.toWei())),
            Math.floor(getBigNumber(amountOut.toWei()))
        )
    );

    if (wrappedSolAccount) {
        transaction.add(
            closeAccount({
                source: wrappedSolAccount,
                destination: owner,
                owner,
            })
        );
    }
    if (wrappedSolAccount2) {
        transaction.add(
            closeAccount({
                source: wrappedSolAccount2,
                destination: owner,
                owner,
            })
        );
    }

    const txid = await sendAndConfirmTransaction(connection, transaction, [
        wallet,
    ]);

    console.log(`txid: ${txid}`);
    return txid;
};

export { swap };
