"use client";
import Link from "next/link";
import { Zap, ExternalLink, Github, Twitter, ArrowRight } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();

  const links = {
    Protocol: [
      { label: "Governance", href: "/" },
      { label: "Proposals", href: "/explore" },
      { label: "Analytics", href: "/analytics" },
    ],
    Resources: [
      { label: "Documentation", href: "/docs" },
      { label: "Smart Contracts", href: "https://sepolia.etherscan.io" },
      { label: "SDK", href: "/docs" },
    ],
    Community: [
      { label: "Discord", href: "#" },
      { label: "Forum", href: "#" },
      { label: "Twitter", href: "#" },
    ],
  };

  return (
    <footer
      className="relative z-10 mt-20"
      style={{ borderTop: "1px solid var(--border)", background: "var(--surface)" }}
    >
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: "rgba(0,245,160,0.1)", border: "1px solid rgba(0,245,160,0.3)" }}
              >
                <Zap size={15} style={{ color: "var(--neon)" }} />
              </div>
              <span
                className="text-base font-bold tracking-widest"
                style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}
              >
                VOTE<span style={{ color: "var(--neon2)" }}>CHAIN</span>
              </span>
            </div>
            <p className="text-sm leading-relaxed mb-5" style={{ color: "var(--text2)", maxWidth: "280px" }}>
              Decentralized governance protocol built on Ethereum Sepolia. Trustless, transparent, and immutable.
            </p>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: "var(--neon)" }} />
              <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                LIVE ON SEPOLIA TESTNET
              </span>
            </div>
          </div>

          {Object.entries(links).map(([group, items]) => (
            <div key={group}>
              <h4
                className="text-xs tracking-widest mb-4 font-bold"
                style={{ fontFamily: "var(--font-mono)", color: "var(--neon2)" }}
              >
                {group.toUpperCase()}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm transition-colors duration-200 flex items-center gap-1 group"
                      style={{ color: "var(--text2)", textDecoration: "none" }}
                    >
                      <span className="group-hover:text-[var(--neon2)] transition-colors duration-200">
                        {item.label}
                      </span>
                      {item.href.startsWith("http") && (
                        <ExternalLink size={10} style={{ color: "var(--muted)" }} />
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-2 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            <span>&copy; {year} VoteChain. MIT License.</span>
          </div>

          <a
            href="https://rayn.web.id"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs tracking-widest group transition-all duration-200 px-4 py-2 rounded-lg"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--muted)",
              background: "var(--surface2)",
              border: "1px solid var(--border)",
              textDecoration: "none",
            }}
          >
            <span>Build by</span>
            <span className="font-bold" style={{ color: "var(--neon2)" }}>RAYN</span>
            <ArrowRight size={11} className="group-hover:translate-x-1 transition-transform duration-200" style={{ color: "var(--neon2)" }} />
            <span className="group-hover:text-[var(--neon2)] transition-colors duration-200">rayn.web.id</span>
          </a>

          <div className="flex items-center gap-2">
            {[{ icon: <Github size={13} />, href: "#" }, { icon: <Twitter size={13} />, href: "#" }].map((s, i) => (
              <a
                key={i}
                href={s.href}
                className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-200 hover:scale-110"
                style={{ color: "var(--muted)", background: "var(--surface2)", border: "1px solid var(--border)" }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
