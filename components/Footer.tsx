"use client";
import Link from "next/link";
import { Activity, Zap } from "lucide-react";

const LINKS = [
  { href: "/",            label: "Proposals" },
  { href: "/results",     label: "Results" },
  { href: "/leaderboard", label: "Stats" },
  { href: "/create",      label: "Create" },
  { href: "/docs",        label: "Docs" },
];

export default function Footer() {
  return (
    <footer
      className="mt-20 border-t"
      style={{ borderColor: "var(--border)", background: "rgba(7,13,20,0.55)" }}
    >
      <div className="max-w-6xl mx-auto px-5 py-12">
        <div className="flex flex-wrap gap-10 justify-between mb-10">
          <div style={{ maxWidth: 260 }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0,245,160,0.12)", border: "1px solid rgba(0,245,160,0.3)" }}
              >
                <Zap size={15} style={{ color: "var(--neon)" }} />
              </div>
              <span
                className="text-lg font-extrabold tracking-widest"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                <span style={{ color: "var(--neon)" }}>VOTE</span>
                <span style={{ color: "var(--neon2)" }}>CHAIN</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              Decentralized governance protocol on Ethereum Sepolia testnet. Transparent, immutable, trustless.
            </p>
          </div>

          <div className="flex gap-14 flex-wrap">
            <div>
              <p
                className="text-xs tracking-widest mb-4"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
              >
                NAVIGATE
              </p>
              {LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block mb-2 text-sm no-underline transition-colors duration-200"
                  style={{ color: "var(--muted)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
                >
                  {l.label}
                </Link>
              ))}
            </div>

            <div>
              <p
                className="text-xs tracking-widest mb-4"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
              >
                NETWORK
              </p>
              <p className="text-sm mb-1.5" style={{ color: "var(--muted)" }}>Ethereum Sepolia</p>
              <p className="text-sm mb-1.5" style={{ color: "var(--muted)" }}>Chain ID: 11155111</p>
              <div className="flex items-center gap-2 mt-3">
                <Activity size={12} style={{ color: "var(--neon)" }} />
                <span
                  className="text-xs tracking-widest"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}
                >
                  LIVE
                </span>
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse-glow"
                  style={{ background: "var(--neon)" }}
                />
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex flex-wrap items-center justify-between gap-4 pt-6"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p
            className="text-xs"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            © 2025 VoteChain Protocol. All rights reserved.
          </p>

          <a
            href="https://rayn.web.id"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs no-underline transition-opacity duration-200"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--neon2)",
              letterSpacing: "0.06em",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.65")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            Built by Rayn →
          </a>
        </div>
      </div>
    </footer>
  );
}
