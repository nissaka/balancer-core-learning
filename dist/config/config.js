let web3;
let wallet;
const config = {
    VERSION: '1.1.0',
    URL: 'https://api.raydium.io',
    $web3: web3,
    liquidity: {
        initialized: false,
        infos: '',
    },
    wallet: wallet,
    swap: {
        markets: [],
    },
    accessor: {
        liquidity: { infos: '' },
        transaction: { sub: {} },
    },
    setting: { slippage: 0 },
};
export default config;
//# sourceMappingURL=config.js.map