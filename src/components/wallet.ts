import type { WalletAdapter } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolongWalletAdapter } from "@solana/wallet-adapter-solong";
import { MathWalletWalletAdapter } from "@solana/wallet-adapter-mathwallet";
import { SolletWalletAdapter } from "@solana/wallet-adapter-sollet";
import { LedgerWalletAdapter } from "@solana/wallet-adapter-ledger";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { Coin98WalletAdapter } from "@solana/wallet-adapter-coin98";
import { SlopeWalletAdapter } from "@solana/wallet-adapter-slope";
import { SafePalWalletAdapter } from "@solana/wallet-adapter-safepal";
import { BloctoWalletAdapter } from "@solana/wallet-adapter-blocto";
import { BitpieWalletAdapter } from "@solana/wallet-adapter-bitpie";

interface WalletInfo {
    // official website
    website: string;
    // provider url for web wallet
    providerUrl?: string;
    // chrome extension install url
    chromeUrl?: string;
    // firefox extension install url
    firefoxUrl?: string;
    // isExtension: boolean
    getAdapter: (providerUrl?: string) => WalletAdapter;
}
const wallets: { [key: string]: WalletInfo } = {
    Phantom: {
        website: "https://phantom.app",
        chromeUrl:
            "https://chrome.google.com/webstore/detail/phantom/bfnaelmomeimhlpmgjnjophhpkkoljpa",
        getAdapter() {
            return new PhantomWalletAdapter();
        },
    },
    "Solflare Extension": {
        website: "https://solflare.com",
        firefoxUrl:
            "https://addons.mozilla.org/en-US/firefox/addon/solflare-wallet",
        getAdapter() {
            return new SolflareWalletAdapter();
        },
    },
    "Sollet Web": {
        website: "https://www.sollet.io",
        providerUrl: "https://www.sollet.io",
        getAdapter(providerUrl) {
            return new SolletWalletAdapter({ provider: providerUrl });
        },
    },
    "Sollet Extension": {
        website: "https://www.sollet.io",
        chromeUrl:
            "https://chrome.google.com/webstore/detail/sollet/fhmfendgdocmcbmfikdcogofphimnkno",
        getAdapter() {
            return new SolletWalletAdapter({
                provider: (window as any).sollet,
            });
        },
    },
    Ledger: {
        website: "https://www.ledger.com",
        getAdapter() {
            return new LedgerWalletAdapter();
        },
    },
    MathWallet: {
        website: "https://mathwallet.org",
        chromeUrl:
            "https://chrome.google.com/webstore/detail/math-wallet/afbcbjpbpfadlkmhmclhkeeodmamcflc",
        getAdapter() {
            return new MathWalletWalletAdapter();
        },
    },
    Solong: {
        website: "https://solongwallet.com",
        chromeUrl:
            "https://chrome.google.com/webstore/detail/solong/memijejgibaodndkimcclfapfladdchj",
        getAdapter() {
            return new SolongWalletAdapter();
        },
    },
    Coin98: {
        website: "https://www.coin98.com",
        chromeUrl:
            "https://chrome.google.com/webstore/detail/coin98-wallet/aeachknmefphepccionboohckonoeemg",
        getAdapter() {
            return new Coin98WalletAdapter();
        },
    },
    Blocto: {
        website: "https://blocto.portto.io",
        getAdapter() {
            return new BloctoWalletAdapter();
        },
    },
    Safepal: {
        website: "https://safepal.io",
        getAdapter() {
            return new SafePalWalletAdapter();
        },
    },
    Slope: {
        website: "https://slope.finance",
        chromeUrl:
            "https://chrome.google.com/webstore/detail/slope-finance-wallet/pocmplpaccanhmnllbbkpgfliimjljgo",
        getAdapter() {
            return new SlopeWalletAdapter();
        },
    },
    Bitpie: {
        website: "https://bitpie.com",
        getAdapter() {
            return new BitpieWalletAdapter();
        },
    },
    // Torus: {
    //   website: 'https://tor.us',
    //   getAdapter() {
    //     return new TorusWalletAdapter({
    //       options: {
    //         clientId: ''
    //       }
    //     })
    //   }
    // },
    "Solflare Web": {
        website: "https://solflare.com",
        providerUrl: "https://solflare.com/access-wallet",
        getAdapter(providerUrl) {
            return new SolletWalletAdapter({ provider: providerUrl });
        },
    },
};
