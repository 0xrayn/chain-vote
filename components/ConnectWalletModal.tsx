"use client";
import { useEffect, useState } from "react";
import { X, Wallet, Shield, Zap, ChevronRight, Loader2, AlertTriangle, CheckCircle2, Smartphone } from "lucide-react";
import { EIP6963ProviderDetail } from "@/hooks/useWallet";

interface WalletOption {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rdns: string[];
  installUrl: string;
  popular?: boolean;
  isMobile?: boolean;
  alwaysShow?: boolean;
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
    rdns: ["com.bitget.web3", "com.bitkeep", "com.bitget.web3wallet"],
    installUrl: "https://web3.bitget.com/en/wallet-download",
    popular: true,
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    desc: "Scan QR dari Trust, Rainbow, MetaMask Mobile & 300+ wallet HP",
    icon: "🔗",
    rdns: [],
    installUrl: "",
    isMobile: true,
    alwaysShow: true,
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
    id: "trust",
    name: "Trust Wallet",
    desc: "Browser extension Trust Wallet",
    icon: "🛡️",
    rdns: ["com.trustwallet.app"],
    installUrl: "https://trustwallet.com/browser-extension",
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
  onForceCancel?: () => void;
  isConnecting?: boolean;
  connectingWallet?: string;
  discoveredProviders?: EIP6963ProviderDetail[];
}

