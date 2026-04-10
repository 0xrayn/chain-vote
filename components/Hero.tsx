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
    <section className="text-center px-6 pt-20 pb-12 relative">
      <div className="max-w-4xl mx-auto">
        <div
          className="inline-flex items-center gap-2 text-xs tracking-widest mb-6 px-4 py-2 rounded-full animate-fadeInUp"
          style={{
            fontFamily: "var(--font-mono)",
            color: "var(--neon)",
            background: "rgba(0,245,160,0.06)",
            border: "1px solid rgba(0,245,160,0.2)",
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: "var(--neon)" }} />
          Decentralized Governance Protocol — Sepolia Testnet
        </div>

        <h1
          className="font-extrabold leading-none mb-5 animate-fadeInUp delay-100"
          style={{ fontSize: "clamp(2.8rem,7vw,5.5rem)" }}
        >
          <span className="gradient-text">On-Chain</span>
          <br />
          <span style={{ color: "var(--text)" }}>Democracy</span>
        </h1>

        <p
          className="mx-auto mb-12 leading-relaxed text-base animate-fadeInUp delay-200"
          style={{ color: "var(--text2)", maxWidth: "520px" }}
        >
          Shape protocol governance through transparent, immutable proposals.
          Every vote is cryptographically verified on Ethereum Sepolia.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto animate-fadeInUp delay-300">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl p-4 text-center card-hover"
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="flex justify-center mb-2" style={{ color: s.color }}>{s.icon}</div>
              <div
                className="text-2xl font-bold mb-1"
                style={{ fontFamily: "var(--font-mono)", color: s.color }}
              >
                {s.num}
              </div>
              <div
                className="text-xs tracking-widest"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
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
