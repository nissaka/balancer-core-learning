import axios from "axios";
import {config} from "../config/config";

const { VERSION, URL } = config;

const getFunction = async (sub_url: string, data?: any) => {
    await axios
        .get(`${URL}${sub_url}`, { params: { v: data } })
        .then((res) => {
            if (res.status >= 200 && res.status < 300) {
                return res.data;
            } else {
                return res.status;
            }
        })
        .catch((e) => {
            console.log(e);
            return e;
        });
};

const postFunction = async (sub_url: string, data?: any) => {
    await axios
        .post(`${URL}${sub_url}`, data)
        .then((res) => {
            if (res.status >= 200 && res.status < 300) {
                return res.data;
            } else {
                return res.status;
            }
        })
        .catch((e) => {
            console.log(e);
            return e;
        });
};

const getPrices = async () => {
    let res = await getFunction("/coin/price");
    // console.log(res);
    return res;
    // let res = await axios.get(config.RAYDIUM_PRICE_ENDPOINT).then((res) => {
    //     return res;
    // });
    // return res;
};

const getInfo = async () => {
    return await getFunction("/info");
};

const getPairs = async () => {
    return await getFunction("/pairs");
    // return await axios.get(config.RAYDIUM_FEE_ENDPOINT).then((res) => {
    //     return res;
    // });
};

const getConfig = async () => {
    return await getFunction("/config", VERSION);
};

const getEpochInfo = async () => {};

export { getPrices, getInfo, getPairs, getConfig };
