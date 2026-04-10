"use client";
import { Proposal } from "@/types";
import { Shield, TrendingUp, Users, Layers } from "lucide-react";

interface HeroProps {
  proposals: Proposal[];
}

export default function Hero({ proposals }: HeroProps) {
  const totalVotes = proposals.reduce((a, p) => a + p.total, 0);
  const activeCount = proposals.filter((p) => p.status === "active").length;
  const endedCount = proposals.filter((p) => p.status === "ended").length;

  const stats = [
    { num: proposals.length, label: "PROPOSALS", icon: <Layers size={14} />, color: "var(--neon2)" },
    { num: totalVotes.toLocaleString(), label: "TOTAL VOTES", icon: <Users size={14} />, color: "var(--neon)" },
    { num: activeCount, label: "ACTIVE", icon: <TrendingUp size={14} />, color: "var(--warn)" },
    { num: endedCount, label: "CONCLUDED", icon: <Shield size={14} />, color: "var(--muted)" },
  ];

  return (
    <section className="text-center px-4 sm:px-6 pt-12 sm:pt-20 pb-8 sm:pb-12 relative overflow-hidden">
      <div className="max-w-4xl mx-auto w-full">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 text-xs tracking-widest mb-5 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full animate-fadeInUp"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--neon)",
            background: "rgba(0,245,160,0.06)",
            border: "1px solid rgba(0,245,160,0.2)",
            fontSize: "0.6rem",
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full glow-pulse flex-shrink-0" style={{ background: "var(--neon)" }} />
          <span className="hidden sm:inline">Decentralized Governance Protocol · Sepolia Testnet</span>
          <span className="sm:hidden">Governance Protocol · Sepolia</span>
        </div>

        {/* Main heading - responsive and contained */}
        <h1
          className="font-extrabold leading-tight mb-4 sm:mb-5 animate-fadeInUp delay-100 w-full"
          style={{
            fontSize: "clamp(1.9rem, 9vw, 5.5rem)",
            lineHeight: 1.05,
            wordBreak: "break-word",
          }}
        >
          <span className="gradient-text block">On-Chain</span>
          <span style={{ color: "var(--text)" }}>Democracy</span>
        </h1>

        {/* Subtext */}
        <p
          className="mx-auto mb-10 sm:mb-12 leading-relaxed text-sm sm:text-base animate-fadeInUp delay-200 px-2"
          style={{ color: "var(--text2)", maxWidth: "480px" }}
        >
          Shape protocol governance through transparent, immutable proposals.
          Every vote is cryptographically verified on Ethereum Sepolia.
        </p>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-2xl mx-auto animate-fadeInUp delay-300">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-3 sm:p-4 text-center card-hover"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex justify-center mb-1.5 sm:mb-2" style={{ color: s.color }}>{s.icon}</div>
              <div
                className="text-xl sm:text-2xl font-bold mb-0.5 sm:mb-1"
                style={{ fontFamily: "var(--font-mono)", color: s.color }}
              >
                {s.num}
              </div>
              <div
                className="tracking-widest"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.55rem" }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
