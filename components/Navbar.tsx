"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Activity, Zap, Sun, Moon, Menu, X } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Proposals" },
  { href: "/results", label: "Results" },
  { href: "/leaderboard", label: "Stats" },
  { href: "/create", label: "Create" },
  { href: "/docs", label: "Docs" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        borderColor: "var(--border)",
        backdropFilter: "blur(18px)",
        background: theme === "dark"
          ? "rgba(7,13,20,0.88)"
          : "rgba(240,246,255,0.92)",
      }}
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between px-5 h-[60px]">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: "rgba(0,245,160,0.12)",
              border: "1px solid rgba(0,245,160,0.3)",
            }}
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
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 no-underline",
                )}
                style={{
                  background: active ? "rgba(0,212,255,0.14)" : "transparent",
                  border: active
                    ? "1px solid rgba(0,212,255,0.45)"
                    : "1px solid transparent",
                  color: active ? "var(--neon2)" : "var(--muted)",
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--text)";
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.color = "var(--muted)";
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <div
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{
              background: "rgba(0,245,160,0.08)",
              border: "1px solid rgba(0,245,160,0.22)",
            }}
          >
            <Activity size={11} style={{ color: "var(--neon)" }} />
            <span
              className="text-xs tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}
            >
              SEPOLIA
            </span>
            <div
              className="w-1.5 h-1.5 rounded-full animate-pulse-glow"
              style={{ background: "var(--neon)" }}
            />
          </div>

          <button
            onClick={toggle}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200"
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
          >
            {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <button
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
            style={{
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              color: "var(--muted)",
            }}
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div
          className="md:hidden px-4 pb-4 animate-fade-in"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block py-3 px-3 rounded-lg my-1 text-sm font-semibold no-underline transition-all duration-200"
                style={{
                  color: active ? "var(--neon2)" : "var(--muted)",
                  background: active ? "rgba(0,212,255,0.1)" : "transparent",
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
