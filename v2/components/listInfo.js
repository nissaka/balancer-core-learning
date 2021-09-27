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

const getToken = (key, symbol) => {
    if (symbol) {
        if (key === NATIVE_SOL.symbol || key === NATIVE_SOL.name) {
            return NATIVE_SOL;
        } else {
            for (let i in TOKENS) {
                if (i === key) {
                    return TOKENS[i];
                }
            }
            for (let j in LP_TOKENS) {
                if (j === key) {
                    return LP_TOKENS[j];
                }
            }
        }
    } else if (key) {
        let res = [];
        let string_SOL = JSON.stringify(NATIVE_SOL);
        if (string_SOL.includes(key)) {
            res.push(NATIVE_SOL);
        }
        for (let i in TOKENS) {
            let string_token = JSON.stringify(TOKENS[i]);
            if (string_token.includes(key)) {
                res.push(TOKENS[i]);
            }
        }
        for (let j in LP_TOKENS) {
            let string_LP = JSON.stringify(LP_TOKENS[j]);
            if (string_LP.includes(key)) {
                res.push(LP_TOKENS[j]);
            }
        }
        return res;
    } else {
        return {
            NATIVE_SOL: NATIVE_SOL,
            TOKENS: TOKENS,
            LP_TOKENS: LP_TOKENS,
        };
    }
};

const getPool = (key, byName) => {
    if (byName) {
        for (let i of LIQUIDITY_POOLS) {
            if (i.name === key) {
                return i;
            }
        }
    } else if (key) {
        let res = [];
        for (let i of LIQUIDITY_POOLS) {
            if (JSON.stringify(i).includes(key)) {
                res.push(i);
            }
        }
        return res;
    } else {
        return LIQUIDITY_POOLS;
    }
};

// console.log(getPool("WUSDT"));
// console.log(getToken("AYnaG3AidNWFzjq9U3BJSsQ9DShE8g7FszriBDtRFvs"));

console.log(getToken("TULIP", true));
// console.log(getPool("ETH-WUSDT", true));

// export { getPrice, getPair, getToken, getPool };
