"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { WalletState } from "@/types";
import { toast } from "sonner";
import { ethers } from "ethers";
import { SEPOLIA_RPC_URLS } from "@/lib/rpc";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX = "0xaa36a7";

const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_HEX,
  chainName: "Sepolia Testnet",
  nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
  rpcUrls: SEPOLIA_RPC_URLS,
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

const LAST_WALLET_KEY = "chainvotes_last_wallet";
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";

export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

// ─── EIP-6963 Discovery ────────────────────────────────────────────────────

// 800ms cukup untuk semua wallet modern termasuk Bitget
function discoverProviders(timeoutMs = 800): Promise<EIP6963ProviderDetail[]> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve([]);

    const found: EIP6963ProviderDetail[] = [];
    const seen = new Set<string>();

    const handler = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (detail?.info?.uuid && !seen.has(detail.info.uuid)) {
        seen.add(detail.info.uuid);
        found.push(detail);
      }
    };

    window.addEventListener("eip6963:announceProvider", handler as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", handler as EventListener);
      resolve(found);
    }, timeoutMs);
  });
}

// ─── Provider Resolution ───────────────────────────────────────────────────

function resolveProvider(walletType: string, providers: EIP6963ProviderDetail[]): any | null {
  const typeNorm = walletType.toLowerCase();

  // walletconnect dihandle terpisah
  if (typeNorm === "walletconnect") return null;

  // 1. Coba EIP-6963 dulu (paling akurat)
  if (providers.length > 0) {
    const rdnsMap: Record<string, string[]> = {
      metamask: ["io.metamask", "io.metamask.flask"],
      bitget:   ["com.bitget.web3", "com.bitkeep", "com.bitget.web3wallet"],
      coinbase: ["com.coinbase.wallet"],
      brave:    ["com.brave.wallet"],
      trust:    ["com.trustwallet.app"],
      okx:      ["com.okex.wallet"],
      rainbow:  ["me.rainbow"],
    };
    const targetRdns = rdnsMap[typeNorm] ?? [];
    for (const rdns of targetRdns) {
      const match = providers.find((p) => p.info.rdns === rdns);
      if (match) return match.provider;
    }
    // Cari by name (case insensitive)
    const byName = providers.find((p) =>
      p.info.name.toLowerCase().includes(typeNorm) ||
      (typeNorm === "bitget" && p.info.name.toLowerCase().includes("bitkeep"))
    );
    if (byName) return byName.provider;
  }

  // 2. Fallback ke legacy window.ethereum flags
  if (typeof window !== "undefined") {
    const eth = (window as any).ethereum;
    if (!eth) return null;

    const ethProviders: any[] = eth.providers ?? [];
    if (ethProviders.length > 0) {
      if (typeNorm === "metamask") {
        const mm = ethProviders.find((p: any) => p.isMetaMask && !p.isBitKeep && !p.isBitget);
        if (mm) return mm;
      }
      if (typeNorm === "bitget") {
        const bg = ethProviders.find((p: any) => p.isBitKeep || p.isBitget || p.isBitGetWallet);
        if (bg) return bg;
      }
      if (typeNorm === "coinbase") {
        const cb = ethProviders.find((p: any) => p.isCoinbaseWallet);
        if (cb) return cb;
      }
      if (typeNorm === "trust") {
        const tw = ethProviders.find((p: any) => p.isTrust || p.isTrustWallet);
        if (tw) return tw;
      }
      if (typeNorm === "okx") {
        const ok = ethProviders.find((p: any) => p.isOkxWallet || p.isOKExWallet);
        if (ok) return ok;
      }
    }

    // Single provider fallbacks
    if (typeNorm === "metamask" && eth.isMetaMask && !eth.isBitKeep && !eth.isBitget) return eth;
    if (typeNorm === "bitget" && (eth.isBitKeep || eth.isBitget || eth.isBitGetWallet)) return eth;
    if (typeNorm === "coinbase" && eth.isCoinbaseWallet) return eth;
    if (typeNorm === "brave" && eth.isBraveWallet) return eth;
    if (typeNorm === "trust" && (eth.isTrust || eth.isTrustWallet)) return eth;
    if (typeNorm === "okx" && (eth.isOkxWallet || eth.isOKExWallet)) return eth;

    // Last resort
    if (providers.length === 0) return eth;
  }

  return null;
}

