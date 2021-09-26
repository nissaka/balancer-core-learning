import axios from "axios";
import { dataV2 } from "../config/data.js";
import { TOKENS, NATIVE_SOL, LP_TOKENS } from "../utils/token.js";
import { LIQUIDITY_POOLS } from "../utils/pools.js";

const getPrice = async () => {
    return await axios.get(dataV2.RAYDIUM_PRICE_ENDPOINT).then((res) => {
        return res.data;
    });
};

const getPair = async () => {
    return await axios.get(dataV2.RAYDIUM_FEE_ENDPOINT).then((res) => {
        return res.data;
    });
};

const getToken = (key) => {
    if (key) {
        for (let i of NATIVE_SOL) {
            console.log(i);
        }
    } else {
        return {
            NATIVE_SOL: NATIVE_SOL,
            TOKENS: TOKENS,
            LP_TOKENS: LP_TOKENS,
        };
    }
};

const getPool = (key) => {
    if (key) {
        for (let i of LIQUIDITY_POOLS) {
            console.log(i);
        }
    } else {
        return LIQUIDITY_POOLS;
    }
};

getPool("RAY");
