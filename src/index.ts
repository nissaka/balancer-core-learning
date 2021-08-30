import getPoolInfo from '@balancer/getPoolInfo';
import getVaultContract from '@balancer/getVaultContract';
import * as dotenv from 'dotenv';
import { ethers } from 'ethers';

dotenv.config();

(async function () {
  // 自身枚举属性 遍历返回
  // pools详情在/src/lib/eth/balancer/pools.ts下
  const poolAddresses = Object.keys(pools).map(function (key) {
    return poolAddresses[key];
  });

  // 返回 poolId swapFee tokens（balance, weight）
  const poolsInfo = await Promise.all(
    poolAddresses.map(async (poolId) => getPoolInfo(poolId)),
  );

  // console.log(JSON.stringify(poolsInfo, null, 4));

  let pricePairs = { BAL: null, DAI: null, WETH: null };

  // 得到对应的价格对
  poolsInfo.map(({ tokens }) => {
    const [first, second] = tokens;

    const relativePrice =
      (first.balance / second.balance) * (second.weight / first.weight);

    const nodes = {
      [first.symbol]: {
        [second.symbol]: relativePrice,
      },
      [second.symbol]: {
        [first.symbol]: 1 / relativePrice,
      },
    };

    for (const token in nodes) {
      if (!pricePairs[token]) {
        Object.assign(pricePairs, { ...pricePairs, [token]: nodes[token] });
      } else {
        Object.assign(pricePairs, {
          ...pricePairs,
          [token]: { ...pricePairs[token], ...nodes[token] },
        });
      }
    }
    //console.log(nodes);
  });
  //console.log(pricePairs);

  const paths = [];

  // 遍历刚才的交易比率对 找到所有路径
  for (const token in pricePairs) {
    for (const bar in pricePairs[token]) {
      const first = { pair: [token, bar], price: pricePairs[token][bar] };

      const foo = Object.keys(pricePairs[bar]).filter(
        (item) => item !== token,
      )[0];

      const second = { pair: [bar, foo], price: pricePairs[bar][foo] };

      const third = { pair: [foo, token], price: pricePairs[foo][token] };

      paths.push([first, second, third]);
    }
  }

  // 路径中的first second third进行累计相乘
  const rates = paths.map((path) => {
    return path
      .map(({ price }) => price)
      .reduce((acc, cur) => {
        return acc * cur;
      });
  });

  const kind = 0;

  const assets = [
    '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
  ];

  const funds = {
    sender: '0xE64F06F695De4C4E21BA8F383a2675Fd884Ac720',
    recipient: '0xE64F06F695De4C4E21BA8F383a2675Fd884Ac720',
  };

  const swaps = [
    {
      poolId:
        '0x0297e37f1873d2dab4487aa67cd56b58e2f27875000200000000000000000003',
      assetInIndex: '1',
      assetOutIndex: '0',
      amount: ethers.utils.parseEther('0.05'),
      userData: '0x',
    },
    {
      poolId:
        '0xa6f548df93de924d73be7d25dc02554c6bd66db500020000000000000000000e',
      assetInIndex: '0',
      assetOutIndex: '1',
      amount: ethers.utils.parseEther('0.05'),
      userData: '0x',
    },
  ];

  const vaultContract = getVaultContract();

  const args = [kind, swaps, assets, funds];
  // 执行batchswap方法
  const result = await vaultContract.callStatic.queryBatchSwap(...args);

  console.log(
    'res',
    result.map((res) => ethers.utils.formatEther(res)),
  );

  console.log(assets, paths[1]);

  // 1. get pool data () from the pools you want to work with;
  // 2. get token proportion from pool;
  // 3. get price reference from elsewhere;
})();

// BAL DAI WETH
// WETH DAI BAL

// BAL WETH DAI
// DAI WETH BAL

// WETH BAL DAI
// DAI BAL WETH

// (WETH -> BAL) -> (BAL -> DAI) -> (DAI -> WETH)
// ((114.5)*19.33)*1/2177.35 = 1,016504007164673

// (DAI -> BAL) -> (BAL -> WETH) -> (WETH -> DAI)
// ((1/19.33)*(1/114.50))*(2177.35) = 0,983763952676677

// (WETH -> BAL) == (BAL -> ETH)
// (DAI -> WETH) == (WETH -> DAI)
// (BAL -> WETH) == (WETH -> BAL)
