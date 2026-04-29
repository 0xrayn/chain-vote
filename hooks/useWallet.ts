"use client";
import { useState, useCallback, useEffect, useRef } from "react";
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

export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string;
    rdns: string;
  };
  provider: any;
}

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

// Cari provider berdasarkan walletType — lebih agresif untuk Bitget
function resolveProvider(walletType: string, providers: EIP6963ProviderDetail[]): any | null {
  const typeNorm = walletType.toLowerCase();

  // 1. Coba EIP-6963 dulu (paling akurat)
  if (providers.length > 0) {
    const rdnsMap: Record<string, string[]> = {
      metamask: ["io.metamask", "io.metamask.flask"],
      bitget:   ["com.bitget.web3", "com.bitkeep", "com.bitget.web3wallet"],
      coinbase: ["com.coinbase.wallet"],
      brave:    ["com.brave.wallet"],
      trust:    ["com.trustwallet.app"],
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

    // Jika ada multiple providers (window.ethereum.providers array)
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

    // Single provider
    if (typeNorm === "metamask" && eth.isMetaMask && !eth.isBitKeep && !eth.isBitget) return eth;
    if (typeNorm === "bitget" && (eth.isBitKeep || eth.isBitget || eth.isBitGetWallet)) return eth;
    if (typeNorm === "coinbase" && eth.isCoinbaseWallet) return eth;
    if (typeNorm === "brave" && eth.isBraveWallet) return eth;

    // Last resort: return whatever window.ethereum ada
    if (providers.length === 0) return eth;
  }

  return null;
}

// Request accounts dengan retry & timeout yang lebih cerdas
async function requestAccounts(provider: any): Promise<string[]> {
  // Cek apakah sudah ada pending request (code -32002)
  // dengan mencoba eth_accounts dulu (tidak trigger popup)
  try {
    const existing: string[] = await provider.request({ method: "eth_accounts" });
    if (existing && existing.length > 0) return existing;
  } catch { /* ignore */ }

  // Sekarang request dengan timeout 60 detik
  // (Bitget popup bisa muncul lambat, tapi user butuh waktu untuk approve)
  return new Promise<string[]>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("WALLET_TIMEOUT"));
      }
    }, 60_000);

    provider.request({ method: "eth_requestAccounts" })
      .then((accounts: string[]) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(accounts);
        }
      })
      .catch((err: any) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      });
  });
}

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
  // Simpan abort controller agar bisa cancel request yang pending
  const abortRef = useRef<{ abort: () => void } | null>(null);

  // Listen untuk provider baru yang announce setelah init
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Discovery awal — 800ms sudah cukup untuk semua wallet modern
    discoverProviders(800).then((providers) => {
      setDiscoveredProviders(providers);
    });

    // Keep listening untuk late-announcing providers
    const lateHandler = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (!detail?.info?.uuid) return;
      setDiscoveredProviders((prev) => {
        if (prev.find((p) => p.info.uuid === detail.info.uuid)) return prev;
        return [...prev, detail];
      });
    };
    window.addEventListener("eip6963:announceProvider", lateHandler as EventListener);
    // Re-request agar provider yang sudah ada announce lagi
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
    // Force-refresh chainId setelah switch — Bitget kadang tidak trigger event chainChanged
    try {
      const chainIdHex: string = await eth.request({ method: "eth_chainId" });
      const newChainId = parseInt(chainIdHex, 16);
      setWallet((prev) => ({ ...prev, chainId: newChainId }));
      if (newChainId === SEPOLIA_CHAIN_ID) {
        toast.success("Berhasil pindah ke Sepolia! ✅");
      }
    } catch { /* ignore */ }
  }, []);

  const connect = useCallback(async (walletType = "metamask") => {
    if (typeof window === "undefined") return;

    setIsConnecting(true);

    // User sengaja connect — hapus flag disconnect
    try { sessionStorage.removeItem("chainvotes_disconnected"); } catch { /* ignore */ }

    // Abort controller — dipanggil saat user cancel
    let cancelled = false;
    abortRef.current = { abort: () => { cancelled = true; } };

    try {
      // Gunakan providers yang sudah di-discover saat page load (dari state).
      // Hanya re-discover jika state masih kosong (misal connect() dipanggil sangat cepat setelah mount).
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
        };
        const url = installUrls[walletType.toLowerCase()] ?? "https://metamask.io/download/";
        toast.error(`${walletType} tidak ditemukan. Membuka halaman instalasi...`);
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      activeProviderRef.current = provider;

      // Tampilkan toast instruksi SEBELUM request — Bitget perlu user buka app-nya
      toast.info("Buka wallet kamu dan setujui permintaan koneksi...", { duration: 8000 });

      let accounts: string[];
      try {
        accounts = await requestAccounts(provider);
      } catch (reqErr: any) {
        if (cancelled) return; // user sudah cancel via modal

        const code = reqErr.code ?? reqErr?.error?.code;
        if (reqErr.message === "WALLET_TIMEOUT") {
          toast.error("Wallet tidak merespon (60 detik). Pastikan wallet kamu sudah terbuka dan coba lagi.");
          return;
        }
        if (code === 4001 || reqErr.message?.includes("rejected") || reqErr.message?.includes("denied")) {
          toast.error("Koneksi ditolak. Silakan setujui di wallet kamu.");
          return;
        }
        if (code === -32002) {
          toast.warning("Ada permintaan koneksi yang sudah pending — buka wallet kamu dan setujui.");
          return;
        }
        throw reqErr;
      }

      if (cancelled) return;

      if (!accounts || accounts.length === 0) {
        toast.error("Tidak ada akun ditemukan. Pastikan wallet kamu sudah unlock.");
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
        // Kasih tahu user network salah — tapi JANGAN auto-switch, biarkan user klik sendiri
        toast.success(`${walletType} terhubung! 🎉`);
        toast.warning("Kamu di network yang salah. Klik \"WRONG NETWORK\" di navbar untuk pindah ke Sepolia.", { duration: 6000 });
      } else {
        toast.success(`${walletType} terhubung: ${address.slice(0, 6)}...${address.slice(-4)} 🎉`);
      }

      // Event listeners
      const handleAccountsChanged = async (accs: string[]) => {
        if (!accs || accs.length === 0) {
          setWallet({ connected: false, address: null, chainId: null, balance: null });
          try { localStorage.removeItem(LAST_WALLET_KEY); } catch { /* ignore */ }
          toast.warning("Wallet terputus.");
          return;
        }
        const newAddr = accs[0];
        const newBal = await fetchBalance(newAddr, provider);
        setWallet((prev) => ({ ...prev, address: newAddr, balance: newBal }));
        toast.info(`Akun: ${newAddr.slice(0, 6)}...${newAddr.slice(-4)}`);
      };

      const handleChainChanged = (hex: string) => {
        const cid = parseInt(hex, 16);
        setWallet((prev) => ({ ...prev, chainId: cid }));
        if (cid !== SEPOLIA_CHAIN_ID) {
          toast.warning("Network berpindah ke jaringan lain. Silakan kembali ke Sepolia.");
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
        toast.error("Koneksi gagal. Coba refresh halaman atau unlock wallet kamu.");
      } else {
        toast.error(`Error koneksi: ${msg.slice(0, 120)}`);
      }
    } finally {
      if (!cancelled) setIsConnecting(false);
      abortRef.current = null;
    }
  }, [fetchBalance, switchToSepolia, discoveredProviders]);

  const disconnect = useCallback(async () => {
    // Cancel koneksi yang sedang berjalan jika ada
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    setIsConnecting(false);

    // Coba revoke permission dari wallet (didukung MetaMask & Bitget modern)
    const provider = activeProviderRef.current ?? (window as any)?.ethereum;
    if (provider) {
      try {
        await provider.request({
          method: "wallet_revokePermissions",
          params: [{ eth_accounts: {} }],
        });
      } catch {
        // Tidak semua wallet support wallet_revokePermissions — tidak apa-apa
      }
    }

    setWallet({ connected: false, address: null, chainId: null, balance: null });
    activeProviderRef.current = null;

    // Tandai bahwa user SENGAJA disconnect — auto-reconnect harus di-skip
    try {
      localStorage.removeItem(LAST_WALLET_KEY);
      sessionStorage.setItem("chainvotes_disconnected", "1");
    } catch { /* ignore */ }

    toast.info("Wallet terputus dari aplikasi.");
  }, []);

  // Auto-reconnect saat halaman dimuat — SKIP jika user sengaja disconnect
  useEffect(() => {
    if (typeof window === "undefined") return;

    const autoReconnect = async () => {
      // Cek apakah user sengaja disconnect di session ini
      try {
        const intentionalDisconnect = sessionStorage.getItem("chainvotes_disconnected");
        if (intentionalDisconnect === "1") return; // jangan auto-konek
      } catch { /* ignore */ }

      let lastWalletType = "metamask";
      try { lastWalletType = localStorage.getItem(LAST_WALLET_KEY) ?? "metamask"; } catch { /* ignore */ }

      // Kalau tidak ada lastWallet tersimpan, jangan auto-konek
      try {
        const stored = localStorage.getItem(LAST_WALLET_KEY);
        if (!stored) return;
      } catch { return; }

      const providers = await discoverProviders(800);
      const provider = resolveProvider(lastWalletType, providers);
      const eth = provider ?? (window as any).ethereum;
      if (!eth) return;

      try {
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
