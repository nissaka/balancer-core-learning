import { swap } from "./components/swap";
import { getConnection, getAccount } from "./components/connection";
import { getPrice, getPair, getToken, getPool } from "./components/listInfo";

const startSwap = async (
  net, // 选择连接的网络 'devnet' | 'testnet' | 'mainnet-beta'
  OwnerKeypair, // 用于生成用户钱包(流程中主要用到是公钥 wallet.publicKey)
  poolName, // getPool() 选中的pool信息
  fromCoinSymbolOrMint, // 币的mint地址或简写都可以
  toCoinSymbolOrMint, // 币的mint地址或简写都可以
  // 当上述两个的mint地址等于NATIVE_SOL的mint地址时 运行createTokenAccountIfNotExist()
  // 不等于NATIVE_SOL的mint地址时 运行createAssociatedTokenAccountIfNotExist()
  // 此时参数是以下两个Account(可以是number[],string,undefined或null) 故参数为account的公钥
  fromTokenAccount, // 用于创建不存在的关联token账户 主要是Token公钥 PublicKey
  toTokenAccount, // 用于创建不存在的关联token账户 主要是Token公钥 PublicKey
  aIn, // amountIn(strin, number 都可以) 1 Lamport的值为0.000000001 SOL
  aOut // minAmountOut(strin, number 都可以) 1 Lamport的值为0.000000001 SOL
) => {
  let connect = await getConnection(net);
  let OwnerWallet = getAccount(OwnerKeypair);
  let poolInfo = getPool(poolName, true);
  if (fromCoinSymbolOrMint.length < 40) {
    fromCoinSymbolOrMint = getToken(fromCoinSymbolOrMint, true).mintAddress;
  }
  if (toCoinSymbolOrMint.length < 40) {
    toCoinSymbolOrMint = getToken(toCoinSymbolOrMint, true).mintAddress;
  }
  let txid = await swap(
    connect,
    OwnerWallet,
    poolInfo,
    fromCoinSymbolOrMint,
    toCoinSymbolOrMint,
    fromTokenAccount,
    toTokenAccount,
    aIn,
    aOut
  );
  return txid;
};
