import { getUnixTs } from "../utils/time";
import axios from "axios";
import {
    Account,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction,
    TransactionInstruction,
} from "@solana/web3.js";
import {
    createAssociatedTokenAccountIfNotExist,
    createProgramAccountIfNotExist,
    createTokenAccountIfNotExist,
    mergeTransactions,
    sendTransaction,
} from "../utils/web3";
import { nu64, struct, u8 } from "buffer-layout";
import { getTokenByMintAddress, NATIVE_SOL, TOKENS } from "../utils/tokens";
import { TokenAmount } from "../utils/safe-math";
import {
    MEMO_PROGRAM_ID,
    SERUM_PROGRAM_ID_V3,
    TOKEN_PROGRAM_ID,
} from "../utils/ids";
import { getBigNumber } from "../utils/layouts";
import { LIQUIDITY_POOLS } from "../utils/pools";
import {
    _OPEN_ORDERS_LAYOUT_V2,
    Market,
    OpenOrders,
} from "@project-serum/serum/lib/market";
import { closeAccount } from "@project-serum/serum/lib/token-instructions";
import { wrap_data, swap_data, place_data } from "./type";
import config from "../config/config";

const memoInstruction = (memo: string) => {
    return new TransactionInstruction({
        keys: [],
        data: Buffer.from(memo, "utf-8"),
        programId: MEMO_PROGRAM_ID,
    });
};

const transfer = (
    source: PublicKey,
    destination: PublicKey,
    owner: PublicKey,
    amount: number
) => {
    const dataLayout = struct([u8("instruction"), nu64("amount")]);

    const keys = [
        { pubkey: source, isSigner: false, isWritable: true },
        { pubkey: destination, isSigner: false, isWritable: true },
        { pubkey: owner, isSigner: true, isWritable: false },
    ];

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 3,
            amount,
        },
        data
    );

    return new TransactionInstruction({
        keys,
        programId: TOKEN_PROGRAM_ID,
        data,
    });
};

const forecastBuy = (
    market: any,
    orderBook: any,
    pcIn: any,
    slippage: number
) => {
    let coinOut = 0;
    let bestPrice = null;
    let worstPrice = 0;
    let availablePc = pcIn;

    for (const { key, quantity } of orderBook.items(false)) {
        const price = market?.priceLotsToNumber(key.ushrn(64)) || 0;
        const size = market?.baseSizeLotsToNumber(quantity) || 0;

        if (!bestPrice && price !== 0) {
            bestPrice = price;
        }

        const orderPcVaule = price * size;
        worstPrice = price;

        if (orderPcVaule >= availablePc) {
            coinOut += availablePc / price;
            availablePc = 0;
            break;
        } else {
            coinOut += size;
            availablePc -= orderPcVaule;
        }
    }

    coinOut = coinOut * 0.993;

    const priceImpact = ((worstPrice - bestPrice) / bestPrice) * 100;

    worstPrice = (worstPrice * (100 + slippage)) / 100;
    const amountOutWithSlippage = (coinOut * (100 - slippage)) / 100;

    // const avgPrice = (pcIn - availablePc) / coinOut;
    const maxInAllow = pcIn - availablePc;

    return {
        side: "buy",
        maxInAllow,
        amountOut: coinOut,
        amountOutWithSlippage,
        worstPrice,
        priceImpact,
    };
};

const forecastSell = (
    market: any,
    orderBook: any,
    coinIn: any,
    slippage: number
) => {
    let pcOut = 0;
    let bestPrice = null;
    let worstPrice = 0;
    let availableCoin = coinIn;

    for (const { key, quantity } of orderBook.items(true)) {
        const price = market.priceLotsToNumber(key.ushrn(64)) || 0;
        const size = market?.baseSizeLotsToNumber(quantity) || 0;

        if (!bestPrice && price !== 0) {
            bestPrice = price;
        }

        worstPrice = price;

        if (availableCoin <= size) {
            pcOut += availableCoin * price;
            availableCoin = 0;
            break;
        } else {
            pcOut += price * size;
            availableCoin -= size;
        }
    }

    pcOut = pcOut * 0.993;

    const priceImpact = ((bestPrice - worstPrice) / bestPrice) * 100;

    worstPrice = (worstPrice * (100 - slippage)) / 100;
    const amountOutWithSlippage = (pcOut * (100 - slippage)) / 100;

    // const avgPrice = pcOut / (coinIn - availableCoin);
    const maxInAllow = coinIn - availableCoin;

    return {
        side: "sell",
        maxInAllow,
        amountOut: pcOut,
        amountOutWithSlippage,
        worstPrice,
        priceImpact,
    };
};

