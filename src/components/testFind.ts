import { LIQUIDITY_POOLS } from "../utils/pools";
let data = { ammId: "G2PVNAKAp17xtruKiMwT1S2GWNxptWZfqK6oYrFWCXWX" };
const poolInfo = Object.values(LIQUIDITY_POOLS).find(
    (p:any) => p.ammId === data.ammId
);

console.log(poolInfo);
