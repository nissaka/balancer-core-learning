const {
    Connection,
    clusterApiUrl,
    Keypair,
    TransactionInstruction,
    SystemProgram,
    Transaction,
    LAMPORTS_PER_SOL
} = require("@solana/web3.js");
const { nu64, struct, u8 } =require("buffer-layout")

// get Connection
const connection = new Connection(
    clusterApiUrl("devnet"),
    "confirmed"
);

console.log(await connection.getEpochInfo());

// get wallet
const keypair1={
    publicKey: [
      203, 223,  40, 209, 219, 111, 157,
      167, 240, 203, 139,  98, 218, 158,
      239, 142, 136,  79,  17, 167, 104,
      166, 229, 160, 221, 200, 151,  54,
       73, 189,   9,  44
    ],
    secretKey: [
       14, 199, 124, 164, 220,  83, 157, 226, 161,  59,  33,
      113,  25,  72, 185,  40, 157, 136, 155, 159, 214, 160,
        9, 243, 255, 253,  40,  83,  53, 127, 107, 130, 203,
      223,  40, 209, 219, 111, 157, 167, 240, 203, 139,  98,
      218, 158, 239, 142, 136,  79,  17, 167, 104, 166, 229,
      160, 221, 200, 151,  54,  73, 189,   9,  44
    ]
};

const keypair2 ={
    publicKey: [
        242, 181,  48,  46, 134,  67, 148,  63,
        58, 253,  68, 219,  64, 223, 201, 103,
        37,  86, 166,  63, 253,  52, 192, 239,
        87, 133,  89, 137, 202, 183, 143,   6
    ],
    secretKey: [
        215,  32, 167, 249, 234, 121,  60,  34, 118, 168, 243,
        235,  18,  34, 218, 184,  46, 137, 240, 203,  50,  84,
        201, 236, 123,  49, 220, 149,  23,  62, 188, 192, 242,
        181,  48,  46, 134,  67, 148,  63,  58, 253,  68, 219,
        64, 223, 201, 103,  37,  86, 166,  63, 253,  52, 192,
        239,  87, 133,  89, 137, 202, 183, 143,   6
    ]
  }

const from =Keypair(keypair1);
const to=Keypair(keypair2);

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

// get teansaction
const getTransaction = () => {
    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: from.publicKey,
            toPubkey: to.publicKey,
            lamports: LAMPORTS_PER_SOL / 100,
        })
    );
};
