"use client";
import { createContext, useContext, useRef, useEffect, useState, useCallback, ReactNode } from "react";
import { WalletState } from "@/types";
import { toast } from "sonner";
import { ethers } from "ethers";

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_HEX = "0xaa36a7";

const SEPOLIA_PARAMS = {
  chainId: SEPOLIA_HEX,
  chainName: "Sepolia Testnet",
  nativeCurrency: { name: "SepoliaETH", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://rpc.sepolia.org", "https://ethereum-sepolia-rpc.publicnode.com"],
  blockExplorerUrls: ["https://sepolia.etherscan.io"],
};

const LAST_WALLET_KEY = "chainvotes_last_wallet";
const WC_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "";
const BALANCE_POLL_MS = 15_000; // refresh saldo tiap 15 detik

export interface EIP6963ProviderDetail {
  info: { uuid: string; name: string; icon: string; rdns: string };
  provider: any;
}

// ─── Context shape ────────────────────────────────────────────────────────────
interface WalletContextValue {
  wallet: WalletState;
  connect: (walletType?: string) => Promise<void>;
  disconnect: () => Promise<void>;
  shortAddress: string | null;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  switchToSepolia: () => Promise<void>;
  discoveredProviders: EIP6963ProviderDetail[];
  refreshBalance: () => Promise<void>;
  getActiveProvider: () => any | null;
}

const WalletContext = createContext<WalletContextValue | null>(null);

// ─── EIP-6963 Discovery ────────────────────────────────────────────────────
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
  if (typeNorm === "walletconnect") return null;

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
    const byName = providers.find((p) =>
      p.info.name.toLowerCase().includes(typeNorm) ||
      (typeNorm === "bitget" && p.info.name.toLowerCase().includes("bitkeep"))
    );
    if (byName) return byName.provider;
  }

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
    }
    if (typeNorm === "metamask" && eth.isMetaMask && !eth.isBitKeep && !eth.isBitget) return eth;
    if (typeNorm === "bitget" && (eth.isBitKeep || eth.isBitget || eth.isBitGetWallet)) return eth;
    if (typeNorm === "coinbase" && eth.isCoinbaseWallet) return eth;
    if (typeNorm === "brave" && eth.isBraveWallet) return eth;
    if (typeNorm === "trust" && (eth.isTrust || eth.isTrustWallet)) return eth;
    if (typeNorm === "okx" && (eth.isOkxWallet || eth.isOKExWallet)) return eth;
    if (providers.length === 0) return eth;
  }
  return null;
}

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

let wcProviderCache: any = null;

async function getWalletConnectProvider(): Promise<any> {
  if (wcProviderCache?.connected) return wcProviderCache;
  const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
  const rpcUrl = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://rpc2.sepolia.org";
  const provider = await EthereumProvider.init({
    projectId: WC_PROJECT_ID,
    // Hanya Sepolia — jangan campur mainnet/polygon di optionalChains
    // karena WC v2 butuh rpcMap entry untuk setiap chain yang didaftarkan
    chains: [SEPOLIA_CHAIN_ID],
    optionalChains: [SEPOLIA_CHAIN_ID],
    showQrModal: true,
    metadata: {
      name: "ChainVotes",
      description: "Decentralized governance on Sepolia",
      url: typeof window !== "undefined" ? window.location.origin : "https://chainvotes.app",
      icons: ["https://chainvotes.app/favicon.ico"],
    },
    rpcMap: {
      // rpcMap WAJIB ada untuk setiap chain di chains + optionalChains
      [SEPOLIA_CHAIN_ID]: rpcUrl,
    },
  });
  wcProviderCache = provider;
  return provider;
}

