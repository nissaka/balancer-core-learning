import {
  Account,
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js'

let web3: Connection
let wallet: any

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
}
export default config
