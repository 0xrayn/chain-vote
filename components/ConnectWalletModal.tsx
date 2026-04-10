"use client";
import { X, Wallet, Shield, Zap, ChevronRight } from "lucide-react";

interface ConnectWalletModalProps {
  onConnect: () => void;
  onClose: () => void;
}

const WALLETS = [
  { name: "MetaMask", desc: "Browser extension wallet", icon: "🦊", popular: true },
  { name: "WalletConnect", desc: "Scan with mobile wallet", icon: "📱", popular: false },
  { name: "Coinbase Wallet", desc: "Simple & secure", icon: "🔵", popular: false },
  { name: "Brave Wallet", desc: "Built into Brave Browser", icon: "🦁", popular: false },
];

export default function ConnectWalletModal({ onConnect, onClose }: ConnectWalletModalProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 modal-bg animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden animate-scaleIn"
        style={{ background: "var(--surface)", border: "1px solid var(--border2)" }}
      >
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
              <p className="text-xs" style={{ color: "var(--muted)" }}>Choose your wallet provider</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--muted)" }}
          >
            <X size={13} />
          </button>
        </div>

        <div className="p-4">
          <div
            className="flex items-start gap-3 px-4 py-3 rounded-xl mb-4"
            style={{ background: "rgba(0,245,160,0.04)", border: "1px solid rgba(0,245,160,0.12)" }}
          >
            <Shield size={13} style={{ color: "var(--neon)", marginTop: "2px", flexShrink: 0 }} />
            <p className="text-xs leading-relaxed" style={{ color: "var(--text2)" }}>
              Connecting to <span style={{ color: "var(--neon)" }}>Sepolia Testnet</span>. No real funds required. Always verify the URL before signing.
            </p>
          </div>

          <div className="flex flex-col gap-2 mb-4">
            {WALLETS.map((w) => (
              <button
                key={w.name}
                onClick={onConnect}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all duration-200 group w-full"
                style={{
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--neon2)";
                  (e.currentTarget as HTMLElement).style.background = "var(--surface3)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                  (e.currentTarget as HTMLElement).style.background = "var(--surface2)";
                }}
              >
                <span className="text-xl w-8 text-center">{w.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: "var(--text)" }}>{w.name}</span>
                    {w.popular && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-full"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--neon)", background: "rgba(0,245,160,0.1)", fontSize: "0.65rem" }}
                      >
                        POPULAR
                      </span>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>{w.desc}</p>
                </div>
                <ChevronRight size={14} style={{ color: "var(--muted)" }} />
              </button>
            ))}
          </div>

          <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
            By connecting, you agree to our{" "}
            <span style={{ color: "var(--neon2)", cursor: "pointer" }}>Terms of Service</span>
          </p>
        </div>

        <div
          className="px-6 py-3 flex items-center gap-2"
          style={{ borderTop: "1px solid var(--border)", background: "var(--surface2)" }}
        >
          <Zap size={11} style={{ color: "var(--neon)" }} />
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            DEMO MODE — SIMULATED CONNECTION
          </span>
        </div>
      </div>
    </div>
  );
}