// ─── Request Accounts ──────────────────────────────────────────────────────

async function requestAccounts(provider: any): Promise<string[]> {
  try {
    const existing: string[] = await provider.request({ method: "eth_accounts" });
    if (existing && existing.length > 0) return existing;
  } catch { /* ignore */ }

  return new Promise<string[]>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) { settled = true; reject(new Error("WALLET_TIMEOUT")); }
    }, 60_000);

    provider.request({ method: "eth_requestAccounts" })
      .then((accounts: string[]) => {
        if (!settled) { settled = true; clearTimeout(timer); resolve(accounts); }
      })
      .catch((err: any) => {
        if (!settled) { settled = true; clearTimeout(timer); reject(err); }
      });
  });
}

// ─── WalletConnect Provider (lazy-loaded) ─────────────────────────────────

let wcProviderCache: any = null;
// Promise lock — prevents double init when auto-reconnect and manual connect race
let wcInitPromise: Promise<any> | null = null;

async function getWalletConnectProvider(): Promise<any> {
  if (wcProviderCache?.connected) return wcProviderCache;
  if (wcInitPromise) return wcInitPromise;

  wcInitPromise = (async () => {
    const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
    let provider: any = null;
    for (const rpcUrl of SEPOLIA_RPC_URLS) {
      try {
        provider = await EthereumProvider.init({
          projectId: WC_PROJECT_ID,
          chains: [SEPOLIA_CHAIN_ID],
          optionalChains: [1, 137, 56],
          showQrModal: true,
          qrModalOptions: {
            themeMode: "dark",
            themeVariables: {
              "--wcm-accent-color": "#00f5a0",
              "--wcm-background-color": "#0a0f1a",
            },
          },
          metadata: {
            name: "ChainVotes",
            description: "Decentralized governance on Sepolia",
            url: typeof window !== "undefined" ? window.location.origin : "https://chainvotes.app",
            icons: ["https://chainvotes.app/favicon.ico"],
          },
          rpcMap: { [SEPOLIA_CHAIN_ID]: rpcUrl },
        });
        break;
      } catch (err: any) {
        console.warn(`[WalletConnect] init failed with ${rpcUrl}: ${err?.message?.slice(0, 60)}`);
        provider = null;
      }
    }
    if (!provider) throw new Error("WalletConnect failed to initialize on all RPC endpoints.");
    wcProviderCache = provider;
    return provider;
  })().finally(() => { wcInitPromise = null; });

  return wcInitPromise;
}

