"use client";
import { Wallet, Zap, Activity } from "lucide-react";
import { WalletState } from "@/types";
import { cn } from "@/lib/utils";

interface NavbarProps {
  wallet: WalletState;
  shortAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

export default function Navbar({
  wallet,
  shortAddress,
  onConnect,
  onDisconnect,
}: NavbarProps) {
  return (
    <nav
      className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
      style={{
        borderColor: "var(--border)",
        backdropFilter: "blur(16px)",
        background: "rgba(5,10,15,0.75)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded flex items-center justify-center"
          style={{ background: "rgba(0,245,160,0.1)", border: "1px solid rgba(0,245,160,0.3)" }}
        >
          <Zap size={16} style={{ color: "var(--neon)" }} />
        </div>
        <span
          className="text-lg font-bold tracking-widest"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--neon)",
            textShadow: "0 0 20px rgba(0,245,160,0.35)",
          }}
        >
          VOTE<span style={{ color: "var(--neon2)" }}>CHAIN</span>
        </span>
      </div>

      {/* Center badge */}
      <div className="hidden md:flex items-center gap-2">
        <Activity size={12} style={{ color: "var(--neon)" }} />
        <span
          className="text-xs tracking-widest"
          style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
        >
          SEPOLIA TESTNET
        </span>
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ background: "var(--neon)", boxShadow: "0 0 6px var(--neon)" }}
        />
      </div>

      {/* Wallet */}
      <div className="flex items-center gap-3">
        {wallet.connected && wallet.balance && (
          <span
            className="hidden md:block text-xs px-3 py-1.5 rounded"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              background: "var(--surface)",
              border: "1px solid var(--border)",
            }}
          >
            {wallet.balance} ETH
          </span>
        )}
        <button
          onClick={wallet.connected ? onDisconnect : onConnect}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded text-xs tracking-widest transition-all duration-200",
            wallet.connected
              ? "hover:opacity-80"
              : "hover:shadow-lg"
          )}
          style={{
            fontFamily: "var(--font-mono)",
            border: wallet.connected
              ? "1px solid rgba(0,245,160,0.4)"
              : "1px solid rgba(0,212,255,0.4)",
            color: wallet.connected ? "var(--neon)" : "var(--neon2)",
            background: wallet.connected
              ? "rgba(0,245,160,0.05)"
              : "rgba(0,212,255,0.05)",
            boxShadow: wallet.connected
              ? "none"
              : "0 0 20px rgba(0,212,255,0.12)",
          }}
        >
          <Wallet size={13} />
          {wallet.connected ? shortAddress : "CONNECT WALLET"}
        </button>
      </div>
    </nav>
  );
}
