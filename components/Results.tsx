"use client";
import { Proposal } from "@/types";
import { Trophy, Users } from "lucide-react";

function pct(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

const STATUS_COLOR: Record<string, string> = {
  active: "var(--neon)",
  ended: "var(--muted)",
  pending: "var(--warn)",
};

interface ResultsProps {
  proposals: Proposal[];
}

export default function Results({ proposals }: ResultsProps) {
  return (
    <div className="flex flex-col gap-4">
      {proposals.map((p) => {
        const yp = pct(p.yes, p.total);
        const np = pct(p.no, p.total);
        const ap = pct(p.abstain, p.total);
        const winner =
          p.total > 0 ? (p.yes > p.no ? "FOR WINS" : "AGAINST WINS") : null;

        const bars = [
          { label: "FOR", pct: yp, count: p.yes, color: "var(--neon)" },
          { label: "AGAINST", pct: np, count: p.no, color: "var(--danger)" },
          { label: "ABSTAIN", pct: ap, count: p.abstain, color: "var(--muted)" },
        ];

        return (
          <div
            key={p.id}
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span
                className="text-xs tracking-widest"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
              >
                {p.id}
              </span>
              <span
                className="text-xs px-2 py-1 rounded tracking-widest"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: STATUS_COLOR[p.status],
                  background: `${STATUS_COLOR[p.status]}12`,
                  border: `1px solid ${STATUS_COLOR[p.status]}30`,
                }}
              >
                {p.status.toUpperCase()}
              </span>
            </div>

            <h3 className="font-bold text-base mb-1" style={{ color: "var(--text)" }}>
              {p.title}
            </h3>

            <div
              className="flex items-center gap-2 mb-4"
              style={{ color: "var(--muted)" }}
            >
              <Users size={12} />
              <span
                className="text-xs tracking-widest"
                style={{ fontFamily: "var(--font-mono)" }}
              >
                {p.total.toLocaleString()} VOTES CAST
              </span>
            </div>

            <div className="flex flex-col gap-2.5 mb-4">
              {bars.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span
                    className="text-xs w-16 tracking-widest"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
                  >
                    {b.label}
                  </span>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ background: "var(--surface2)" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${b.pct}%`, background: b.color }}
                    />
                  </div>
                  <span
                    className="text-xs w-10 text-right"
                    style={{ fontFamily: "var(--font-mono)", color: b.color }}
                  >
                    {b.pct}%
                  </span>
                  <span
                    className="text-xs w-14 text-right"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
                  >
                    {b.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {winner && (
              <div
                className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded tracking-widest"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--neon)",
                  background: "rgba(0,245,160,0.08)",
                  border: "1px solid rgba(0,245,160,0.25)",
                }}
              >
                <Trophy size={11} />
                RESULT: {winner}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
