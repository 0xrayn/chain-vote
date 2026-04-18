"use client";
import { useEffect, useState } from "react";
import { X, Wallet, Shield, Zap, ChevronRight, Loader2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { EIP6963ProviderDetail } from "@/hooks/useWallet";

interface WalletOption {
  id: string;           // matches walletType string for connect()
  name: string;
  desc: string;
  icon: string;         // emoji fallback
  rdns: string[];       // EIP-6963 rdns identifiers
  installUrl: string;
  popular?: boolean;
}

const WALLET_OPTIONS: WalletOption[] = [
  {
    id: "metamask",
    name: "MetaMask",
    desc: "Most popular browser wallet",
    icon: "🦊",
    rdns: ["io.metamask", "io.metamask.flask"],
    installUrl: "https://metamask.io/download/",
    popular: true,
  },
  {
    id: "bitget",
    name: "Bitget Wallet",
    desc: "All-in-one Web3 wallet",
    icon: "🔷",
    rdns: ["com.bitget.web3", "com.bitkeep"],
    installUrl: "https://web3.bitget.com/en/wallet-download",
    popular: true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    desc: "Simple & secure",
    icon: "🔵",
    rdns: ["com.coinbase.wallet"],
    installUrl: "https://www.coinbase.com/wallet/downloads",
  },
  {
    id: "brave",
    name: "Brave Wallet",
    desc: "Built into Brave browser",
    icon: "🦁",
    rdns: ["com.brave.wallet"],
    installUrl: "https://brave.com/download/",
  },
];

interface ConnectWalletModalProps {
  onConnect: (walletType: string) => void;
  onClose: () => void;
  isConnecting?: boolean;
  connectingWallet?: string;
  discoveredProviders?: EIP6963ProviderDetail[];
}

export default function ConnectWalletModal({
  onConnect,
  onClose,
  isConnecting = false,
  connectingWallet = "",
  discoveredProviders = [],
}: ConnectWalletModalProps) {

  const [providerIcons, setProviderIcons] = useState<Record<string, string>>({});

  // Extract icons from EIP-6963 providers
  useEffect(() => {
    const icons: Record<string, string> = {};
    for (const p of discoveredProviders) {
      for (const option of WALLET_OPTIONS) {
        if (option.rdns.includes(p.info.rdns) && p.info.icon) {
          icons[option.id] = p.info.icon;
        }
      }
    }
    setProviderIcons(icons);
  }, [discoveredProviders]);

  // Check if a wallet is detected (via EIP-6963 or legacy flags)
  const isDetected = (option: WalletOption): boolean => {
    // EIP-6963 check
    if (discoveredProviders.some((p) => option.rdns.includes(p.info.rdns))) return true;
    // Legacy flag check
    if (typeof window === "undefined") return false;
    const eth = (window as any).ethereum;
    if (!eth) return false;
    if (option.id === "metamask" && eth.isMetaMask) return true;
    if (option.id === "bitget" && (eth.isBitKeep || eth.isBitget)) return true;
    if (option.id === "coinbase" && eth.isCoinbaseWallet) return true;
    if (option.id === "brave" && eth.isBraveWallet) return true;
    return false;
  };

  const anyDetected = WALLET_OPTIONS.some(isDetected);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-bg animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && !isConnecting && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-scaleIn"
        style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(0,245,160,0.08)", border: "1px solid rgba(0,245,160,0.25)" }}
            >
              <Wallet size={16} style={{ color: "var(--neon)" }} />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: "var(--text)" }}>Connect Wallet</h2>
              <p className="text-xs" style={{ color: "var(--muted)" }}>
                {discoveredProviders.length > 0
                  ? `${discoveredProviders.length} wallet${discoveredProviders.length > 1 ? "s" : ""} detected`
                  : "Choose your wallet provider"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isConnecting}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            <X size={13} />
          </button>
        </div>

        <div className="p-4">
          {/* Sepolia notice */}
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4"
            style={{ background: "rgba(0,245,160,0.04)", border: "1px solid rgba(0,245,160,0.12)" }}
          >
            <Shield size={13} style={{ color: "var(--neon)", marginTop: "2px", flexShrink: 0 }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--text2)" }}>
              Connecting to <span style={{ color: "var(--neon)" }}>Sepolia Testnet</span>.
              No real funds needed. Verify the URL before signing.
            </p>
          </div>

          {/* No wallet detected warning */}
          {!anyDetected && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4"
              style={{ background: "rgba(255,165,2,0.06)", border: "1px solid rgba(255,165,2,0.2)" }}
            >
              <AlertTriangle size={13} style={{ color: "var(--warn)", marginTop: "2px", flexShrink: 0 }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--text2)" }}>
                <span style={{ color: "var(--warn)" }}>No wallet detected.</span>{" "}
                Install MetaMask or Bitget Wallet, then refresh the page.
              </p>
            </div>
          )}

          {/* Wallet list */}
          <div className="flex flex-col gap-2 mb-4">
            {WALLET_OPTIONS.map((w) => {
              const detected = isDetected(w);
              const isThisConnecting = isConnecting && connectingWallet === w.id;
              const disabled = isConnecting && !isThisConnecting;
              const iconSrc = providerIcons[w.id];

              return (
                <button
                  key={w.id}
                  onClick={() => {
                    if (isConnecting) return;
                    if (detected) {
                      onConnect(w.id);
                    } else {
                      window.open(w.installUrl, "_blank", "noopener,noreferrer");
                    }
                  }}
                  disabled={disabled}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 w-full disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: detected ? "var(--surface2)" : "var(--surface)",
                    border: detected
                      ? "1px solid var(--border2)"
                      : "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = detected ? "var(--neon2)" : "var(--muted)";
                      el.style.background = "var(--surface3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = detected ? "var(--border2)" : "var(--border)";
                    el.style.background = detected ? "var(--surface2)" : "var(--surface)";
                  }}
                >
                  {/* Icon */}
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    {iconSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={iconSrc} alt={w.name} width={24} height={24} style={{ borderRadius: "6px" }} />
                    ) : (
                      <span className="text-lg leading-none">{w.icon}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>
                        {w.name}
                      </span>
                      {w.popular && detected && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--neon)",
                            background: "rgba(0,245,160,0.1)",
                            fontSize: "0.6rem",
                          }}
                        >
                          POPULAR
                        </span>
                      )}
                      {!detected && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: "var(--muted)",
                            background: "rgba(74,122,155,0.08)",
                            fontSize: "0.6rem",
                          }}
                        >
                          INSTALL
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
                      {detected ? w.desc : `Click to install ${w.name}`}
                    </p>
                  </div>

                  {/* Right icon */}
                  {isThisConnecting ? (
                    <Loader2 size={15} className="animate-spin flex-shrink-0" style={{ color: "var(--neon)" }} />
                  ) : detected ? (
                    <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: "var(--neon)", opacity: 0.7 }} />
                  ) : (
                    <ChevronRight size={14} className="flex-shrink-0" style={{ color: "var(--muted)" }} />
                  )}
                </button>
              );
            })}
          </div>

          <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
            Need test ETH?{" "}
            <a
              href="https://sepoliafaucet.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "var(--neon2)", textDecoration: "underline" }}
            >
              Get Sepolia ETH →
            </a>
          </p>
        </div>

        <div
          className="px-6 py-3 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--border)", background: "var(--surface2)" }}
        >
          <Zap size={11} style={{ color: "var(--neon)" }} />
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            MULTI-WALLET · EIP-6963 · SEPOLIA
          </span>
        </div>
      </div>
    </div>
  );
}
