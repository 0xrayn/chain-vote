"use client";
import { useState } from "react";
import { Proposal } from "@/types";
import { Trophy, Users, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";

function pct(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

const STATUS_COLOR: Record<string, string> = {
  active: "var(--neon)",
  ended: "var(--muted)",
  pending: "var(--warn)",
};

const PER_PAGE = 5;

interface ResultsProps {
  proposals: Proposal[];
}

function PaginationBar({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-1.5 mt-6">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex items-center justify-center rounded-lg transition-all"
        style={{
          width: 32, height: 32,
          background: "var(--surface2)", border: "1px solid var(--border)",
          color: page === 1 ? "var(--border2)" : "var(--text2)",
          cursor: page === 1 ? "default" : "pointer",
          opacity: page === 1 ? 0.4 : 1,
        }}
      >
        <ChevronLeft size={13} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className="flex items-center justify-center rounded-lg font-bold transition-all"
          style={{
            width: 32, height: 32,
            fontFamily: "var(--font-mono)", fontSize: "11px",
            background: n === page ? "var(--neon)" : "var(--surface2)",
            border: `1px solid ${n === page ? "var(--neon)" : "var(--border)"}`,
            color: n === page ? "var(--bg)" : "var(--muted)",
            cursor: "pointer",
          }}
        >
          {n}
        </button>
      ))}

      <button
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex items-center justify-center rounded-lg transition-all"
        style={{
          width: 32, height: 32,
          background: "var(--surface2)", border: "1px solid var(--border)",
          color: page === totalPages ? "var(--border2)" : "var(--text2)",
          cursor: page === totalPages ? "default" : "pointer",
          opacity: page === totalPages ? 0.4 : 1,
        }}
      >
        <ChevronRight size={13} />
      </button>
    </div>
  );
}

export default function Results({ proposals }: ResultsProps) {
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(proposals.length / PER_PAGE);
  const paginated = proposals.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const handleChange = (p: number) => {
    setPage(p);
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  return (
    <div>
      {proposals.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {proposals.length} TOTAL
          </span>
          <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            PAGE {page} / {totalPages}
          </span>
        </div>
      )}
      <div className="flex flex-col gap-5">
      {paginated.map((p) => {
        const yp = pct(p.yes, p.total);
        const np = pct(p.no, p.total);
        const ap = pct(p.abstain, p.total);
        const winner = p.total > 0 ? (p.yes > p.no ? "FOR WINS" : "AGAINST WINS") : null;

        const bars = [
          { label: "FOR", pct: yp, count: p.yes, color: "var(--neon)" },
          { label: "AGAINST", pct: np, count: p.no, color: "var(--danger)" },
          { label: "ABSTAIN", pct: ap, count: p.abstain, color: "var(--muted)" },
        ];

        return (
          <div
            key={p.id}
            className="rounded-2xl p-6 card-hover"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                {p.id}
              </span>
              <span
                className="text-xs px-2.5 py-1 rounded-full tracking-widest font-bold"
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

            <h3 className="font-bold text-base mb-2" style={{ color: "var(--text)" }}>{p.title}</h3>

            <div className="flex items-center gap-2 mb-5">
              <Users size={11} style={{ color: "var(--muted)" }} />
              <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                {p.total.toLocaleString()} VOTES CAST
              </span>
              {p.total >= p.quorum && (
                <>
                  <TrendingUp size={11} style={{ color: "var(--neon)" }} />
                  <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}>QUORUM MET</span>
                </>
              )}
            </div>

            <div className="flex flex-col gap-3 mb-5">
              {bars.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <span className="text-xs w-14 tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                    {b.label}
                  </span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${b.pct}%`, background: b.color, boxShadow: `0 0 6px ${b.color}60` }}
                    />
                  </div>
                  <span className="text-xs w-10 text-right font-bold" style={{ fontFamily: "var(--font-mono)", color: b.color }}>
                    {b.pct}%
                  </span>
                  <span className="text-xs w-14 text-right" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                    {b.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>

            {winner && (
              <div
                className="inline-flex items-center gap-2 text-xs px-3 py-2 rounded-xl tracking-widest"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--neon)",
                  background: "rgba(0,245,160,0.07)",
                  border: "1px solid rgba(0,245,160,0.2)",
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
      <PaginationBar page={page} totalPages={totalPages} onChange={handleChange} />
    </div>
  );
}
