"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Zap, Activity, Sun, Moon, Menu, X } from "lucide-react";
import { WalletState } from "@/types";
import { useTheme } from "@/components/ThemeProvider";

interface NavbarProps {
  wallet: WalletState;
  shortAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}

const NAV_LINKS = [
  { href: "/", label: "GOVERNANCE" },
  { href: "/explore", label: "EXPLORE" },
  { href: "/analytics", label: "ANALYTICS" },
  { href: "/docs", label: "DOCS" },
];

export default function Navbar({ wallet, shortAddress, onConnect, onDisconnect }: NavbarProps) {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 glass"
      style={{ borderBottom: "1px solid var(--border)" }}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 py-3.5">
        <Link href="/" className="flex items-center gap-2.5 group" style={{ textDecoration: "none" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110"
            style={{ background: "rgba(0,245,160,0.1)", border: "1px solid rgba(0,245,160,0.35)" }}
          >
            <Zap size={15} style={{ color: "var(--neon)" }} />
          </div>
          <span
            className="text-base font-bold tracking-widest"
            style={{ fontFamily: "var(--font-mono)", color: "var(--neon)", textShadow: "0 0 20px rgba(0,245,160,0.3)" }}
          >
            VOTE<span style={{ color: "var(--neon2)" }}>CHAIN</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-xs tracking-widest rounded-lg transition-all duration-200"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: isActive ? "var(--neon2)" : "var(--muted)",
                  background: isActive ? "rgba(0,212,255,0.08)" : "transparent",
                  textDecoration: "none",
                }}
              >
                {isActive && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: "var(--neon2)" }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden md:flex items-center gap-2">
            <Activity size={11} style={{ color: "var(--neon)" }} />
            <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              SEPOLIA
            </span>
            <div className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: "var(--neon)" }} />
          </div>

          <button
            onClick={toggle}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            aria-label="Toggle theme"
          >
            {theme === "dark"
              ? <Sun size={14} style={{ color: "var(--warn)" }} />
              : <Moon size={14} style={{ color: "var(--neon2)" }} />
            }
          </button>

          {wallet.connected && wallet.balance && (
            <span
              className="hidden md:block text-xs px-3 py-1.5 rounded-lg"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", background: "var(--surface2)", border: "1px solid var(--border)" }}
            >
              {wallet.balance} ETH
            </span>
          )}

          <button
            onClick={wallet.connected ? onDisconnect : onConnect}
            className="btn-connect flex items-center gap-2 px-4 py-2 rounded-lg text-xs tracking-widest font-bold"
            style={{ fontFamily: "var(--font-mono)" }}
          >
            <Wallet size={13} />
            <span className="hidden sm:inline">
              {wallet.connected ? shortAddress : "CONNECT WALLET"}
            </span>
          </button>

          <button
            className="flex md:hidden w-8 h-8 items-center justify-center rounded-lg"
            style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={14} style={{ color: "var(--text)" }} /> : <Menu size={14} style={{ color: "var(--text)" }} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden glass animate-slideDown" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="px-5 py-3 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-xs tracking-widest rounded-lg"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: pathname === link.href ? "var(--neon2)" : "var(--muted)",
                  background: pathname === link.href ? "rgba(0,212,255,0.08)" : "transparent",
                  textDecoration: "none",
                }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
