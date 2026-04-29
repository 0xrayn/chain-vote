"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wallet, Zap, Activity, Sun, Moon, Menu, X, AlertTriangle, Loader2, User } from "lucide-react";
import { toast } from "sonner";
import { WalletState } from "@/types";
import { useTheme } from "@/components/ThemeProvider";

interface NavbarProps {
  wallet: WalletState;
  shortAddress: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
  isConnecting?: boolean;
  isWrongNetwork?: boolean;
  onSwitchNetwork?: () => void;
}

const NAV_LINKS = [
  { href: "/", label: "GOVERNANCE" },
  { href: "/explore", label: "EXPLORE" },
  { href: "/analytics", label: "ANALYTICS" },
  { href: "/docs", label: "DOCS" },
  { href: "/profile", label: "PROFILE" },
];

export default function Navbar({
  wallet,
  shortAddress,
  onConnect,
  onDisconnect,
  isConnecting = false,
  isWrongNetwork = false,
  onSwitchNetwork,
}: NavbarProps) {
  const { theme, toggle } = useTheme();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleWalletAction = () => {
    if (isConnecting) return;
    if (isWrongNetwork && onSwitchNetwork) {
      toast.info("Membuka permintaan ganti jaringan ke Sepolia di wallet kamu...", { duration: 4000 });
      onSwitchNetwork();
      return;
    }
    if (wallet.connected) {
      onDisconnect();
    } else {
      onConnect();
    }
  };

  const walletBtnLabel = isConnecting
    ? "CONNECTING..."
    : isWrongNetwork
    ? "WRONG NETWORK"
    : wallet.connected
    ? shortAddress ?? "CONNECTED"
    : "CONNECT WALLET";

  const walletBtnColor = isWrongNetwork
    ? "var(--warn)"
    : wallet.connected
    ? "var(--neon)"
    : "var(--neon)";

  return (
    <nav
      className="sticky top-0 z-50 glass"
      style={{
        borderBottom: "1px solid var(--border)",
        boxShadow: scrolled ? "0 4px 32px rgba(0,0,0,0.3)" : "none",
        transition: "box-shadow 0.3s ease",
      }}
    >
      <div className="max-w-7xl mx-auto grid items-center px-3 sm:px-5 py-3" style={{ gridTemplateColumns: "auto 1fr auto", gap: "0.5rem" }}>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0" style={{ textDecoration: "none" }}>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(0,245,160,0.1)",
              border: "1px solid rgba(0,245,160,0.35)",
              boxShadow: "0 0 12px rgba(0,245,160,0.15)",
              transition: "all 0.3s ease",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "scale(1.1) rotate(12deg)";
              el.style.boxShadow = "0 0 24px rgba(0,245,160,0.4)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "scale(1) rotate(0deg)";
              el.style.boxShadow = "0 0 12px rgba(0,245,160,0.15)";
            }}
          >
            <Zap size={15} style={{ color: "var(--neon)" }} />
          </div>
          <span
            className="text-base font-bold tracking-widest"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--neon)",
              textShadow: "0 0 20px rgba(0,245,160,0.3)",
            }}
          >
            VOTE<span style={{ color: "var(--neon2)" }}>CHAIN</span>
          </span>
        </Link>

        {/* Nav Links - centered */}
        <div
          className="hidden md:flex items-center justify-center gap-1"
        >
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 text-xs tracking-widest rounded-lg"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: isActive ? "var(--neon2)" : "var(--muted)",
                  background: isActive ? "rgba(0,212,255,0.08)" : "transparent",
                  textDecoration: "none",
                  transition: "color 0.2s ease, background 0.2s ease",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = "var(--text)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    (e.currentTarget as HTMLElement).style.color = "var(--muted)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }
                }}
              >
                {isActive && (
                  <span
                    className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                    style={{ background: "var(--neon2)", boxShadow: "0 0 8px var(--neon2)" }}
                  />
                )}
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 ml-auto">

          {/* Sepolia badge */}
          <div
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0"
            style={{
              background: isWrongNetwork ? "rgba(255,165,2,0.06)" : "rgba(0,245,160,0.06)",
              border: isWrongNetwork ? "1px solid rgba(255,165,2,0.3)" : "1px solid rgba(0,245,160,0.18)",
            }}
          >
            {isWrongNetwork ? (
              <AlertTriangle size={10} style={{ color: "var(--warn)" }} />
            ) : (
              <Activity size={10} style={{ color: "var(--neon)" }} />
            )}
            <span
              style={{
                fontFamily: "var(--font-mono)",
                color: isWrongNetwork ? "var(--warn)" : "var(--neon)",
                fontSize: "0.65rem",
                letterSpacing: "0.12em",
              }}
            >
              {isWrongNetwork ? "WRONG NET" : "SEPOLIA"}
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{
                background: isWrongNetwork ? "var(--warn)" : "var(--neon)",
                animation: isWrongNetwork ? "none" : "pulseGlow 2.5s ease-in-out infinite",
              }}
            />
          </div>

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="flex items-center justify-center rounded-lg"
            style={{
              width: "34px",
              height: "34px",
              flexShrink: 0,
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              transition: "all 0.3s cubic-bezier(0.34,1.56,0.64,1)",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "scale(1.1) rotate(20deg)";
              el.style.borderColor = theme === "dark" ? "var(--warn)" : "var(--neon2)";
              el.style.boxShadow = theme === "dark"
                ? "0 0 16px rgba(255,165,2,0.35)"
                : "0 0 16px rgba(0,212,255,0.35)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.transform = "scale(1) rotate(0deg)";
              el.style.borderColor = "var(--border)";
              el.style.boxShadow = "none";
            }}
          >
            {theme === "dark"
              ? <Sun size={14} style={{ color: "var(--warn)" }} />
              : <Moon size={14} style={{ color: "var(--neon2)" }} />
            }
          </button>

          {/* Balance */}
          {wallet.connected && wallet.balance && !isWrongNetwork && (
            <span
              className="hidden md:block text-xs px-3 py-1.5 rounded-lg flex-shrink-0"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--neon)",
                background: "rgba(0,245,160,0.06)",
                border: "1px solid rgba(0,245,160,0.18)",
              }}
            >
              {wallet.balance} ETH
            </span>
          )}

          {/* Connect / Disconnect button */}
          <button
            onClick={handleWalletAction}
            disabled={isConnecting}
            className="btn-connect flex items-center gap-2 px-4 py-2 rounded-lg text-xs tracking-widest font-bold flex-shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              fontFamily: "var(--font-mono)",
              color: walletBtnColor,
              borderColor: isWrongNetwork ? "rgba(255,165,2,0.5)" : undefined,
              background: isWrongNetwork ? "rgba(255,165,2,0.08)" : undefined,
            }}
          >
            {isConnecting ? (
              <Loader2 size={13} className="animate-spin" />
            ) : isWrongNetwork ? (
              <AlertTriangle size={13} />
            ) : (
              <Wallet size={13} />
            )}
            <span className="hidden sm:inline">{walletBtnLabel}</span>
          </button>

          {/* Mobile hamburger */}
          <button
            className="flex md:hidden items-center justify-center rounded-lg"
            style={{
              width: "34px",
              height: "34px",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle mobile menu"
          >
            <span style={{ display: "flex", transition: "transform 0.3s ease", transform: mobileOpen ? "rotate(90deg)" : "rotate(0)" }}>
              {mobileOpen
                ? <X size={14} style={{ color: "var(--text)" }} />
                : <Menu size={14} style={{ color: "var(--text)" }} />}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden glass animate-slideDown" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="px-5 py-3 flex flex-col gap-1">
            <div className="flex items-center gap-2 px-3 py-2 mb-1" style={{ borderBottom: "1px solid var(--border)" }}>
              <Activity size={10} style={{ color: isWrongNetwork ? "var(--warn)" : "var(--neon)" }} />
              <span style={{ fontFamily: "var(--font-mono)", color: isWrongNetwork ? "var(--warn)" : "var(--neon)", fontSize: "0.65rem", letterSpacing: "0.1em" }}>
                {isWrongNetwork ? "WRONG NETWORK" : "SEPOLIA TESTNET"}
              </span>
              {wallet.balance && !isWrongNetwork && (
                <span className="ml-auto text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}>
                  {wallet.balance} ETH
                </span>
              )}
            </div>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2.5 text-xs tracking-widest rounded-lg"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: pathname === link.href ? "var(--neon2)" : "var(--muted)",
                  background: pathname === link.href ? "rgba(0,212,255,0.08)" : "transparent",
                  textDecoration: "none",
                  borderLeft: pathname === link.href ? "2px solid var(--neon2)" : "2px solid transparent",
                  transition: "all 0.15s ease",
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
