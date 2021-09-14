import {
    Account,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
PublicKey: Uint8Array;
SecretKey: Uint8Array;

const config = {
    VERSION: "1.1.0",
    URL: "https://api.raydium.io",
    setting: { slippage: 0 },
    endpoint:"Raydium Pool",
    publicKey: new Uint8Array(),
    secretKey: new Uint8Array(),
};
export default config;
