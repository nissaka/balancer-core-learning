import { Connection, clusterApiUrl, Keypair } from "@solana/web3.js";

// get Connection
const getConnection = async (net_type) => {
  // 'devnet' | 'testnet' | 'mainnet-beta'
  if (!net_type || net_type !== "testnet" || net_type !== "mainnet-beta") {
    net_type = "devnet";
  }
  const connection = new Connection(clusterApiUrl(net_type), "confirmed");
  console.log(await connection.getEpochInfo());
  console.log(`connect ${net_type} successful`);
  return connection;
};

const getAccount = (keypair) => {
  // 例子请见 /config/wallet
  return Keypair(keypair);
};

export { getConnection, getAccount };
