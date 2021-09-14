import { Market } from "@project-serum/serum";
import { Connection } from "@solana/web3.js";

interface Coin {
    mintAddress: string;
}


export interface wrap_data {
    connection: Connection;
    wallet: any;
    fromCoin;
    toCoin;
    fromAddress: string;
    toAddress: string;
    fromCoinAmount: string;
}

export interface swap_data {
    connection: Connection;
    wallet: any;
    ammId: string;
    fromCoin: any;
    toCoin: any;
    fromAddress: string;
    toAddress: string;
    aIn: string;
    aOut: string;
}

export interface place_data {
    connection: Connection;
    wallet: any;
    market: Market;
    asks: any;
    bids: any;
    fromCoin: any;
    toCoin: any;
    fromAddress: string;
    toAddress: string;
    fromCoinAmount: string;
    slippage: number;
}
