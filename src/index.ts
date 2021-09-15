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

// connect 作为连接网络的对象 主要功能是在发起交易之前获取最新块的hash等任务
const connect = new solanaWeb3.Connection(config.endpoint);
// wallet对象承载的比较多 比如publicKey等 发起交易也需要对应wallet的sendTransaction方法
const wallet = new solanaWeb3.Keypair(keyPair);


// 举例: /src/utils/pools.ts 中的自动化证券商id
const ammId = "7PGNXqdhrpQoVS5uQs9gjT1zfY6MUzEeYHopRnryj7rm";
// 举例: /src/utils/tokens.ts 对应币的mintAddress
const fromCoinMintAddress = "11111111111111111111111111111111";
const toCoinMintAddress = "So11111111111111111111111111111111111111112";

// 对应账户的publicKey(string)作为输入值 tokenAccountPubkey.toBase58()
const fromAccount = "";
const toAccount = "";

// amount In Out
const aIn = 0;
const aOut = 0;

const data = {
    connect,
    wallet,
    ammId,
    fromCoinMintAddress,
    toCoinMintAddress,
    fromAccount,
    toAccount,
    aIn,
    aOut,
};

placeOrder("swap", data);