// ─── Main Hook ─────────────────────────────────────────────────────────────

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
    balance: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [discoveredProviders, setDiscoveredProviders] = useState<EIP6963ProviderDetail[]>([]);
  const activeProviderRef = useRef<any>(null);
  const abortRef = useRef<{ abort: () => void } | null>(null);

  // Discovery awal + listen untuk provider baru
  useEffect(() => {
    if (typeof window === "undefined") return;

    discoverProviders(800).then((providers) => {
      setDiscoveredProviders(providers);
    });

    const lateHandler = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (!detail?.info?.uuid) return;
      setDiscoveredProviders((prev) => {
        if (prev.find((p) => p.info.uuid === detail.info.uuid)) return prev;
        return [...prev, detail];
      });
    };
    window.addEventListener("eip6963:announceProvider", lateHandler as EventListener);
    window.dispatchEvent(new Event("eip6963:requestProvider"));

    return () => window.removeEventListener("eip6963:announceProvider", lateHandler as EventListener);
  }, []);

  const fetchBalance = useCallback(async (address: string, provider?: any): Promise<string> => {
    try {
      const eth = provider ?? activeProviderRef.current ?? (window as any).ethereum;
      if (!eth) return "0.0000";
      const ethersProvider = new ethers.BrowserProvider(eth);
      const bal = await ethersProvider.getBalance(address);
      return parseFloat(ethers.formatEther(bal)).toFixed(4);
    } catch {
      return "0.0000";
    }
  }, []);

  const switchToSepolia = useCallback(async (provider?: any) => {
    const eth = provider ?? activeProviderRef.current ?? (window as any).ethereum;
    if (!eth) return;
    try {
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_HEX }],
      });
    } catch (err: any) {
      if (err.code === 4902 || err?.data?.originalError?.code === 4902) {
        await eth.request({ method: "wallet_addEthereumChain", params: [SEPOLIA_PARAMS] });
        await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX }] });
      } else {
        throw err;
      }
    }
    try {
      const chainIdHex: string = await eth.request({ method: "eth_chainId" });
      const newChainId = parseInt(chainIdHex, 16);
      setWallet((prev) => ({ ...prev, chainId: newChainId }));
      if (newChainId === SEPOLIA_CHAIN_ID) {
        toast.success("Switched to Sepolia! ✅");
      }
    } catch { /* ignore */ }
  }, []);

  // ─── Connect ──────────────────────────────────────────────────────────────

  const connect = useCallback(async (walletType = "metamask") => {
    if (typeof window === "undefined") return;

    setIsConnecting(true);

    try { sessionStorage.removeItem("chainvotes_disconnected"); } catch { /* ignore */ }

    let cancelled = false;
    abortRef.current = { abort: () => { cancelled = true; } };

    try {
      // ── WalletConnect path ──────────────────────────────────────────────
      if (walletType === "walletconnect") {
        if (!WC_PROJECT_ID || WC_PROJECT_ID === "YOUR_PROJECT_ID_HERE") {
          toast.error("WalletConnect Project ID belum dikonfigurasi. Tambahkan NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID di .env.local");
          return;
        }

        toast.info("Membuka QR Code WalletConnect...", { duration: 5000 });

        let wcProvider: any;
        try {
          wcProvider = await getWalletConnectProvider();
        } catch (initErr: any) {
          toast.error("Failed to initialize WalletConnect. Check your internet connection.");
          console.error("[WC] init error:", initErr);
          return;
        }

        if (cancelled) { await wcProvider.disconnect().catch(() => {}); return; }

        try {
          await wcProvider.connect();
        } catch (connErr: any) {
          if (cancelled) return;
          const msg = connErr?.message ?? "";
          if (msg.includes("User rejected") || msg.includes("rejected")) {
            toast.error("Koneksi WalletConnect dibatalkan.");
          } else if (msg.includes("Modal closed")) {
            toast.info("Modal ditutup. Coba lagi jika ingin connect.");
          } else {
            toast.error(`WalletConnect error: ${msg.slice(0, 100)}`);
          }
          return;
        }

        if (cancelled) { await wcProvider.disconnect().catch(() => {}); return; }

        // Setelah connect(), accounts kadang belum terisi — coba eth_accounts dulu
        let accounts: string[] = wcProvider.accounts ?? [];
        if (!accounts.length) {
          try { accounts = await wcProvider.request({ method: "eth_accounts" }); } catch { /* ignore */ }
        }
        // Retry sekali lagi setelah 600ms kalau masih kosong (race condition WC)
        if (!accounts.length) {
          await new Promise((r) => setTimeout(r, 600));
          accounts = wcProvider.accounts ?? [];
          try {
            if (!accounts.length) accounts = await wcProvider.request({ method: "eth_accounts" });
          } catch { /* ignore */ }
        }
        if (!accounts.length) {
          toast.error("No accounts received from WalletConnect. Please try connecting again.");
          return;
        }

        const chainId: number = wcProvider.chainId ?? SEPOLIA_CHAIN_ID;
        const address = accounts[0];
        activeProviderRef.current = wcProvider;

        const balance = await fetchBalance(address, wcProvider);
        setWallet({ connected: true, address, chainId, balance });
        try { localStorage.setItem(LAST_WALLET_KEY, "walletconnect"); } catch { /* ignore */ }

        if (chainId !== SEPOLIA_CHAIN_ID) {
          toast.success("WalletConnect connected! 🎉");
          toast.warning('Wrong network detected. Click "WRONG NETWORK" to switch to Sepolia.', { duration: 6000 });
        } else {
          toast.success(`WalletConnect: ${address.slice(0, 6)}...${address.slice(-4)} 🎉`);
        }

        wcProvider.on("accountsChanged", async (accs: string[]) => {
          if (!accs?.length) {
            setWallet({ connected: false, address: null, chainId: null, balance: null });
            try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
            toast.warning("WalletConnect disconnected.");
            return;
          }
          const newAddr = accs[0];
          const newBal = await fetchBalance(newAddr, wcProvider);
          setWallet((prev) => ({ ...prev, address: newAddr, balance: newBal }));
        });

        wcProvider.on("chainChanged", (chainIdNum: number) => {
          setWallet((prev) => ({ ...prev, chainId: chainIdNum }));
          if (chainIdNum !== SEPOLIA_CHAIN_ID) {
            toast.warning("Network berganti. Silakan pindah ke Sepolia.");
          } else {
            toast.success("Sekarang di Sepolia Testnet.");
          }
        });

        wcProvider.on("disconnect", () => {
          setWallet({ connected: false, address: null, chainId: null, balance: null });
          activeProviderRef.current = null;
          wcProviderCache = null;
          try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
          toast.info("WalletConnect disconnected.");
        });

        return;
      }

      // ── Browser wallet path (MetaMask, Bitget, dll.) ────────────────────
      let freshProviders = discoveredProviders;
      if (freshProviders.length === 0) {
        freshProviders = await discoverProviders(800);
        if (cancelled) return;
        setDiscoveredProviders(freshProviders);
      }

      const provider = resolveProvider(walletType, freshProviders);

      if (!provider) {
        const installUrls: Record<string, string> = {
          metamask: "https://metamask.io/download/",
          bitget:   "https://web3.bitget.com/en/wallet-download",
          coinbase: "https://www.coinbase.com/wallet/downloads",
          brave:    "https://brave.com/download/",
          trust:    "https://trustwallet.com/browser-extension",
          okx:      "https://www.okx.com/web3",
          rainbow:  "https://rainbow.me/download",
        };
        const url = installUrls[walletType.toLowerCase()] ?? "https://metamask.io/download/";
        toast.error(`${walletType} tidak ditemukan. Membuka halaman instalasi...`);
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      activeProviderRef.current = provider;

      toast.info("Open your wallet and approve the connection request...", { duration: 8000 });

      let accounts: string[];
      try {
        accounts = await requestAccounts(provider);
      } catch (reqErr: any) {
        if (cancelled) return;

        const code = reqErr.code ?? reqErr?.error?.code;
        if (reqErr.message === "WALLET_TIMEOUT") {
          toast.error("Wallet not responding. Make sure your wallet is open and try again.");
          return;
        }
        if (code === 4001 || reqErr.message?.includes("rejected") || reqErr.message?.includes("denied")) {
          toast.error("Connection rejected.");
          return;
        }
        if (code === -32002) {
          toast.warning("Connection request pending — open your wallet and approve it.");
          return;
        }
        throw reqErr;
      }

      if (cancelled) return;

      if (!accounts || accounts.length === 0) {
        toast.error("No accounts found. Make sure your wallet is unlocked.");
        return;
      }

      let chainIdHex: string;
      try {
        chainIdHex = await provider.request({ method: "eth_chainId" });
      } catch {
        chainIdHex = "0x0";
      }

      if (cancelled) return;

      const chainId = parseInt(chainIdHex, 16);
      const address = accounts[0];
      const balance = await fetchBalance(address, provider);

      setWallet({ connected: true, address, chainId, balance });
      try { localStorage.setItem(LAST_WALLET_KEY, walletType); } catch { /* ignore */ }

      if (chainId !== SEPOLIA_CHAIN_ID) {
        toast.success(`${walletType} connected! 🎉`);
        toast.warning('Wrong network detected. Click "WRONG NETWORK" to switch to Sepolia.', { duration: 6000 });
      } else {
        toast.success(`${walletType} connected: ${address.slice(0, 6)}...${address.slice(-4)} 🎉`);
      }

      const handleAccountsChanged = async (accs: string[]) => {
        if (!accs || accs.length === 0) {
          setWallet({ connected: false, address: null, chainId: null, balance: null });
          try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
          toast.warning("Wallet disconnected.");
          return;
        }
        const newAddr = accs[0];
        const newBal = await fetchBalance(newAddr, provider);
        setWallet((prev) => ({ ...prev, address: newAddr, balance: newBal }));
        toast.info(`Account: ${newAddr.slice(0, 6)}...${newAddr.slice(-4)}`);
      };

      const handleChainChanged = (hex: string) => {
        const cid = parseInt(hex, 16);
        setWallet((prev) => ({ ...prev, chainId: cid }));
        if (cid !== SEPOLIA_CHAIN_ID) {
          toast.warning("Jaringan berganti. Silakan pindah kembali ke Sepolia.");
        } else {
          toast.success("Sekarang di Sepolia Testnet.");
        }
      };

      try {
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("chainChanged", handleChainChanged);
      } catch { /* some providers don't support .on() */ }

    } catch (err: any) {
      if (cancelled) return;
      console.error("[useWallet] connect error:", err);
      const msg = err?.message ?? err?.toString() ?? "Unknown error";
      if (msg.includes("Failed to connect") || msg.includes("inpage.js")) {
        toast.error("Connection failed. Try refreshing the page or unlocking your wallet.");
      } else {
        toast.error(`Error koneksi: ${msg.slice(0, 120)}`);
      }
    } finally {
      if (!cancelled) setIsConnecting(false);
      abortRef.current = null;
    }
  }, [fetchBalance, switchToSepolia, discoveredProviders]);

  // ─── Disconnect ───────────────────────────────────────────────────────────

  const disconnect = useCallback(async () => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsConnecting(false);

    const provider = activeProviderRef.current ?? (window as any)?.ethereum;
    if (provider) {
      try {
        if (provider.disconnect) {
          await provider.disconnect();
          wcProviderCache = null;
        } else {
          await provider.request({
            method: "wallet_revokePermissions",
            params: [{ eth_accounts: {} }],
          });
        }
      } catch { /* tidak semua wallet support ini */ }
    }

    setWallet({ connected: false, address: null, chainId: null, balance: null });
    activeProviderRef.current = null;

    try {
      localStorage.removeItem(LAST_WALLET_KEY);
      sessionStorage.setItem("chainvotes_disconnected", "1");
    } catch { /* ignore */ }

    toast.info("Wallet disconnected from app.");
  }, []);

  // ─── Auto-reconnect ───────────────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === "undefined") return;

    const autoReconnect = async () => {
      try {
        const intentionalDisconnect = sessionStorage.getItem("chainvotes_disconnected");
        if (intentionalDisconnect === "1") return;
      } catch { /* ignore */ }

      let lastWalletType = "metamask";
      try {
        const stored = localStorage.getItem(LAST_WALLET_KEY);
        if (!stored) return;
        lastWalletType = stored;
      } catch { return; }

      // WalletConnect auto-reconnect — use getWalletConnectProvider() so promise
      // lock is respected and double-init on page load is prevented
      if (lastWalletType === "walletconnect") {
        try {
          const wcProvider = await getWalletConnectProvider();
          if (wcProvider.connected && wcProvider.accounts?.length) {
            activeProviderRef.current = wcProvider;
            const address = wcProvider.accounts[0];
            const chainId = wcProvider.chainId ?? SEPOLIA_CHAIN_ID;
            const balance = await fetchBalance(address, wcProvider);
            setWallet({ connected: true, address, chainId, balance });
            wcProvider.on("disconnect", () => {
              setWallet({ connected: false, address: null, chainId: null, balance: null });
              activeProviderRef.current = null;
              wcProviderCache = null;
              wcInitPromise = null;
              try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
            });
          }
        } catch { /* WC session expired or no previous session */ }
        return;
      }

      // Browser wallet auto-reconnect
      // 2s timeout — some extensions (MetaMask) inject slowly on cold start
      const providers = await discoverProviders(2000);
      const provider = resolveProvider(lastWalletType, providers);
      const eth = provider ?? (window as any).ethereum;
      if (!eth) return;

      try {
        // eth_accounts never triggers a popup — returns [] if not authorized
        const accounts: string[] = await eth.request({ method: "eth_accounts" });
        if (!accounts || accounts.length === 0) return;
        const chainIdHex: string = await eth.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);
        const address = accounts[0];
        activeProviderRef.current = eth;
        const balance = await fetchBalance(address, eth);
        setWallet({ connected: true, address, chainId, balance });
      } catch { /* ignore */ }
    };

    autoReconnect();
  }, [fetchBalance]);

  const shortAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : null;

  const isWrongNetwork =
    wallet.connected && wallet.chainId !== null && wallet.chainId !== SEPOLIA_CHAIN_ID;

  return {
    wallet,
    connect,
    disconnect,
    shortAddress,
    isConnecting,
    isWrongNetwork,
    switchToSepolia: () => switchToSepolia(),
    discoveredProviders,
  };
}
