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

// EIP-6963: announced provider detail
export interface EIP6963ProviderDetail {
  info: {
    uuid: string;
    name: string;
    icon: string; // data URI
    rdns: string; // e.g. "io.metamask", "com.bitget.web3"
  };
  provider: any;
}

// Detect all available wallet providers via EIP-6963
function discoverProviders(): Promise<EIP6963ProviderDetail[]> {
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

    // Give wallets 300ms to respond
    setTimeout(() => {
      window.removeEventListener("eip6963:announceProvider", handler as EventListener);
      resolve(found);
    }, 300);
  });
}

// Resolve provider for a specific wallet type
function resolveProvider(walletType: string, providers: EIP6963ProviderDetail[]): any | null {
  const typeNorm = walletType.toLowerCase();

  // Try EIP-6963 first (most reliable)
  if (providers.length > 0) {
    // Exact rdns match
    const rdnsMap: Record<string, string[]> = {
      metamask: ["io.metamask", "io.metamask.flask"],
      bitget: ["com.bitget.web3", "com.bitkeep"],
      coinbase: ["com.coinbase.wallet"],
      brave: ["com.brave.wallet"],
      trust: ["com.trustwallet.app"],
    };
    const targetRdns = rdnsMap[typeNorm] ?? [];
    for (const rdns of targetRdns) {
      const match = providers.find((p) => p.info.rdns === rdns);
      if (match) return match.provider;
    }
    // Fallback: name substring match
    const byName = providers.find((p) =>
      p.info.name.toLowerCase().includes(typeNorm)
    );
    if (byName) return byName.provider;
  }

  // Fallback: legacy window.ethereum (works when only one wallet installed)
  if (typeof window !== "undefined" && (window as any).ethereum) {
    const eth = (window as any).ethereum;

    // MetaMask flag check
    if (typeNorm === "metamask" && eth.isMetaMask && !eth.isBitKeep && !eth.isBitget) return eth;
    // Bitget/BitKeep flag check
    if (typeNorm === "bitget" && (eth.isBitKeep || eth.isBitget)) return eth;
    // Coinbase
    if (typeNorm === "coinbase" && eth.isCoinbaseWallet) return eth;
    // Brave
    if (typeNorm === "brave" && eth.isBraveWallet) return eth;
    // Generic fallback: return whatever is there
    if (!["metamask", "bitget", "coinbase", "brave"].includes(typeNorm)) return eth;

    // Last resort: if providers list was empty and we have *any* window.ethereum
    if (providers.length === 0) return eth;
  }

  return null;
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

  // Discover EIP-6963 providers on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    discoverProviders().then((providers) => {
      setDiscoveredProviders(providers);
    });

    // Also listen for late announcements (wallets that announce after page load)
    const lateHandler = (event: Event) => {
      const detail = (event as CustomEvent<EIP6963ProviderDetail>).detail;
      if (!detail?.info?.uuid) return;
      setDiscoveredProviders((prev) => {
        if (prev.find((p) => p.info.uuid === detail.info.uuid)) return prev;
        return [...prev, detail];
      });
    };
    window.addEventListener("eip6963:announceProvider", lateHandler as EventListener);
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
      // 4902 = chain not added yet
      if (err.code === 4902 || err?.data?.originalError?.code === 4902) {
        await eth.request({
          method: "wallet_addEthereumChain",
          params: [SEPOLIA_PARAMS],
        });
        // After adding, try switching again
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_HEX }],
        });
      } else {
        throw err;
      }
    }
  }, []);

  const connect = useCallback(async (walletType = "metamask") => {
    if (typeof window === "undefined") return;

    setIsConnecting(true);
    try {
      // Re-discover providers fresh each connect attempt (in case user just installed)
      const freshProviders = await discoverProviders();
      setDiscoveredProviders(freshProviders);

      const provider = resolveProvider(walletType, freshProviders);

      if (!provider) {
        const installUrls: Record<string, string> = {
          metamask: "https://metamask.io/download/",
          bitget: "https://web3.bitget.com/en/wallet-download",
          coinbase: "https://www.coinbase.com/wallet/downloads",
          brave: "https://brave.com/download/",
        };
        const url = installUrls[walletType.toLowerCase()] ?? "https://metamask.io/download/";
        toast.error(`${walletType} not found. Opening install page...`);
        window.open(url, "_blank", "noopener,noreferrer");
        return;
      }

      activeProviderRef.current = provider;

      // Request accounts — this is where MetaMask/Bitget pop-up appears
      let accounts: string[];
      try {
        accounts = await provider.request({ method: "eth_requestAccounts" });
      } catch (reqErr: any) {
        // Code 4001 = user rejected
        if (reqErr.code === 4001 || reqErr.code === "ACTION_REJECTED") {
          toast.error("Connection rejected. Please approve in your wallet.");
          return;
        }
        // Some wallets return -32002 when a request is already pending
        if (reqErr.code === -32002) {
          toast.info("Connection request already pending — check your wallet.");
          return;
        }
        throw reqErr;
      }

      if (!accounts || accounts.length === 0) {
        toast.error("No accounts found. Please unlock your wallet.");
        return;
      }

      // Check and switch chain
      let chainIdHex: string;
      try {
        chainIdHex = await provider.request({ method: "eth_chainId" });
      } catch {
        chainIdHex = SEPOLIA_HEX;
      }

      const chainId = parseInt(chainIdHex, 16);
      if (chainId !== SEPOLIA_CHAIN_ID) {
        toast.info("Switching to Sepolia...");
        try {
          await switchToSepolia(provider);
        } catch (switchErr: any) {
          if (switchErr.code === 4001) {
            toast.error("Network switch rejected. Please manually switch to Sepolia.");
            return;
          }
          toast.error("Could not switch to Sepolia. Please switch manually.");
          return;
        }
      }

      const address = accounts[0];
      const balance = await fetchBalance(address, provider);

      setWallet({ connected: true, address, chainId: SEPOLIA_CHAIN_ID, balance });
      toast.success(`${walletType} connected: ${address.slice(0, 6)}...${address.slice(-4)}`);

      // Attach listeners to this specific provider
      const handleAccountsChanged = async (accs: string[]) => {
        if (!accs || accs.length === 0) {
          setWallet({ connected: false, address: null, chainId: null, balance: null });
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
          toast.warning("Switched to wrong network. Please use Sepolia.");
        } else {
          toast.success("Now on Sepolia Testnet.");
        }
      };

      try {
        provider.on("accountsChanged", handleAccountsChanged);
        provider.on("chainChanged", handleChainChanged);
      } catch {
        // Some providers don't support .on() — ignore
      }
    } catch (err: any) {
      console.error("[useWallet] connect error:", err);
      const msg = err?.message ?? err?.toString() ?? "Unknown error";
      // Filter out internal MetaMask/Bitget noise
      if (msg.includes("Failed to connect") || msg.includes("inpage.js")) {
        toast.error("Wallet connection failed. Try refreshing the page or unlocking your wallet.");
      } else {
        toast.error(`Connection error: ${msg.slice(0, 100)}`);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [fetchBalance, switchToSepolia]);

  const disconnect = useCallback(() => {
    setWallet({ connected: false, address: null, chainId: null, balance: null });
    activeProviderRef.current = null;
    toast.info("Wallet disconnected.");
  }, []);

  // Auto-reconnect on mount if wallet was previously connected
  useEffect(() => {
    if (typeof window === "undefined") return;
    const eth = (window as any).ethereum;
    if (!eth) return;

    eth.request({ method: "eth_accounts" })
      .then(async (accounts: string[]) => {
        if (!accounts || accounts.length === 0) return;
        const chainIdHex: string = await eth.request({ method: "eth_chainId" });
        const chainId = parseInt(chainIdHex, 16);
        const address = accounts[0];
        activeProviderRef.current = eth;
        const balance = await fetchBalance(address, eth);
        setWallet({ connected: true, address, chainId, balance });
      })
      .catch(() => {});
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