// ─── Provider Component ────────────────────────────────────────────────────
export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false, address: null, chainId: null, balance: null,
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [discoveredProviders, setDiscoveredProviders] = useState<EIP6963ProviderDetail[]>([]);
  const activeProviderRef = useRef<any>(null);
  const abortRef = useRef<{ abort: () => void } | null>(null);
  const balancePollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Balance refresh ────────────────────────────────────────────────────
  // RPC URLs untuk fallback balance fetch — selalu pakai ini untuk WalletConnect
  const RPC_URLS = [
    process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL,
    "https://rpc2.sepolia.org",
    "https://ethereum-sepolia-rpc.publicnode.com",
    "https://sepolia.drpc.org",
  ].filter(Boolean) as string[];

  const fetchBalance = useCallback(async (address: string, isWalletConnect = false): Promise<string> => {
    // WalletConnect: langsung pakai JsonRpcProvider, tidak lewat WC provider
    // Browser wallet: coba window.ethereum dulu, fallback ke RPC
    if (!isWalletConnect) {
      try {
        const eth = activeProviderRef.current ?? (typeof window !== "undefined" ? (window as any).ethereum : null);
        if (eth) {
          const balHex: string = await eth.request({
            method: "eth_getBalance",
            params: [address, "latest"],
          });
          return parseFloat(ethers.formatEther(BigInt(balHex))).toFixed(4);
        }
      } catch { /* fallthrough ke RPC */ }
    }

    // Coba RPC URLs satu per satu
    for (const rpcUrl of RPC_URLS) {
      try {
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
        const bal = await rpcProvider.getBalance(address);
        return parseFloat(ethers.formatEther(bal)).toFixed(4);
      } catch { /* coba RPC berikutnya */ }
    }
    return "0.0000";
  }, [RPC_URLS]);

  const refreshBalance = useCallback(async () => {
    setWallet((prev) => {
      if (!prev.connected || !prev.address) return prev;
      fetchBalance(prev.address).then((bal) => {
        setWallet((current) => {
          if (!current.connected || current.address !== prev.address) return current;
          if (current.balance === bal) return current; // no-op jika sama
          return { ...current, balance: bal };
        });
      });
      return prev;
    });
  }, [fetchBalance]);

  // Mulai/stop polling saldo
  const startBalancePoll = useCallback((address: string, isWalletConnect = false) => {
    if (balancePollRef.current) clearInterval(balancePollRef.current);
    balancePollRef.current = setInterval(async () => {
      const bal = await fetchBalance(address, isWalletConnect);
      setWallet((prev) => {
        if (!prev.connected || prev.address !== address) return prev;
        if (prev.balance === bal) return prev;
        return { ...prev, balance: bal };
      });
    }, BALANCE_POLL_MS);
  }, [fetchBalance]);

  const stopBalancePoll = useCallback(() => {
    if (balancePollRef.current) {
      clearInterval(balancePollRef.current);
      balancePollRef.current = null;
    }
  }, []);

  // ─── EIP-6963 discovery ─────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    discoverProviders(800).then(setDiscoveredProviders);
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

  // Cleanup polling on unmount
  useEffect(() => () => stopBalancePoll(), [stopBalancePoll]);

  // ─── Switch network ─────────────────────────────────────────────────────
  const switchToSepolia = useCallback(async (provider?: any) => {
    const eth = provider ?? activeProviderRef.current ?? (typeof window !== "undefined" ? (window as any).ethereum : null);
    if (!eth) return;
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: SEPOLIA_HEX }] });
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
      if (newChainId === SEPOLIA_CHAIN_ID) toast.success("Switched to Sepolia! ✅");
    } catch { /* ignore */ }
  }, []);

  // ─── Connect ─────────────────────────────────────────────────────────────
  const connect = useCallback(async (walletType = "metamask") => {
    if (typeof window === "undefined") return;
    setIsConnecting(true);
    try { sessionStorage.removeItem("chainvotes_disconnected"); } catch { /* ignore */ }

    let cancelled = false;
    abortRef.current = { abort: () => { cancelled = true; } };

    try {
      // WalletConnect path
      if (walletType === "walletconnect") {
        if (!WC_PROJECT_ID || WC_PROJECT_ID === "YOUR_PROJECT_ID_HERE") {
          toast.error("WalletConnect Project ID belum dikonfigurasi.");
          return;
        }
        toast.info("Membuka QR Code WalletConnect...", { duration: 5000 });
        let wcProvider: any;
        try {
          wcProvider = await getWalletConnectProvider();
        } catch {
          toast.error("Gagal inisialisasi WalletConnect. Cek koneksi internet kamu.");
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
            toast.info("Modal ditutup.");
          } else {
            toast.error(`WalletConnect error: ${msg.slice(0, 100)}`);
          }
          return;
        }
        if (cancelled) { await wcProvider.disconnect().catch(() => {}); return; }

        let accounts: string[] = wcProvider.accounts ?? [];
        if (!accounts.length) {
          try { accounts = await wcProvider.request({ method: "eth_accounts" }); } catch { /* ignore */ }
        }
        if (!accounts.length) {
          await new Promise((r) => setTimeout(r, 600));
          accounts = wcProvider.accounts ?? [];
          try {
            if (!accounts.length) accounts = await wcProvider.request({ method: "eth_accounts" });
          } catch { /* ignore */ }
        }
        if (!accounts.length) { toast.error("Tidak ada akun dari WalletConnect."); return; }

        const chainId = wcProvider.chainId ?? SEPOLIA_CHAIN_ID;
        const address = accounts[0];
        activeProviderRef.current = wcProvider;
        const balance = await fetchBalance(address, true);
        setWallet({ connected: true, address, chainId, balance });
        try { localStorage.setItem(LAST_WALLET_KEY, "walletconnect"); } catch { /* ignore */ }
        startBalancePoll(address, true);

        if (chainId !== SEPOLIA_CHAIN_ID) {
          toast.success("WalletConnect terhubung! 🎉");
          toast.warning('Kamu di jaringan salah. Klik "WRONG NETWORK" untuk pindah ke Sepolia.', { duration: 6000 });
        } else {
          toast.success(`WalletConnect: ${address.slice(0, 6)}...${address.slice(-4)} 🎉`);
        }

        wcProvider.on("accountsChanged", async (accs: string[]) => {
          if (!accs?.length) {
            stopBalancePoll();
            setWallet({ connected: false, address: null, chainId: null, balance: null });
            try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
            toast.warning("WalletConnect disconnected.");
            return;
          }
          const newAddr = accs[0];
          const newBal = await fetchBalance(newAddr, true);
          setWallet((prev) => ({ ...prev, address: newAddr, balance: newBal }));
          startBalancePoll(newAddr, true);
        });

        wcProvider.on("chainChanged", (chainIdNum: number) => {
          setWallet((prev) => ({ ...prev, chainId: chainIdNum }));
          if (chainIdNum !== SEPOLIA_CHAIN_ID) toast.warning("Network berganti. Silakan pindah ke Sepolia.");
          else toast.success("Sekarang di Sepolia Testnet.");
        });

        wcProvider.on("disconnect", () => {
          stopBalancePoll();
          setWallet({ connected: false, address: null, chainId: null, balance: null });
          activeProviderRef.current = null;
          wcProviderCache = null;
          try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
          toast.info("WalletConnect terputus.");
        });
        return;
      }

      // Browser wallet path
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
      toast.info("Buka wallet kamu dan setujui permintaan koneksi...", { duration: 8000 });

      let accounts: string[];
      try {
        accounts = await requestAccounts(provider);
      } catch (reqErr: any) {
        if (cancelled) return;
        const code = reqErr.code ?? reqErr?.error?.code;
        if (reqErr.message === "WALLET_TIMEOUT") {
          toast.error("Wallet tidak merespons. Pastikan wallet terbuka lalu coba lagi.");
          return;
        }
        if (code === 4001 || reqErr.message?.includes("rejected") || reqErr.message?.includes("denied")) {
          toast.error("Koneksi ditolak.");
          return;
        }
        if (code === -32002) {
          toast.warning("Ada permintaan koneksi pending — buka wallet dan setujui.");
          return;
        }
        throw reqErr;
      }
      if (cancelled) return;
      if (!accounts?.length) { toast.error("Tidak ada akun ditemukan."); return; }

      let chainIdHex = "0x0";
      try { chainIdHex = await provider.request({ method: "eth_chainId" }); } catch { /* ignore */ }
      if (cancelled) return;

      const chainId = parseInt(chainIdHex, 16);
      const address = accounts[0];
      const balance = await fetchBalance(address, false);
      setWallet({ connected: true, address, chainId, balance });
      try { localStorage.setItem(LAST_WALLET_KEY, walletType); } catch { /* ignore */ }
      startBalancePoll(address);

      if (chainId !== SEPOLIA_CHAIN_ID) {
        toast.success(`${walletType} terhubung! 🎉`);
        toast.warning('Kamu di jaringan salah. Klik "WRONG NETWORK" untuk pindah ke Sepolia.', { duration: 6000 });
      } else {
        toast.success(`${walletType} terhubung: ${address.slice(0, 6)}...${address.slice(-4)} 🎉`);
      }

      const handleAccountsChanged = async (accs: string[]) => {
        if (!accs?.length) {
          stopBalancePoll();
          setWallet({ connected: false, address: null, chainId: null, balance: null });
          try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
          toast.warning("Wallet terputus.");
          return;
        }
        const newAddr = accs[0];
        const newBal = await fetchBalance(newAddr, false);
        setWallet((prev) => ({ ...prev, address: newAddr, balance: newBal }));
        startBalancePoll(newAddr);
        toast.info(`Akun: ${newAddr.slice(0, 6)}...${newAddr.slice(-4)}`);
      };

      const handleChainChanged = (hex: string) => {
        const cid = parseInt(hex, 16);
        setWallet((prev) => ({ ...prev, chainId: cid }));
        if (cid !== SEPOLIA_CHAIN_ID) toast.warning("Jaringan berganti. Silakan pindah ke Sepolia.");
        else toast.success("Sekarang di Sepolia Testnet.");
      };

      try {
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("chainChanged", handleChainChanged);
      } catch { /* some providers don't support .on() */ }

    } catch (err: any) {
      if (cancelled) return;
      const msg = err?.message ?? err?.toString() ?? "Unknown error";
      toast.error(`Error koneksi: ${msg.slice(0, 120)}`);
    } finally {
      if (!cancelled) setIsConnecting(false);
      abortRef.current = null;
    }
  }, [fetchBalance, discoveredProviders, startBalancePoll, stopBalancePoll]);

  // ─── Disconnect ───────────────────────────────────────────────────────────
  const disconnect = useCallback(async () => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
    setIsConnecting(false);
    stopBalancePoll();

    const provider = activeProviderRef.current ?? (typeof window !== "undefined" ? (window as any).ethereum : null);
    if (provider) {
      try {
        if (provider.disconnect) {
          await provider.disconnect();
          wcProviderCache = null;
        } else {
          await provider.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] });
        }
      } catch { /* tidak semua wallet support ini */ }
    }

    setWallet({ connected: false, address: null, chainId: null, balance: null });
    activeProviderRef.current = null;
    try {
      localStorage.removeItem(LAST_WALLET_KEY);
      sessionStorage.setItem("chainvotes_disconnected", "1");
    } catch { /* ignore */ }
    toast.info("Wallet terputus dari app.");
  }, [stopBalancePoll]);

  // ─── Auto-reconnect ───────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const autoReconnect = async () => {
      try {
        if (sessionStorage.getItem("chainvotes_disconnected") === "1") return;
      } catch { /* ignore */ }

      let lastWalletType = "metamask";
      try {
        const stored = localStorage.getItem(LAST_WALLET_KEY);
        if (!stored) return;
        lastWalletType = stored;
      } catch { return; }

      // WalletConnect auto-reconnect
      if (lastWalletType === "walletconnect") {
        try {
          const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
          const wcProvider = await EthereumProvider.init({
            projectId: WC_PROJECT_ID,
            chains: [SEPOLIA_CHAIN_ID],
            optionalChains: [SEPOLIA_CHAIN_ID],
            showQrModal: false,
            metadata: {
              name: "ChainVotes",
              description: "Decentralized governance on Sepolia",
              url: typeof window !== "undefined" ? window.location.origin : "https://chainvotes.app",
              icons: [],
            },
            rpcMap: {
              [SEPOLIA_CHAIN_ID]: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? "https://rpc2.sepolia.org",
            },
          });
          if (wcProvider.connected && wcProvider.accounts?.length) {
            wcProviderCache = wcProvider;
            activeProviderRef.current = wcProvider;
            const address = wcProvider.accounts[0];
            const chainId = wcProvider.chainId ?? SEPOLIA_CHAIN_ID;
            const balance = await fetchBalance(address, true);
            setWallet({ connected: true, address, chainId, balance });
            startBalancePoll(address, true);
            wcProvider.on("disconnect", () => {
              stopBalancePoll();
              setWallet({ connected: false, address: null, chainId: null, balance: null });
              activeProviderRef.current = null;
              wcProviderCache = null;
              try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
            });
          }
        } catch { /* WC session expired */ }
        return;
      }

      // Browser wallet auto-reconnect
      const providers = await discoverProviders(800);
      const provider = resolveProvider(lastWalletType, providers);
      const eth = provider ?? (window as any).ethereum;
      if (!eth) return;
      try {
        const accounts: string[] = await eth.request({ method: "eth_accounts" });
        if (!accounts?.length) return;
        const chainIdHex: string = await eth.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);
        const address = accounts[0];
        activeProviderRef.current = eth;
        const balance = await fetchBalance(address, false);
        setWallet({ connected: true, address, chainId, balance });
        startBalancePoll(address);
      } catch { /* ignore */ }
    };
    autoReconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose active provider agar ProposalsContext bisa pakai provider yang benar (WC atau browser)
  const getActiveProvider = useCallback(() => {
    return activeProviderRef.current ?? (typeof window !== "undefined" ? (window as any).ethereum : null);
  }, []);

  const shortAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : null;

  const isWrongNetwork =
    wallet.connected && wallet.chainId !== null && wallet.chainId !== SEPOLIA_CHAIN_ID;

  return (
    <WalletContext.Provider value={{
      wallet, connect, disconnect, shortAddress,
      isConnecting, isWrongNetwork,
      switchToSepolia: () => switchToSepolia(),
      discoveredProviders, refreshBalance, getActiveProvider,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────
export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWalletContext must be used inside WalletProvider");
  return ctx;
}
