"use client";
import { Proposal } from "@/types";

interface HeroProps {
  proposals: Proposal[];
}

export default function Hero({ proposals }: HeroProps) {
  const totalVotes = proposals.reduce((a, p) => a + p.total, 0);
  const activeCount = proposals.filter((p) => p.status === "active").length;

  const stats = [
    { num: proposals.length, label: "PROPOSALS" },
    { num: totalVotes.toLocaleString(), label: "TOTAL VOTES" },
    { num: activeCount, label: "ACTIVE NOW" },
  ];

  return (
    <section className="text-center px-6 pt-16 pb-8">
      <div
        className="inline-block text-xs tracking-widest mb-4 px-3 py-1.5 rounded"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--neon)",
          background: "rgba(0,245,160,0.06)",
          border: "1px solid rgba(0,245,160,0.2)",
        }}
      >
        // Decentralized Governance Protocol
      </div>

      <h1
        className="font-extrabold leading-tight mb-4"
        style={{
          fontSize: "clamp(2.4rem,6vw,4.5rem)",
          background: "linear-gradient(135deg, var(--text) 35%, var(--neon2))",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        On-Chain
        <br />
        Democracy
      </h1>

      <p
        className="mx-auto mb-10 leading-relaxed text-base"
        style={{ color: "var(--muted)", maxWidth: "480px" }}
      >
        Create proposals, cast votes, shape the future. Fully transparent,
        immutable, and trustless on Ethereum Sepolia.
      </p>

      <div className="flex justify-center gap-10 flex-wrap">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}
            >
              {s.num}
            </div>
            <div
              className="text-xs tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