const getOutAmount = (
    market: any,
    asks: any,
    bids: any,
    fromCoinMint: string,
    toCoinMint: string,
    amount: string,
    slippage: number
) => {
    const fromAmount = parseFloat(amount);

    let fromMint = fromCoinMint;
    let toMint = toCoinMint;

    if (fromMint === NATIVE_SOL.mintAddress) {
        fromMint = TOKENS.WSOL.mintAddress;
    }
    if (toMint === NATIVE_SOL.mintAddress) {
        toMint = TOKENS.WSOL.mintAddress;
    }

    if (
        fromMint === market.quoteMintAddress.toBase58() &&
        toMint === market.baseMintAddress.toBase58()
    ) {
        // buy
        return forecastBuy(market, asks, fromAmount, slippage);
    } else {
        return forecastSell(market, bids, fromAmount, slippage);
    }
};

const swapInstruction = (
    programId: PublicKey,
    // tokenProgramId: PublicKey,
    // amm
    ammId: PublicKey,
    ammAuthority: PublicKey,
    ammOpenOrders: PublicKey,
    ammTargetOrders: PublicKey,
    poolCoinTokenAccount: PublicKey,
    poolPcTokenAccount: PublicKey,
    // serum
    serumProgramId: PublicKey,
    serumMarket: PublicKey,
    serumBids: PublicKey,
    serumAsks: PublicKey,
    serumEventQueue: PublicKey,
    serumCoinVaultAccount: PublicKey,
    serumPcVaultAccount: PublicKey,
    serumVaultSigner: PublicKey,
    // user
    userSourceTokenAccount: PublicKey,
    userDestTokenAccount: PublicKey,
    userOwner: PublicKey,

    amountIn: number,
    minAmountOut: number
): TransactionInstruction => {
    const dataLayout = struct([
        u8("instruction"),
        nu64("amountIn"),
        nu64("minAmountOut"),
    ]);

    const keys = [
        // spl token
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        // amm
        { pubkey: ammId, isSigner: false, isWritable: true },
        { pubkey: ammAuthority, isSigner: false, isWritable: false },
        { pubkey: ammOpenOrders, isSigner: false, isWritable: true },
        { pubkey: ammTargetOrders, isSigner: false, isWritable: true },
        { pubkey: poolCoinTokenAccount, isSigner: false, isWritable: true },
        { pubkey: poolPcTokenAccount, isSigner: false, isWritable: true },
        // serum
        { pubkey: serumProgramId, isSigner: false, isWritable: false },
        { pubkey: serumMarket, isSigner: false, isWritable: true },
        { pubkey: serumBids, isSigner: false, isWritable: true },
        { pubkey: serumAsks, isSigner: false, isWritable: true },
        { pubkey: serumEventQueue, isSigner: false, isWritable: true },
        { pubkey: serumCoinVaultAccount, isSigner: false, isWritable: true },
        { pubkey: serumPcVaultAccount, isSigner: false, isWritable: true },
        { pubkey: serumVaultSigner, isSigner: false, isWritable: false },
        { pubkey: userSourceTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userDestTokenAccount, isSigner: false, isWritable: true },
        { pubkey: userOwner, isSigner: true, isWritable: false },
    ];

    const data = Buffer.alloc(dataLayout.span);
    dataLayout.encode(
        {
            instruction: 9,
            amountIn,
            minAmountOut,
        },
        data
    );

    return new TransactionInstruction({
        keys,
        programId,
        data,
    });
};

