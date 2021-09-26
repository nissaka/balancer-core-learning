import { Connection, clusterApiUrl } from "@solana/web3.js";

// get Connection
const getConnection = async (net_type) => {
    // 'devnet' | 'testnet' | 'mainnet-beta'
    if (!net_type) {
        net_type = "devnet";
    }
    const connection = new Connection(clusterApiUrl(net_type), "confirmed");
    console.log(await connection.getEpochInfo());
    console.log(`connect ${net_type} successful`);
    return connection;
};

export { getConnection };
