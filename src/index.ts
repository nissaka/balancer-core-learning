import { placeOrder } from "./components/order";
import solanaWeb3, { Ed25519Keypair } from "@solana/web3.js";
import config from "./config/config";

// interface Ed25519Keypair {
//     publicKey: Uint8Array;
//     secretKey: Uint8Array;
// }
/**
 * swap step
 */
// 配置文件的密钥
const publicKey = config.publicKey;
const secretKey = config.secretKey;
const keyPair: Ed25519Keypair = {
    publicKey,
    secretKey,
};
// 生成对应的wallet和connect对象 这一步可能生成的不对 文档中没找到对应的raydium接口
const wallet = new solanaWeb3.Keypair(keyPair);
const connect = new solanaWeb3.Connection(config.endpoint);

// /src/utils/pools.ts 中的自动化证券商id
const ammId = "7PGNXqdhrpQoVS5uQs9gjT1zfY6MUzEeYHopRnryj7rm";
// /src/utils/tokens.ts 对应币的mintAddress
const fromCoinMintAddress = "11111111111111111111111111111111";
const toCoinMintAddress = "So11111111111111111111111111111111111111112";

// tokenAccountPubkey.toBase58()
const fromAddress = "";
const toAddress = "";

// amount In Out
const aIn = 0;
const aOut = 0;

const data = {
    connect,
    wallet,
    ammId,
    fromCoinMintAddress,
    toCoinMintAddress,
    fromAddress,
    toAddress,
    aIn,
    aOut,
};

placeOrder("swap", data);