const wrap = async (
    connection: Connection,
    wallet: any,
    fromCoinMint: string,
    toCoinMint: string,
    fromTokenAccount: string,
    toTokenAccount: string,
    amount: string
) => {
    const transaction = new Transaction();
    const signers: Account[] = [];

    const owner = wallet.publicKey;

    const fromCoin = getTokenByMintAddress(fromCoinMint);
    const amountOut = new TokenAmount(amount, fromCoin?.decimals, false);

    const newFromTokenAccount = await createAssociatedTokenAccountIfNotExist(
        fromTokenAccount,
        owner,
        fromCoinMint,
        transaction
    );
    const newToTokenAccount = await createAssociatedTokenAccountIfNotExist(
        toTokenAccount,
        owner,
        toCoinMint,
        transaction
    );

    const solletRes: any = await axios.post(
        "https://swap.sollet.io/api/swap_to",
        {
            address: newToTokenAccount.toString(),
            blockchain: "sol",
            coin: toCoinMint,
            size: 1,
            wusdtToUsdt: true,
        }
    );
    const { address, maxSize } = solletRes.result;

    if (!address) {
        throw new Error("Unwrap not available now");
    }

    if (parseFloat(amount) > maxSize) {
        throw new Error(`Max allow ${maxSize}`);
    }

    transaction.add(
        transfer(
            newFromTokenAccount,
            new PublicKey(address),
            owner,
            getBigNumber(amountOut.toWei())
        )
    );
    transaction.add(memoInstruction(newToTokenAccount.toString()));

    return await sendTransaction(connection, wallet, transaction, signers);
};

const swap = async (
    connection: Connection,
    wallet: any,
    poolInfo: any,
    fromCoinMint: string,
    toCoinMint: string,
    fromTokenAccount: string,
    toTokenAccount: string,
    aIn: string,
    aOut: string
) => {
    const transaction = new Transaction();
    const signers: Account[] = [];

    const owner = wallet.publicKey;

    const from = getTokenByMintAddress(fromCoinMint);
    const to = getTokenByMintAddress(toCoinMint);
    if (!from || !to) {
        throw new Error("Miss token info");
    }

    const amountIn = new TokenAmount(aIn, from.decimals, false);
    const amountOut = new TokenAmount(aOut, to.decimals, false);

    let fromMint = fromCoinMint;
    let toMint = toCoinMint;

    if (fromMint === NATIVE_SOL.mintAddress) {
        fromMint = TOKENS.WSOL.mintAddress;
    }
    if (toMint === NATIVE_SOL.mintAddress) {
        toMint = TOKENS.WSOL.mintAddress;
    }

    let wrappedSolAccount: PublicKey | null = null;
    let wrappedSolAccount2: PublicKey | null = null;

    if (fromCoinMint === NATIVE_SOL.mintAddress) {
        wrappedSolAccount = await createTokenAccountIfNotExist(
            connection,
            wrappedSolAccount,
            owner,
            TOKENS.WSOL.mintAddress,
            getBigNumber(amountIn.wei) + 1e7,
            transaction,
            signers
        );
    }
    if (toCoinMint === NATIVE_SOL.mintAddress) {
        wrappedSolAccount2 = await createTokenAccountIfNotExist(
            connection,
            wrappedSolAccount2,
            owner,
            TOKENS.WSOL.mintAddress,
            1e7,
            transaction,
            signers
        );
    }

    const newFromTokenAccount = await createAssociatedTokenAccountIfNotExist(
        fromTokenAccount,
        owner,
        fromMint,
        transaction
    );
    const newToTokenAccount = await createAssociatedTokenAccountIfNotExist(
        toTokenAccount,
        owner,
        toMint,
        transaction
    );

    transaction.add(
        swapInstruction(
            new PublicKey(poolInfo.programId),
            new PublicKey(poolInfo.ammId),
            new PublicKey(poolInfo.ammAuthority),
            new PublicKey(poolInfo.ammOpenOrders),
            new PublicKey(poolInfo.ammTargetOrders),
            new PublicKey(poolInfo.poolCoinTokenAccount),
            new PublicKey(poolInfo.poolPcTokenAccount),
            new PublicKey(poolInfo.serumProgramId),
            new PublicKey(poolInfo.serumMarket),
            new PublicKey(poolInfo.serumBids),
            new PublicKey(poolInfo.serumAsks),
            new PublicKey(poolInfo.serumEventQueue),
            new PublicKey(poolInfo.serumCoinVaultAccount),
            new PublicKey(poolInfo.serumPcVaultAccount),
            new PublicKey(poolInfo.serumVaultSigner),
            wrappedSolAccount ?? newFromTokenAccount,
            wrappedSolAccount2 ?? newToTokenAccount,
            owner,
            Math.floor(getBigNumber(amountIn.toWei())),
            Math.floor(getBigNumber(amountOut.toWei()))
        )
    );

    if (wrappedSolAccount) {
        transaction.add(
            closeAccount({
                source: wrappedSolAccount,
                destination: owner,
                owner,
            })
        );
    }
    if (wrappedSolAccount2) {
        transaction.add(
            closeAccount({
                source: wrappedSolAccount2,
                destination: owner,
                owner,
            })
        );
    }

    return await sendTransaction(connection, wallet, transaction, signers);
};

