"use client";
import { createContext, useContext, useRef, useEffect, useState, useCallback, ReactNode } from "react";
import { WalletState } from "@/types";
import { toast } from "sonner";
import { ethers } from "ethers";
import { SEPOLIA_RPC_URLS, withRpcFallback } from "@/lib/rpc";

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
// Promise lock: satu EthereumProvider.init() berjalan dalam satu waktu.
// wcInitPromise TIDAK di-null setelah resolve sehingga panggilan berikutnya
// langsung mendapat promise yang sudah selesai tanpa memulai init baru.
// Ini mencegah "WalletConnect Core is already initialized" warning.
// wcInitPromise hanya di-null saat disconnect() eksplisit.
let wcInitPromise: Promise<any> | null = null;

// Hapus sisa session WalletConnect orphan dari localStorage.
// Session orphan terjadi saat tab ditutup paksa / browser crash dan menyebabkan
// "No matching key" dan "Pending session not found" di console.
function clearOrphanWcSessions(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (
        k.startsWith("wc@2:") ||
        k.startsWith("walletconnect") ||
        k.startsWith("W3M") ||
        k.startsWith("wagmi.wallet") ||
        k === "WALLETCONNECT_DEEPLINK_CHOICE"
      )) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch { /* ignore - private browsing */ }
}