export default function ConnectWalletModal({
  onConnect,
  onClose,
  onForceCancel,
  isConnecting = false,
  connectingWallet = "",
  discoveredProviders = [],
}: ConnectWalletModalProps) {

  const [providerIcons, setProviderIcons] = useState<Record<string, string>>({});

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isConnecting && onForceCancel) {
        onForceCancel();
      } else if (!isConnecting) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isConnecting, onClose, onForceCancel]);

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

  const isDetected = (option: WalletOption): boolean => {
    if (option.id === "walletconnect") return true;
    if (discoveredProviders.some((p) => option.rdns.includes(p.info.rdns))) return true;
    if (typeof window === "undefined") return false;
    const eth = (window as any).ethereum;
    if (!eth) return false;
    if (option.id === "metamask" && eth.isMetaMask) return true;
    if (option.id === "bitget" && (eth.isBitKeep || eth.isBitget)) return true;
    if (option.id === "coinbase" && eth.isCoinbaseWallet) return true;
    if (option.id === "brave" && eth.isBraveWallet) return true;
    if (option.id === "trust" && (eth.isTrust || eth.isTrustWallet)) return true;
    return false;
  };

  const visibleWallets = WALLET_OPTIONS.filter((w) => isDetected(w) || w.alwaysShow);
  const notInstalled = WALLET_OPTIONS.filter((w) => !isDetected(w) && !w.alwaysShow);
  const anyBrowserWalletDetected = WALLET_OPTIONS.filter((w) => w.id !== "walletconnect").some(isDetected);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-bg animate-fadeIn"
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        if (isConnecting && onForceCancel) onForceCancel();
        else if (!isConnecting) onClose();
      }}
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
                  : "Pilih wallet kamu"}
              </p>
            </div>
          </div>
          {isConnecting && onForceCancel ? (
            <button
              onClick={onForceCancel}
              className="flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs transition-all duration-200 hover:opacity-80"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#f87171", fontFamily: "var(--font-mono)" }}
            >
              <X size={11} />
              CANCEL
            </button>
          ) : (
            <button
              onClick={onClose}
              disabled={isConnecting}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)" }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        <div className="p-4">
          {/* Sepolia notice */}
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4"
            style={{ background: "rgba(0,245,160,0.04)", border: "1px solid rgba(0,245,160,0.12)" }}
          >
            <Shield size={13} style={{ color: "var(--neon)", marginTop: "2px", flexShrink: 0 }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--text2)" }}>
              App ini berjalan di <span style={{ color: "var(--neon)" }}>Sepolia Testnet</span> — hanya test ETH, bukan uang nyata.
              Setelah connect, klik <span style={{ color: "var(--warn)" }}>WRONG NETWORK</span> jika muncul.
            </p>
          </div>

          {/* No browser wallet warning */}
          {!anyBrowserWalletDetected && (
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4"
              style={{ background: "rgba(255,165,2,0.06)", border: "1px solid rgba(255,165,2,0.2)" }}
            >
              <AlertTriangle size={13} style={{ color: "var(--warn)", marginTop: "2px", flexShrink: 0 }} />
              <p className="text-xs leading-relaxed" style={{ color: "var(--text2)" }}>
                <span style={{ color: "var(--warn)" }}>Tidak ada wallet browser terdeteksi.</span>{" "}
                Gunakan <strong>WalletConnect</strong> untuk connect dari HP, atau install{" "}
                <strong>MetaMask / Bitget</strong> di browser ini lalu refresh.
              </p>
            </div>
          )}

          {/* Detected / always-show wallets */}
          <div className="flex flex-col gap-2 mb-3">
            {visibleWallets.map((w) => {
              const isWC = w.id === "walletconnect";
              const isThisConnecting = isConnecting && connectingWallet === w.id;
              const disabled = isConnecting && !isThisConnecting;
              const iconSrc = providerIcons[w.id];
              const detected = isDetected(w);

              return (
                <button
                  key={w.id}
                  onClick={() => { if (isConnecting) return; onConnect(w.id); }}
                  disabled={disabled}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 w-full disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: isWC ? "rgba(0,245,160,0.04)" : detected ? "var(--surface2)" : "var(--surface)",
                    border: isWC ? "1px solid rgba(0,245,160,0.2)" : detected ? "1px solid var(--border2)" : "1px solid var(--border)",
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "var(--neon2)";
                      el.style.background = "var(--surface3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = isWC ? "rgba(0,245,160,0.2)" : detected ? "var(--border2)" : "var(--border)";
                    el.style.background = isWC ? "rgba(0,245,160,0.04)" : detected ? "var(--surface2)" : "var(--surface)";
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
                    style={{
                      background: isWC ? "rgba(0,245,160,0.1)" : "var(--surface)",
                      border: isWC ? "1px solid rgba(0,245,160,0.25)" : "1px solid var(--border)",
                    }}
                  >
                    {iconSrc ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={iconSrc} alt={w.name} width={24} height={24} style={{ borderRadius: "6px" }} />
                    ) : isWC ? (
                      <Smartphone size={18} style={{ color: "var(--neon)" }} />
                    ) : (
                      <span className="text-lg leading-none">{w.icon}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold" style={{ color: isWC ? "var(--neon)" : "var(--text)" }}>
                        {w.name}
                      </span>
                      {w.isMobile && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ fontFamily: "var(--font-mono)", color: "var(--neon)", background: "rgba(0,245,160,0.12)", fontSize: "0.6rem" }}
                        >
                          MOBILE
                        </span>
                      )}
                      {w.popular && !w.isMobile && detected && (
                        <span
                          className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{ fontFamily: "var(--font-mono)", color: "var(--neon)", background: "rgba(0,245,160,0.1)", fontSize: "0.6rem" }}
                        >
                          POPULAR
                        </span>
                      )}
                    </div>
                    <p className="text-xs truncate" style={{ color: "var(--muted)" }}>{w.desc}</p>
                  </div>

                  {isThisConnecting ? (
                    <Loader2 size={15} className="animate-spin flex-shrink-0" style={{ color: "var(--neon)" }} />
                  ) : isWC ? (
                    <ChevronRight size={14} className="flex-shrink-0" style={{ color: "var(--neon)" }} />
                  ) : detected ? (
                    <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: "var(--neon)", opacity: 0.7 }} />
                  ) : (
                    <ChevronRight size={14} className="flex-shrink-0" style={{ color: "var(--muted)" }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Not installed wallets */}
          {notInstalled.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-4">
              <p className="text-xs px-1 mb-1" style={{ color: "var(--muted)", fontFamily: "var(--font-mono)", fontSize: "0.6rem", letterSpacing: "0.08em" }}>
                INSTALL DULU
              </p>
              {notInstalled.map((w) => (
                <button
                  key={w.id}
                  onClick={() => { if (isConnecting) return; window.open(w.installUrl, "_blank", "noopener,noreferrer"); }}
                  disabled={isConnecting}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-left transition-all duration-200 w-full disabled:opacity-40 disabled:cursor-not-allowed opacity-60 hover:opacity-90"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                    <span className="text-base leading-none">{w.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium" style={{ color: "var(--text2)" }}>{w.name}</span>
                    <span
                      className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", background: "rgba(74,122,155,0.08)", fontSize: "0.55rem" }}
                    >
                      INSTALL
                    </span>
                  </div>
                  <ChevronRight size={12} className="flex-shrink-0" style={{ color: "var(--muted)" }} />
                </button>
              ))}
            </div>
          )}

          <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
            Butuh test ETH?{" "}
            <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer"
              style={{ color: "var(--neon2)", textDecoration: "underline" }}>
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
            MULTI-WALLET · EIP-6963 · WALLETCONNECT · SEPOLIA
          </span>
        </div>
      </div>
    </div>
  );
}
