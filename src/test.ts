import { Keypair, Connection, ConnectionConfig } from "@solana/web3.js";
import {config} from "./config/config";

const testKeyPair = () => {
    const keypair = new Keypair();
    console.log(keypair);
};

const testConnection = async (endpoint) => {
    const connect = new Connection(endpoint, "confirmed");
    console.log(await connect.getEpochInfo());
};

testConnection(config.SOLANA_DEV_ENDPOINT);