async function getWalletConnectProvider(forceNew = false): Promise<any> {
  // Return cached instance jika masih connected
  if (!forceNew && wcProviderCache?.connected) return wcProviderCache;

  // Jika init sedang berjalan, tunggu promise yang sama - jangan init ulang
  if (wcInitPromise) return wcInitPromise;

  wcInitPromise = (async () => {
    const { EthereumProvider } = await import("@walletconnect/ethereum-provider");
    let provider: any = null;
    for (const rpcUrl of SEPOLIA_RPC_URLS) {
      try {
        provider = await EthereumProvider.init({
          projectId: WC_PROJECT_ID,
          chains: [SEPOLIA_CHAIN_ID],
          optionalChains: [SEPOLIA_CHAIN_ID],
          showQrModal: true,
          disableProviderPing: true,
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
  })();
  // Tidak ada .finally() yang null-kan wcInitPromise di sini.
  // Promise disimpan permanent sampai disconnect() eksplisit.
  return wcInitPromise;
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
  const fetchBalance = useCallback(async (address: string, isWalletConnect = false): Promise<string> => {
    // Browser wallet: try window.ethereum first, then fall back to RPC
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
      } catch { /* fall through to RPC */ }
    }

    // WalletConnect or browser wallet fallback: try each RPC in order
    try {
      return await withRpcFallback(async (rpcUrl) => {
        const rpcProvider = new ethers.JsonRpcProvider(rpcUrl);
        const bal = await rpcProvider.getBalance(address);
        return parseFloat(ethers.formatEther(bal)).toFixed(4);
      });
    } catch {
      return "0.0000";
    }
  }, []);

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
          toast.error("WalletConnect Project ID not configured.");
          return;
        }
        toast.info("Opening WalletConnect QR Code...", { duration: 5000 });
        let wcProvider: any;
        try {
          // Coba provider yang sudah ada dulu; kalau connect() gagal karena
          // session orphan, bersihkan storage dan init ulang (forceNew=true)
          wcProvider = await getWalletConnectProvider();
        } catch {
          toast.error("Failed to initialize WalletConnect. Check your internet connection.");
          return;
        }
        if (cancelled) { await wcProvider.disconnect().catch(() => {}); return; }
        try {
          await wcProvider.connect();
        } catch (connErr: any) {
          // Jika gagal karena session lama yang corrupt, bersihkan dan coba ulang sekali
          const connMsg = connErr?.message ?? "";
          if (
            connMsg.includes("No matching key") ||
            connMsg.includes("Pending session not found") ||
            connMsg.includes("session") ||
            connMsg.includes("pairing")
          ) {
            try { await wcProvider.disconnect().catch(() => {}); } catch { /* ignore */ }
            clearOrphanWcSessions();
            wcProviderCache = null;
            wcInitPromise = null;
            try {
              wcProvider = await getWalletConnectProvider(true);
              if (cancelled) { await wcProvider.disconnect().catch(() => {}); return; }
              await wcProvider.connect();
            } catch (retryErr: any) {
              if (cancelled) return;
              const retryMsg = retryErr?.message ?? "";
              if (retryMsg.includes("User rejected") || retryMsg.includes("Modal closed")) {
                toast.info("WalletConnect cancelled.");
              } else {
                toast.error(`WalletConnect error: ${retryMsg.slice(0, 100)}`);
              }
              return;
            }
            // connect() retry berhasil — lanjut ke account resolution di bawah
          } else {
            // Error bukan karena session orphan
            if (cancelled) return;
            const msg = connErr?.message ?? "";
            if (msg.includes("User rejected") || msg.includes("rejected")) {
              toast.error("WalletConnect connection cancelled.");
            } else if (msg.includes("Modal closed")) {
              toast.info("Modal closed.");
            } else {
              toast.error(`WalletConnect error: ${msg.slice(0, 100)}`);
            }
            return;
          }
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
        if (!accounts.length) { toast.error("No accounts received from WalletConnect."); return; }

        const chainId = wcProvider.chainId ?? SEPOLIA_CHAIN_ID;
        const address = accounts[0];
        activeProviderRef.current = wcProvider;
        const balance = await fetchBalance(address, true);
        setWallet({ connected: true, address, chainId, balance });
        try { localStorage.setItem(LAST_WALLET_KEY, "walletconnect"); } catch { /* ignore */ }
        startBalancePoll(address, true);

        if (chainId !== SEPOLIA_CHAIN_ID) {
          toast.success("WalletConnect connected! 🎉");
          toast.warning('Wrong network detected. Click "WRONG NETWORK" to switch to Sepolia.', { duration: 6000 });
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
          if (chainIdNum !== SEPOLIA_CHAIN_ID) toast.warning("Network changed. Please switch to Sepolia.");
          else toast.success("Now on Sepolia Testnet.");
        });

        wcProvider.on("disconnect", () => {
          stopBalancePoll();
          setWallet({ connected: false, address: null, chainId: null, balance: null });
          activeProviderRef.current = null;
          wcProviderCache = null;
          wcInitPromise = null;
          clearOrphanWcSessions();
          try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
          toast.info("WalletConnect disconnected.");
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
        toast.error(`${walletType} not found. Opening install page...`);
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
      if (!accounts?.length) { toast.error("No accounts found."); return; }

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
        toast.success(`${walletType} connected! 🎉`);
        toast.warning('Wrong network detected. Click "WRONG NETWORK" to switch to Sepolia.', { duration: 6000 });
      } else {
        toast.success(`${walletType} connected: ${address.slice(0, 6)}...${address.slice(-4)} 🎉`);
      }

      const handleAccountsChanged = async (accs: string[]) => {
        if (!accs?.length) {
          stopBalancePoll();
          setWallet({ connected: false, address: null, chainId: null, balance: null });
          try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
          toast.warning("Wallet disconnected.");
          return;
        }
        const newAddr = accs[0];
        const newBal = await fetchBalance(newAddr, false);
        setWallet((prev) => ({ ...prev, address: newAddr, balance: newBal }));
        startBalancePoll(newAddr);
        toast.info(`Account: ${newAddr.slice(0, 6)}...${newAddr.slice(-4)}`);
      };

      const handleChainChanged = (hex: string) => {
        const cid = parseInt(hex, 16);
        setWallet((prev) => ({ ...prev, chainId: cid }));
        if (cid !== SEPOLIA_CHAIN_ID) toast.warning("Network changed. Please switch to Sepolia.");
        else toast.success("Now on Sepolia Testnet.");
      };

      try {
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("chainChanged", handleChainChanged);
      } catch { /* some providers don't support .on() */ }

    } catch (err: any) {
      if (cancelled) return;
      const msg = err?.message ?? err?.toString() ?? "Unknown error";
      toast.error(`Connection error: ${msg.slice(0, 120)}`);
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
          // Reset semua WC state agar init bersih saat connect berikutnya
          wcProviderCache = null;
          wcInitPromise = null;
          clearOrphanWcSessions();
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
    toast.info("Wallet disconnected from app.");
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
      // Use getWalletConnectProvider() so the promise lock is respected —
      // prevents double init when auto-reconnect and manual connect race on page load
      if (lastWalletType === "walletconnect") {
        try {
          const wcProvider = await getWalletConnectProvider();
          if (wcProvider.connected && wcProvider.accounts?.length) {
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
              wcInitPromise = null;
              clearOrphanWcSessions();
              try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
            });
          } else {
            // Session WC ada tapi tidak valid (orphan) — bersihkan agar
            // connect berikutnya mulai dari fresh tanpa error "No matching key"
            wcProviderCache = null;
            wcInitPromise = null;
            clearOrphanWcSessions();
            try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
          }
        } catch {
          // Session expired atau tidak ada — bersihkan residual storage
          wcProviderCache = null;
          wcInitPromise = null;
          clearOrphanWcSessions();
          try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
        }
        return;
      }

      // Browser wallet auto-reconnect
      // Wait up to 2s for wallet to inject — some extensions are slow on cold start
      const providers = await discoverProviders(2000);
      const provider = resolveProvider(lastWalletType, providers);
      // Also check window.ethereum as fallback in case EIP-6963 announce was missed
      const eth = provider ?? (window as any).ethereum;
      if (!eth) return;
      try {
        // eth_accounts (no popup) — returns [] if not previously connected
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
