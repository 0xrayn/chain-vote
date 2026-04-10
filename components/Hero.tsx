"use client";
import { useEffect, useRef, useState } from "react";
import { Proposal } from "@/types";

interface HeroProps { proposals: Proposal[]; }

function CountUp({ end, duration = 900 }: { end: number; duration?: number }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(end / (duration / 16));
    const id = setInterval(() => {
      start += step;
      if (start >= end) { setVal(end); clearInterval(id); }
      else setVal(start);
    }, 16);
    return () => clearInterval(id);
  }, [end, duration]);
  return <>{val.toLocaleString()}</>;
}

export default function Hero({ proposals }: HeroProps) {
  const totalVotes = proposals.reduce((a, p) => a + p.total, 0);
  const activeCount = proposals.filter((p) => p.status === "active").length;

  const stats = [
    { num: proposals.length, label: "PROPOSALS" },
    { num: totalVotes, label: "TOTAL VOTES" },
    { num: activeCount, label: "ACTIVE NOW" },
  ];

  return (
    <section className="text-center px-6 pt-16 pb-10 animate-fade-in-up">
      <div
        className="inline-block text-xs tracking-widest mb-5 px-4 py-1.5 rounded-full"
        style={{
          fontFamily: "var(--font-mono)",
          color: "var(--neon)",
          background: "rgba(0,245,160,0.08)",
          border: "1px solid rgba(0,245,160,0.22)",
        }}
      >
        Decentralized Governance Protocol
      </div>

      <h1
        className="font-extrabold leading-tight mb-5"
        style={{
          fontSize: "clamp(2.4rem, 6vw, 4.5rem)",
          background:
            "linear-gradient(135deg, var(--text) 30%, var(--neon2))",
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
        className="mx-auto mb-12 leading-relaxed text-base"
        style={{ color: "var(--muted)", maxWidth: "460px" }}
      >
        Create proposals, cast votes, shape the future. Fully transparent,
        immutable, and trustless on Ethereum Sepolia.
      </p>

      <div className="flex justify-center gap-12 flex-wrap">
        {stats.map((s) => (
          <div key={s.label} className="text-center">
            <div
              className="text-3xl font-bold mb-1"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}
            >
              <CountUp end={s.num} />
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
