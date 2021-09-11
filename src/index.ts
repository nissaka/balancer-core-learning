import { getTokenBySymbol, TokenInfo, NATIVE_SOL, TOKENS } from '@/utils/tokens'
import { cloneDeep, get } from 'lodash-es'
import { Market, Orderbook } from '@project-serum/serum/lib/market.js'
import { getMultipleAccounts, commitment } from '@/utils/web3'
import { PublicKey } from '@solana/web3.js'
import { SERUM_PROGRAM_ID_V3 } from '@/utils/ids'
import { TokenAmount, gt } from '@/utils/safe-math'
import { getUnixTs } from '@/utils/time'
import { canWrap, getLiquidityInfoSimilar } from '@/utils/liquidity'
import {
  getLpListByTokenMintAddresses,
  getPoolListByTokenMintAddresses,
  isOfficalMarket,
  LiquidityPoolInfo,
} from '@/utils/pools'
import {
  getOutAmount,
  getSwapOutAmount,
  place,
  swap,
  wrap,
  checkUnsettledInfo,
  settleFund,
} from '@/utils/swap'
import axios from 'axios'
import config from '@/config/config'

let res = {
  //config part
  $web3: config.$web3,
  liquidity: config.liquidity,
  wallet: config.wallet,
  $wallet: config.wallet,
  swap: config.swap,
  $accessor: config.accessor,
  setting: config.setting,
  $axios: axios,

  //data part
  TOKENS,
  // should check if user have enough SOL to have a swap
  solBalance: null as TokenAmount | null,

  autoRefreshTime: 60,
  countdown: 0,
  marketTimer: null as any,
  initialized: false,
  loading: false,
  // swaping
  swaping: false,
  asks: {} as any,
  bids: {} as any,

  isFetchingUnsettled: false,
  unsettledOpenOrders: null as any,

  // whether have symbol will
  baseSymbol: '',
  baseUnsettledAmount: 0,
  isSettlingBase: false,

  quoteSymbol: '',
  quoteUnsettledAmount: 0,
  isSettlingQuote: false,

  coinSelectShow: false,
  selectFromCoin: true,
  fixedFromCoin: true,

  fromCoin: null as TokenInfo | null,
  toCoin: null as TokenInfo | null,
  fromCoinAmount: '',
  toCoinAmount: '',
  toCoinWithSlippage: '',

  // wrap
  isWrap: false,
  // if priceImpact is higher than 10%, a confirm modal will be shown
  confirmModalIsOpen: false,

  // serum
  market: null as any,
  marketAddress: '',
  // amm
  lpMintAddress: '',
  // trading endpoint
  endpoint: '',
  priceImpact: 0,

  coinBasePrice: true,
  outToPirceValue: 0,

  // whether user has toggle swap button
  hasPriceSwapped: false,

  officialPool: true,
  userCheckUnofficial: false,
  userCheckUnofficialMint: undefined as string | undefined,
  userCheckUnofficialShow: false,
  findUrlAmmId: false,

  ammId: undefined as string | undefined,

  ammIdSelectShow: false,
  ammIdSelectList: [] as LiquidityPoolInfo[] | [],

  ammIdSelectOld: false,

  ammIdOrMarketSearchShow: false,

  userNeedAmmIdOrMarket: undefined as string | undefined,

  setCoinFromMintLoading: false,

  asksAndBidsLoading: true,

  // method part
  gt,
  get,

  openFromCoinSelect() {
    this.selectFromCoin = true
    this.closeAllModal('coinSelectShow')
    setTimeout(() => {
      this.coinSelectShow = true
    }, 1)
  },

  openToCoinSelect() {
    this.selectFromCoin = false
    this.closeAllModal('coinSelectShow')
    setTimeout(() => {
      this.coinSelectShow = true
    }, 1)
  },

  onCoinSelect(tokenInfo: TokenInfo) {
    if (tokenInfo !== null) {
      if (this.selectFromCoin) {
        this.fromCoin = cloneDeep(tokenInfo)

        if (this.toCoin?.mintAddress === tokenInfo.mintAddress) {
          this.toCoin = null
          this.changeCoinAmountPosition()
        }
      } else {
        this.toCoin = cloneDeep(tokenInfo)

        if (this.fromCoin?.mintAddress === tokenInfo.mintAddress) {
          this.fromCoin = null
          this.changeCoinAmountPosition()
        }
      }
    } else {
      // check coin
      if (this.fromCoin !== null) {
        const newFromCoin = Object.values(TOKENS).find(
          (item) => item.mintAddress === this.fromCoin?.mintAddress,
        )
        if (newFromCoin === null || newFromCoin === undefined) {
          this.fromCoin = null
        }
      }
      if (this.toCoin !== null) {
        const newToCoin = Object.values(TOKENS).find(
          (item) => item.mintAddress === this.toCoin?.mintAddress,
        )
        if (newToCoin === null || newToCoin === undefined) {
          this.toCoin = null
        }
      }
    }
    this.coinSelectShow = false
  },

  setCoinFromMint(
    ammIdOrMarket: string | undefined,
    from: string | undefined,
    to: string | undefined,
  ) {
    this.setCoinFromMintLoading = true
    let fromCoin, toCoin
    try {
      this.findUrlAmmId = !this.liquidity.initialized
      this.userNeedAmmIdOrMarket = ammIdOrMarket
      // @ts-ignore
      const liquidityUser = getLiquidityInfoSimilar(ammIdOrMarket, from, to)
      if (liquidityUser) {
        if (from) {
          fromCoin =
            liquidityUser.coin.mintAddress === from
              ? liquidityUser.coin
              : liquidityUser.pc
          toCoin =
            liquidityUser.coin.mintAddress === fromCoin.mintAddress
              ? liquidityUser.pc
              : liquidityUser.coin
        }
        if (to) {
          toCoin =
            liquidityUser.coin.mintAddress === to
              ? liquidityUser.coin
              : liquidityUser.pc
          fromCoin =
            liquidityUser.coin.mintAddress === toCoin.mintAddress
              ? liquidityUser.pc
              : liquidityUser.coin
        }
        if (!(from && to)) {
          fromCoin = liquidityUser.coin
          toCoin = liquidityUser.pc
        }
      }
      if (fromCoin || toCoin) {
        if (fromCoin) {
          fromCoin.balance = get(
            this.wallet.tokenAccounts,
            `${fromCoin.mintAddress}.balance`,
          )
          this.fromCoin = fromCoin
        }

        if (toCoin) {
          toCoin.balance = get(
            this.wallet.tokenAccounts,
            `${toCoin.mintAddress}.balance`,
          )
          this.toCoin = toCoin
        }
      }
    } catch (error:any) {
      console.log('warning', error.message)
    }
    setTimeout(() => {
      this.setCoinFromMintLoading = false
      this.findMarket()
    }, 1)
  },

  needUserCheckUnofficialShow(ammId: string) {
    if (!this.wallet.connected) {
      return
    }
    if (this.officialPool) {
      return
    }

    const localCheckStr = localStorage.getItem(
      `${this.wallet.address}--checkAmmId`,
    )
    const localCheckAmmIdList = localCheckStr ? localCheckStr.split('---') : []
    if (localCheckAmmIdList.includes(ammId)) {
      this.userCheckUnofficial = true
      this.userCheckUnofficialMint = ammId
      this.userCheckUnofficialShow = false
      return
    }
    if (this.userCheckUnofficialMint === ammId) {
      this.userCheckUnofficial = true
      this.userCheckUnofficialShow = false
      return
    }
    this.userCheckUnofficial = false
    this.closeAllModal('userCheckUnofficialShow')
    setTimeout(() => {
      this.userCheckUnofficialShow = true
    }, 1)
  },

  onAmmIdSelect(liquidityInfo: LiquidityPoolInfo | undefined) {
    this.ammIdSelectShow = false
    if (liquidityInfo) {
      this.lpMintAddress = liquidityInfo.lp.mintAddress
      this.ammId = liquidityInfo.ammId
      this.userNeedAmmIdOrMarket = this.ammId
      this.officialPool = liquidityInfo.official
      this.findMarket()
    } else {
      this.ammIdSelectOld = true
      this.findMarket()
    }
  },

  onAmmIdOrMarketInput(ammIdOrMarket: string) {
    this.ammIdOrMarketSearchShow = false
    this.setCoinFromMint(ammIdOrMarket, undefined, undefined)
    this.findMarket()
  },

  onUserCheckUnofficialSelect(userSelect: boolean, userSelectAll: boolean) {
    this.userCheckUnofficialShow = false
    if (userSelect) {
      this.userCheckUnofficial = true
      this.userCheckUnofficialMint = this.ammId
      if (userSelectAll) {
        const localCheckStr = localStorage.getItem(
          `${this.wallet.address}--checkAmmId`,
        )
        if (localCheckStr) {
          localStorage.setItem(
            `${this.wallet.address}--checkAmmId`,
            localCheckStr + `---${this.ammId}`,
          )
        } else {
          localStorage.setItem(
            `${this.wallet.address}--checkAmmId`,
            `${this.ammId}`,
          )
        }
      }
    } else {
      this.fromCoin = null
      this.toCoin = null
      this.ammId = undefined
      this.officialPool = true
    }
  },

  changeCoinPosition() {
    this.setCoinFromMintLoading = true
    const tempFromCoin = this.fromCoin
    const tempToCoin = this.toCoin
    setTimeout(() => {
      this.setCoinFromMintLoading = false
    }, 1)

    this.fromCoin = tempToCoin
    this.toCoin = tempFromCoin

    this.changeCoinAmountPosition()
  },

  changeCoinAmountPosition() {
    const tempFromCoinAmount = this.fromCoinAmount
    const tempToCoinAmount = this.toCoinAmount

    this.fromCoinAmount = tempToCoinAmount
    this.toCoinAmount = tempFromCoinAmount
  },

  updateCoinInfo(tokenAccounts: any) {
    if (this.fromCoin) {
      const fromCoin = tokenAccounts[this.fromCoin.mintAddress]

      if (fromCoin) {
        this.fromCoin = { ...this.fromCoin, ...fromCoin }
      }
    }

    if (this.toCoin) {
      const toCoin = tokenAccounts[this.toCoin.mintAddress]

      if (toCoin) {
        this.toCoin = { ...this.toCoin, ...toCoin }
      }
    }
  },

  findMarket() {
    if (this.fromCoin && this.toCoin && this.liquidity.initialized) {
      const InputAmmIdOrMarket = this.userNeedAmmIdOrMarket

      // let userSelectFlag = false
      // wrap & unwrap
      if (canWrap(this.fromCoin.mintAddress, this.toCoin.mintAddress)) {
        this.isWrap = true
        this.initialized = true
        this.officialPool = true
        this.ammId = undefined
        return
      }

      let marketAddress = ''

      // serum
      for (const address of Object.keys(this.swap.markets)) {
        if (isOfficalMarket(address)) {
          const info = cloneDeep(this.swap.markets[address])
          let fromMint = this.fromCoin.mintAddress
          let toMint = this.toCoin.mintAddress
          if (fromMint === NATIVE_SOL.mintAddress) {
            fromMint = TOKENS.WSOL.mintAddress
          }
          if (toMint === NATIVE_SOL.mintAddress) {
            toMint = TOKENS.WSOL.mintAddress
          }
          if (
            (info.baseMint.toBase58() === fromMint &&
              info.quoteMint.toBase58() === toMint) ||
            (info.baseMint.toBase58() === toMint &&
              info.quoteMint.toBase58() === fromMint)
          ) {
            // if (!info.baseDepositsTotal.isZero() && !info.quoteDepositsTotal.isZero()) {
            marketAddress = address
            // }
          }
        }
      }

      if (this.fromCoin.mintAddress && this.toCoin.mintAddress) {
        const liquidityListV4 = getPoolListByTokenMintAddresses(
          this.fromCoin.mintAddress === TOKENS.WSOL.mintAddress
            ? NATIVE_SOL.mintAddress
            : this.fromCoin.mintAddress,
          this.toCoin.mintAddress === TOKENS.WSOL.mintAddress
            ? NATIVE_SOL.mintAddress
            : this.toCoin.mintAddress,
          typeof InputAmmIdOrMarket === 'string'
            ? InputAmmIdOrMarket
            : undefined,
        )
        const liquidityListV3 = getLpListByTokenMintAddresses(
          this.fromCoin.mintAddress === TOKENS.WSOL.mintAddress
            ? NATIVE_SOL.mintAddress
            : this.fromCoin.mintAddress,
          this.toCoin.mintAddress === TOKENS.WSOL.mintAddress
            ? NATIVE_SOL.mintAddress
            : this.toCoin.mintAddress,
          typeof InputAmmIdOrMarket === 'string'
            ? InputAmmIdOrMarket
            : undefined,
          [3],
        )

        let lpMintAddress
        let ammId
        let officialPool = true
        if (
          liquidityListV4.length === 1 &&
          !liquidityListV4[0].official &&
          liquidityListV3.length > 0
        ) {
          console.log('v3')
        } else if (
          liquidityListV4.length === 1 &&
          liquidityListV4[0].official
        ) {
          // official
          lpMintAddress = liquidityListV4[0].lp.mintAddress
          ammId = liquidityListV4[0].ammId
          // mark
          officialPool = liquidityListV4[0].official
          this.userCheckUnofficialMint = undefined
          marketAddress = liquidityListV4[0].serumMarket
        } else if (
          marketAddress !== '' &&
          (InputAmmIdOrMarket === undefined ||
            InputAmmIdOrMarket === marketAddress)
        ) {
          console.log('official market')
        } else if (liquidityListV4.length === 1 && InputAmmIdOrMarket) {
          // user select
          ammId = liquidityListV4[0].ammId
          lpMintAddress = liquidityListV4[0].lp.mintAddress
          officialPool = liquidityListV4[0].official
          marketAddress = liquidityListV4[0].serumMarket
        } else if (liquidityListV4.length > 0 && this.ammIdSelectOld) {
          console.log('last user select none')
        } else if (liquidityListV4.length > 0) {
          // user select amm id
          this.coinSelectShow = false
          setTimeout(() => {
            this.ammIdSelectShow = true
            // @ts-ignore
            this.ammIdSelectList = Object.values(this.liquidity.infos).filter(
              // (item: LiquidityPoolInfo)
              (item: any) =>
                liquidityListV4.find(
                  (liquidityItem) => liquidityItem.ammId === item.ammId,
                ),
            )
          }, 1)
          return
        }
        this.lpMintAddress = lpMintAddress ?? ''
        this.initialized = true
        this.ammId = ammId
        this.officialPool = officialPool
        if (ammId !== this.userCheckUnofficialMint) {
          this.userCheckUnofficialMint = undefined
        }
        if (ammId) {
          this.needUserCheckUnofficialShow(ammId)
        }
      }

      if (marketAddress) {
        // const lpPool = LIQUIDITY_POOLS.find((item) => item.serumMarket === marketAddress)
        if (this.marketAddress !== marketAddress) {
          this.marketAddress = marketAddress
          this.isWrap = false
          Market.load(
            this.$web3,
            new PublicKey(marketAddress),
            {},
            new PublicKey(SERUM_PROGRAM_ID_V3),
          ).then((market) => {
            this.market = market
            this.getOrderBooks()
          })
          // this.unsubPoolChange()
          // this.subPoolChange()
        }
      } else {
        this.endpoint = ''
        this.marketAddress = ''
        this.market = null
        this.lpMintAddress = ''
        this.isWrap = false
        // this.unsubPoolChange()
      }
      //   this.updateUrl()
    } else {
      this.ammId = undefined
      this.endpoint = ''
      this.marketAddress = ''
      this.market = null
      this.lpMintAddress = ''
      this.isWrap = false
      // this.unsubPoolChange()
    }
  },

  getOrderBooks() {
    this.loading = true
    this.asksAndBidsLoading = true
    this.countdown = this.autoRefreshTime

    const conn = this.$web3
    if (this.marketAddress && get(this.swap.markets, this.marketAddress)) {
      const marketInfo = get(this.swap.markets, this.marketAddress)
      const { bids, asks } = marketInfo

      getMultipleAccounts(conn, [bids, asks], commitment)
        .then((infos) => {
          infos.forEach((info) => {
            // @ts-ignore
            const data = info.account.data

            const orderbook = Orderbook.decode(marketInfo, data)

            const { isBids, slab } = orderbook

            if (isBids) {
              this.bids = slab
            } else {
              this.asks = slab
            }
            this.asksAndBidsLoading = false
          })
        })
        .finally(() => {
          this.initialized = true
          this.loading = false
          this.countdown = 0
        })
    } else {
      this.loading = false
    }
  },

  updateAmounts() {
    let toCoinAmount = ''
    let toCoinWithSlippage = null
    let price = 0
    let impact = 0
    let endpoint = ''
    if (this.fromCoin && this.toCoin && this.isWrap && this.fromCoinAmount) {
      // wrap & unwrap
      this.toCoinAmount = this.fromCoinAmount
      return
    }
    if (this.fromCoin && this.toCoin && this.ammId && this.fromCoinAmount) {
      // amm
      const poolInfo = Object.values(this.$accessor.liquidity.infos).find(
        (p: any) => p.ammId === this.ammId,
      )
      const {
        amountOut,
        amountOutWithSlippage,
        priceImpact,
      } = getSwapOutAmount(
        poolInfo,
        this.fromCoin.mintAddress,
        this.toCoin.mintAddress,
        this.fromCoinAmount,
        this.setting.slippage,
      )
      if (!amountOut.isNullOrZero()) {
        console.log(
          `input: ${
            this.fromCoinAmount
          } raydium out: ${amountOutWithSlippage.fixed()}`,
        )
        toCoinAmount = amountOut.fixed()
        toCoinWithSlippage = amountOutWithSlippage
        price = +new TokenAmount(
          parseFloat(toCoinAmount) / parseFloat(this.fromCoinAmount),
          this.toCoin.decimals,
          false,
        ).fixed()
        impact = priceImpact
        endpoint = 'Raydium Pool'
      }
    }
    if (
      this.fromCoin &&
      this.toCoin &&
      this.marketAddress &&
      this.market &&
      this.asks &&
      this.bids &&
      this.fromCoinAmount &&
      !this.asksAndBidsLoading
    ) {
      // serum
      const { amountOut, amountOutWithSlippage, priceImpact } = getOutAmount(
        this.market,
        this.asks,
        this.bids,
        this.fromCoin.mintAddress,
        this.toCoin.mintAddress,
        this.fromCoinAmount,
        this.setting.slippage,
      )

      const out = new TokenAmount(amountOut, this.toCoin.decimals, false)
      const outWithSlippage = new TokenAmount(
        amountOutWithSlippage,
        this.toCoin.decimals,
        false,
      )

      if (!out.isNullOrZero()) {
        console.log(
          `input: ${
            this.fromCoinAmount
          }   serum out: ${outWithSlippage.fixed()}`,
        )
        if (
          !toCoinWithSlippage ||
          toCoinWithSlippage.wei.isLessThan(outWithSlippage.wei)
        ) {
          toCoinAmount = out.fixed()
          toCoinWithSlippage = outWithSlippage
          price = +new TokenAmount(
            parseFloat(toCoinAmount) / parseFloat(this.fromCoinAmount),
            this.toCoin.decimals,
            false,
          ).fixed()
          impact = priceImpact
          endpoint = 'serum DEX'
        }
      }
    }

    if (toCoinWithSlippage) {
      this.toCoinAmount = toCoinAmount
      this.toCoinWithSlippage = toCoinWithSlippage.fixed()
      this.outToPirceValue = price
      this.priceImpact = impact
      this.endpoint = endpoint
    } else {
      this.toCoinAmount = ''
      this.toCoinWithSlippage = ''
      this.outToPirceValue = 0
      this.priceImpact = 0
      this.endpoint = ''
    }
  },

  setMarketTimer() {
    this.marketTimer = setInterval(() => {
      if (!this.loading) {
        if (this.countdown < this.autoRefreshTime) {
          this.countdown += 1

          if (this.countdown === this.autoRefreshTime) {
            this.getOrderBooks()
          }
        }
      }
    }, 1000)
  },

  placeOrder() {
    this.swaping = true

    const key = getUnixTs().toString()
    console.log('Making transaction...')

    if (this.isWrap) {
      wrap(
        this.$axios,
        this.$web3,
        // @ts-ignore
        this.$wallet,
        // @ts-ignore
        this.fromCoin.mintAddress,
        // @ts-ignore
        this.toCoin.mintAddress,
        // @ts-ignore
        get(
          this.wallet.tokenAccounts,
          `${this.fromCoin.mintAddress}.tokenAccountAddress`,
        ),
        // @ts-ignore
        get(
          this.wallet.tokenAccounts,
          `${this.toCoin.mintAddress}.tokenAccountAddress`,
        ),
        this.fromCoinAmount,
      )
        .then((txid) => {
          console.log('Transaction has been sent', txid)
          //   this.$notify.info({
          //     key,
          //     message: 'Transaction has been sent',
          //     description: (h: any) =>
          //       h('div', [
          //         'Confirmation is in progress.  Check your transaction on ',
          //         h(
          //           'a',
          //           {
          //             attrs: {
          //               href: `${this.url.explorer}/tx/${txid}`,
          //               target: '_blank',
          //             },
          //           },
          //           'here',
          //         ),
          //       ]),
          //   })

          const description = `Unwrap ${this.fromCoinAmount} ${this.fromCoin?.symbol} to ${this.toCoinAmount} ${this.toCoin?.symbol}`
        //   this.$accessor.transaction.sub({ txid, description })
        })
        .catch((error) => {
          console.log('error', 'swap failed')
          //   this.$notify.error({
          //     key,
          //     message: 'Swap failed',
          //     description: error.message,
          //   })
        })
        .finally(() => {
          this.swaping = false
        })
    } else if (this.endpoint === 'Raydium Pool' && this.ammId) {
      const poolInfo = Object.values(this.$accessor.liquidity.infos).find(
        (p: any) => p.ammId === this.ammId,
      )
      swap(
        this.$web3,
        // @ts-ignore
        this.$wallet,
        poolInfo,
        // @ts-ignore
        this.fromCoin.mintAddress,
        // @ts-ignore
        this.toCoin.mintAddress,
        // @ts-ignore
        get(
          this.wallet.tokenAccounts,
          `${this.fromCoin.mintAddress}.tokenAccountAddress`,
        ),
        // @ts-ignore
        get(
          this.wallet.tokenAccounts,
          `${this.toCoin.mintAddress}.tokenAccountAddress`,
        ),
        this.fromCoinAmount,
        this.toCoinWithSlippage,
      )
        .then((txid) => {
          console.log('Transaction has been sent', txid)
          //   this.$notify.info({
          //     key,
          //     message: 'Transaction has been sent',
          //     description: (h: any) =>
          //       h('div', [
          //         'Confirmation is in progress.  Check your transaction on ',
          //         h(
          //           'a',
          //           {
          //             attrs: {
          //               href: `${this.url.explorer}/tx/${txid}`,
          //               target: '_blank',
          //             },
          //           },
          //           'here',
          //         ),
          //       ]),
          //   })

          const description = `Swap ${this.fromCoinAmount} ${this.fromCoin?.symbol} to ${this.toCoinAmount} ${this.toCoin?.symbol}`
        //   this.$accessor.transaction.sub({ txid, description })
        })
        .catch((error) => {
          console.log('error', 'swap failed')
          //   this.$notify.error({
          //     key,
          //     message: 'Swap failed',
          //     description: error.message,
          //   })
        })
        .finally(() => {
          this.swaping = false
        })
    } else {
      place(
        this.$web3,
        // @ts-ignore
        this.$wallet,
        this.market,
        this.asks,
        this.bids,
        // @ts-ignore
        this.fromCoin.mintAddress,
        // @ts-ignore
        this.toCoin.mintAddress,
        // @ts-ignore
        get(
          this.wallet.tokenAccounts,
          `${this.fromCoin.mintAddress}.tokenAccountAddress`,
        ),
        // @ts-ignore
        get(
          this.wallet.tokenAccounts,
          `${this.toCoin.mintAddress}.tokenAccountAddress`,
        ),
        this.fromCoinAmount,
        this.setting.slippage,
      )
        .then((txid) => {
          console.log('Transaction has been sent', txid)
          //   this.$notify.info({
          //     key,
          //     message: 'Transaction has been sent',
          //     description: (h: any) =>
          //       h('div', [
          //         'Confirmation is in progress.  Check your transaction on ',
          //         h(
          //           'a',
          //           {
          //             attrs: {
          //               href: `${this.url.explorer}/tx/${txid}`,
          //               target: '_blank',
          //             },
          //           },
          //           'here',
          //         ),
          //       ]),
          //   })

          const description = `Swap ${this.fromCoinAmount} ${this.fromCoin?.symbol} to ${this.toCoinAmount} ${this.toCoin?.symbol}`
        //   this.$accessor.transaction.sub({ txid, description })
        })
        .catch((error) => {
          console.log('error', 'swap failed')
          //   this.$notify.error({
          //     key,
          //     message: 'Swap failed',
          //     description: error.message,
          //   })
        })
        .finally(() => {
          this.swaping = false
        })
    }
  },

  //   async updateUrl() {
  //     if (this.$route.path !== '/swap/') {
  //       return
  //     }
  //     const { from, to } = this.$route.query
  //     if (this.ammId) {
  //       await this.$router.push({
  //         path: '/swap/',
  //         query: {
  //           ammId: this.ammId,
  //         },
  //       })
  //     } else if (this.fromCoin && this.toCoin) {
  //       if (
  //         this.fromCoin.mintAddress !== from ||
  //         this.toCoin.mintAddress !== to
  //       ) {
  //         await this.$router.push({
  //           path: '/swap/',
  //           query: {
  //             from: this.fromCoin.mintAddress,
  //             to: this.toCoin.mintAddress,
  //           },
  //         })
  //       }
  //     } else if (
  //       !(this.$route.query && Object.keys(this.$route.query).length === 0)
  //     ) {
  //       await this.$router.push({
  //         path: '/swap/',
  //       })
  //     }
  //   },

  closeAllModal(showName: string) {
    if (showName !== 'coinSelectShow') {
      this.coinSelectShow = false
    }
    if (showName !== 'ammIdSelectShow') {
      this.ammIdSelectShow = false
    }
    if (showName !== 'userCheckUnofficialShow') {
      this.userCheckUnofficialShow = false
    }
    if (showName !== 'ammIdOrMarketSearchShow') {
      this.ammIdOrMarketSearchShow = false
    }
  },

  async fetchUnsettledByMarket() {
    if (this.isFetchingUnsettled) return
    if (!this.$web3 || !this.$wallet || !this.market) return
    this.isFetchingUnsettled = true
    try {
      const info = await checkUnsettledInfo(
        this.$web3,
        this.$wallet,
        this.market,
      )
      if (!info) throw new Error('not enough data')
      this.baseSymbol = info.baseSymbol ?? ''
      this.baseUnsettledAmount = info.baseUnsettledAmount

      this.quoteSymbol = info.quoteSymbol ?? ''
      this.quoteUnsettledAmount = info.quoteUnsettledAmount
      this.unsettledOpenOrders = info.openOrders // have to establish an extra state, to store this value
    } catch (e) {
    } finally {
      this.isFetchingUnsettled = false
    }
  },

  settleFunds(from: 'base' | 'quote') {
    const key = getUnixTs().toString()
    console.log('Making transaction')
    // this.$notify.info({
    //   key,
    //   message: 'Making transaction...',
    //   description: '',
    //   duration: 0,
    // })

    let baseMint = (this.market as Market).baseMintAddress.toBase58()
    let quoteMint = (this.market as Market).quoteMintAddress.toBase58()

    let baseWallet = get(
      this.wallet.tokenAccounts,
      `${baseMint}.tokenAccountAddress`,
    )
    let quoteWallet = get(
      this.wallet.tokenAccounts,
      `${quoteMint}.tokenAccountAddress`,
    )
    if (from === 'quote') {
      ;[baseWallet, quoteWallet] = [quoteWallet, baseWallet]
      ;[baseMint, quoteMint] = [quoteMint, baseMint]
    }
    if (from === 'quote') {
      this.isSettlingQuote = true
    } else {
      this.isSettlingBase = true
    }

    settleFund(
      this.$web3,
      this.market,
      this.unsettledOpenOrders,
      this.$wallet,
      baseMint,
      quoteMint,
      baseWallet,
      quoteWallet,
    )
      .then((txid) => {
        console.log('Transaction has been sent', txid)
        // this.$notify.info({
        //   key,
        //   message: 'Transaction has been sent',
        //   description: (h: any) =>
        //     h('div', [
        //       'Confirmation is in progress.  Check your transaction on ',
        //       h(
        //         'a',
        //         {
        //           attrs: {
        //             href: `${this.url.explorer}/tx/${txid}`,
        //             target: '_blank',
        //           },
        //         },
        //         'here',
        //       ),
        //     ]),
        // })

        const description = `Settle`
        // this.$accessor.transaction.sub({ txid, description })
      })
      .then(() => {
        this.fetchUnsettledByMarket()
      })
      .catch((error) => {
        console.log('error', 'Settle failed')
        // this.$notify.error({
        //   key,
        //   message: 'Settle failed',
        //   description: error.message,
        // })
        this.isSettlingQuote = false
        this.isSettlingBase = false
      })
  },
}

export default res;