const place = async (
    connection: Connection,
    wallet: any,
    market: Market,
    asks: any,
    bids: any,
    fromCoinMint: string,
    toCoinMint: string,
    fromTokenAccount: string,
    toTokenAccount: string,
    amount: string,
    slippage: number
) => {
    const forecastConfig = getOutAmount(
        market,
        asks,
        bids,
        fromCoinMint,
        toCoinMint,
        amount,
        slippage
    );

    const transaction = new Transaction();
    const signers: Account[] = [];

    const owner = wallet.publicKey;

    const openOrdersAccounts = await market.findOpenOrdersAccountsForOwner(
        connection,
        owner,
        0
    );

    // const useFeeDiscountPubkey: PublicKey | null
    const openOrdersAddress: PublicKey = await createProgramAccountIfNotExist(
        connection,
        // @ts-ignore
        openOrdersAccounts.length === 0
            ? null
            : openOrdersAccounts[0].address.toBase58(),
        owner,
        new PublicKey(SERUM_PROGRAM_ID_V3),
        null,
        _OPEN_ORDERS_LAYOUT_V2,
        transaction,
        signers
    );

    let wrappedSolAccount: PublicKey | null = null;

    if (fromCoinMint === NATIVE_SOL.mintAddress) {
        let lamports;
        if (forecastConfig.side === "buy") {
            lamports = Math.round(
                forecastConfig.worstPrice *
                    forecastConfig.amountOut *
                    1.01 *
                    LAMPORTS_PER_SOL
            );
            if (openOrdersAccounts.length > 0) {
                lamports -= getBigNumber(openOrdersAccounts[0].quoteTokenFree);
            }
        } else {
            lamports = Math.round(forecastConfig.maxInAllow * LAMPORTS_PER_SOL);
            if (openOrdersAccounts.length > 0) {
                lamports -= getBigNumber(openOrdersAccounts[0].baseTokenFree);
            }
        }
        lamports = Math.max(lamports, 0) + 1e7;

        wrappedSolAccount = await createTokenAccountIfNotExist(
            connection,
            wrappedSolAccount,
            owner,
            TOKENS.WSOL.mintAddress,
            lamports,
            transaction,
            signers
        );
    }

    transaction.add(
        market.makePlaceOrderInstruction(connection, {
            owner,
            payer: wrappedSolAccount ?? new PublicKey(fromTokenAccount),
            // @ts-ignore
            side: forecastConfig.side,
            price: forecastConfig.worstPrice,
            size:
                forecastConfig.side === "buy"
                    ? parseFloat(forecastConfig.amountOut.toFixed(6))
                    : parseFloat(forecastConfig.maxInAllow.toFixed(6)),
            orderType: "ioc",
            openOrdersAddressKey: openOrdersAddress,
            // feeDiscountPubkey: useFeeDiscountPubkey
        })
    );

    if (wrappedSolAccount) {
        transaction.add(
            closeAccount({
                source: wrappedSolAccount,
                destination: owner,
                owner,
            })
        );
    }

    let fromMint = fromCoinMint;
    let toMint = toCoinMint;

    if (fromMint === NATIVE_SOL.mintAddress) {
        fromMint = TOKENS.WSOL.mintAddress;
    }
    if (toMint === NATIVE_SOL.mintAddress) {
        toMint = TOKENS.WSOL.mintAddress;
    }

    const newFromTokenAccount = await createAssociatedTokenAccountIfNotExist(
        fromTokenAccount,
        owner,
        fromMint,
        transaction
    );
    const newToTokenAccount = await createAssociatedTokenAccountIfNotExist(
        toTokenAccount,
        owner,
        toMint,
        transaction
    );

    const userAccounts = [newFromTokenAccount, newToTokenAccount];
    if (
        market.baseMintAddress.toBase58() === toMint &&
        market.quoteMintAddress.toBase58() === fromMint
    ) {
        userAccounts.reverse();
    }
    const baseTokenAccount = userAccounts[0];
    const quoteTokenAccount = userAccounts[1];

    let referrerQuoteWallet: PublicKey | null = null;
    if (market.supportsReferralFees) {
        const quoteToken = getTokenByMintAddress(
            market.quoteMintAddress.toBase58()
        );
        if (quoteToken?.referrer) {
            referrerQuoteWallet = new PublicKey(quoteToken?.referrer);
        }
    }

    const settleTransactions = await market.makeSettleFundsTransaction(
        connection,
        new OpenOrders(
            openOrdersAddress,
            { owner },
            new PublicKey(SERUM_PROGRAM_ID_V3)
        ),
        baseTokenAccount,
        quoteTokenAccount,
        referrerQuoteWallet
    );

    return await sendTransaction(
        connection,
        wallet,
        mergeTransactions([transaction, settleTransactions.transaction]),
        [...signers, ...settleTransactions.signers]
    );
};

