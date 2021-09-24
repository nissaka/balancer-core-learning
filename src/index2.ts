import { config, TOKEN } from "./config/config";
import axios from "axios";
import {} from "./utils/pools";
import { TOKENS } from "./utils/tokens";
import {} from "@solana/web3.js";

async function getPrice() {
    let res = await axios.get(config.RAYDIUM_PRICE_ENDPOINT).then((res) => {
        console.log(res.data);
        return res.data;
    });
    return res;
}

async function getPairs() {
    let res = await axios.get(config.RAYDIUM_FEE_ENDPOINT).then((res) => {
        console.log(res.data);
        return res.data;
    });
    return res;
}

async function testingAPI() {
    console.log(await getPrice());
}

function printToken() {
    console.log(TOKENS);
}

function swap(){
    
}