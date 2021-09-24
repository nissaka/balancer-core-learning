const axios = require("axios");
const { dataV2 } = require("../config/data");
const { TOKENS, NATIVE_SOL, LP_TOKENS } = require("../utils/token");
const { LIQUIDITY_POOLS } = require("../utils/pools");

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
