import { Connection } from "@solana/web3.js";

export interface wrap_data {
    connection: Connection;
    wallet;
    fromCoin;
    toCoin;
    fromAddress: string;
    toAddress: string;
    fromCoinAmount: string;
}

export interface swap_data {
    connection: Connection;
    wallet;
    ammId: string;
    fromCoin;
    toCoin;
    fromAddress: string;
    toAddress: string;
    aIn: string;
    aOut: string;
}

export interface place_data {
    connection: Connection;
    wallet;
    market;
    asks;
    bids;
    fromCoin;
    toCoin;
    fromAddress;
    toAddress;
    fromCoinAmount;
    slippage;
}