export const placeOrder = (type: string, data: any) => {
    const key = getUnixTs().toString();
    console.log("Making transaction...", key);

    switch (type) {
        case "wrap":
            // if (typeof data !== wrap_data) {
            //     console.log("error", "wrong wrap data");
            // }
            wrap(
                data.web3,
                data.wallet,
                data.fromCoinMintAddress,
                data.toCoinMintAddress,
                data.fromAccount,
                data.toAccount,
                data.fromCoinAmount
            )
                .then((txid) => {
                    console.log("Transaction has been sent (wrap)", txid);
                })
                .catch((error) => {
                    console.log(
                        "Error",
                        "wrap failed",
                        `from ${data.fromAccount} to ${data.toAccount} Amount ${data.fromCoinAmount}`
                    );
                });
            break;

        case "swap":
            // if (data.type !== swap_data) {
            //     console.log("error", "wrong swap data");
            // }
            const poolInfo = Object.values(LIQUIDITY_POOLS).find(
                (p: any) => p.ammId === data.ammId
            );
            swap(
                data.web3,
                data.wallet,
                poolInfo,
                data.fromCoinMintAddress,
                data.toCoinMintAddress,
                data.fromAccount,
                data.toAccount,
                data.fromCoinAmount,
                data.toCoinWithSlippage
            )
                .then((txid) => {
                    console.log("Transaction has been sent (swap)", txid);
                })
                .catch((error) => {
                    console.log(
                        "Error",
                        "swap failed",
                        `from ${data.fromAccount} to ${data.toAccount} Amount ${data.fromCoinAmount}`
                    );
                });
            break;

        case "place":
            // if (data.type !== place_data) {
            //     console.log("error", "wrong place data");
            // }
            place(
                data.web3,
                data.wallet,
                data.market,
                data.asks,
                data.bids,
                data.fromCoinMintAddress,
                data.toCoinMintAddress,
                data.fromAccount,
                data.toAccount,
                data.fromCoinAmount,
                config.setting.slippage
            )
                .then((txid) => {
                    console.log("Transaction has been sent (place)", txid);
                })
                .catch((error) =>
                    console.log(
                        "Error",
                        "place failed",
                        `from ${data.fromAccount} to ${data.toAccount} Amount ${data.fromCoinAmount}`
                    )
                );
            break;
    }
};

