"use client";
import { useState } from "react";
import { Clock, User, CheckCircle } from "lucide-react";
import { Proposal, VoteChoice } from "@/types";
import { cn } from "@/lib/utils";

interface ProposalCardProps {
  proposal: Proposal;
  myVote?: VoteChoice;
  onVote: (id: string, choice: VoteChoice) => void;
  connected: boolean;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  active: { color: "var(--neon)", bg: "rgba(0,245,160,0.08)", border: "rgba(0,245,160,0.25)" },
  ended: { color: "var(--muted)", bg: "rgba(74,122,155,0.08)", border: "rgba(74,122,155,0.25)" },
  pending: { color: "var(--warn)", bg: "rgba(255,165,2,0.08)", border: "rgba(255,165,2,0.25)" },
};

function pct(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

export default function ProposalCard({
  proposal: p,
  myVote,
  onVote,
  connected,
}: ProposalCardProps) {
  const [hovered, setHovered] = useState(false);
  const st = STATUS_STYLES[p.status];
  const yp = pct(p.yes, p.total);
  const np = pct(p.no, p.total);
  const ap = pct(p.abstain, p.total);

  const voteOptions: { key: VoteChoice; label: string; pct: number; count: number; color: string }[] = [
    { key: "yes", label: "✓ FOR", pct: yp, count: p.yes, color: "var(--neon)" },
    { key: "no", label: "✗ AGAINST", pct: np, count: p.no, color: "var(--danger)" },
    { key: "abstain", label: "– ABSTAIN", pct: ap, count: p.abstain, color: "var(--muted)" },
  ];

  return (
    <div
      className="relative rounded-xl p-6 overflow-hidden transition-all duration-300 cursor-default"
      style={{
        background: "var(--surface)",
        border: `1px solid ${hovered ? "var(--neon2)" : "var(--border)"}`,
        boxShadow: hovered ? "0 0 30px rgba(0,212,255,0.08)" : "none",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Top glow line */}
      <div
        className="absolute top-0 left-0 right-0 h-[1px] transition-opacity duration-300"
        style={{
          background: "linear-gradient(90deg,transparent,var(--neon2),transparent)",
          opacity: hovered ? 1 : 0,
        }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <span
          className="text-xs tracking-widest"
          style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
        >
          {p.id}
        </span>
        <span
          className="text-xs px-2 py-1 rounded tracking-widest shrink-0"
          style={{
            fontFamily: "var(--font-mono)",
            color: st.color,
            background: st.bg,
            border: `1px solid ${st.border}`,
          }}
        >
          {p.status.toUpperCase()}
        </span>
      </div>

      <h3 className="font-bold text-base leading-snug mb-2" style={{ color: "var(--text)" }}>
        {p.title}
      </h3>
      <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--muted)" }}>
        {p.description}
      </p>

      {/* Vote Options */}
      <div className="flex flex-col gap-2 mb-4">
        {voteOptions.map((opt) => {
          const isSelected = myVote === opt.key;
          return (
            <div
              key={opt.key}
              className={cn(
                "relative rounded-md overflow-hidden transition-all duration-200",
                p.status === "active" && !myVote ? "cursor-pointer" : "cursor-default"
              )}
              onClick={() => p.status === "active" && !myVote && onVote(p.id, opt.key)}
            >
              {/* Fill bar */}
              <div
                className="absolute inset-0 rounded-md transition-all duration-700"
                style={{
                  width: `${opt.pct}%`,
                  background: `${opt.color}18`,
                  borderRadius: "6px",
                }}
              />
              {/* Content */}
              <div
                className="relative flex items-center justify-between px-3 py-2.5 rounded-md transition-all duration-200"
                style={{
                  border: `1px solid ${isSelected ? opt.color : "var(--border)"}`,
                  background: isSelected ? `${opt.color}08` : "transparent",
                }}
              >
                <span
                  className="text-xs tracking-widest"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}
                >
                  {opt.label}
                </span>
                <div className="flex items-center gap-3">
                  <span
                    className="text-xs"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
                  >
                    {opt.count.toLocaleString()}
                  </span>
                  <span
                    className="text-xs w-9 text-right"
                    style={{ fontFamily: "var(--font-mono)", color: opt.color }}
                  >
                    {opt.pct}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Clock size={11} style={{ color: "var(--muted)" }} />
            <span
              className="text-xs tracking-wider"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
            >
              {p.ends}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <User size={11} style={{ color: "var(--muted)" }} />
            <span
              className="text-xs tracking-wider"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
            >
              {p.creator}
            </span>
          </div>
        </div>

        {myVote ? (
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "var(--neon)", boxShadow: "0 0 6px var(--neon)" }}
            />
            <span
              className="text-xs tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}
            >
              VOTED {myVote.toUpperCase()}
            </span>
          </div>
        ) : p.status === "active" ? (
          <button
            className="flex items-center gap-2 text-xs px-4 py-2 rounded tracking-widest transition-all duration-200 hover:opacity-80"
            style={{
              fontFamily: "var(--font-mono)",
              color: "var(--neon)",
              border: "1px solid rgba(0,245,160,0.35)",
              background: "rgba(0,245,160,0.05)",
            }}
            onClick={() => !myVote && connected && onVote(p.id, "yes")}
          >
            <CheckCircle size={12} />
            VOTE
          </button>
        ) : (
          <span
            className="text-xs tracking-widest"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            {p.status === "pending" ? "NOT STARTED" : "CLOSED"}
          </span>
        )}
      </div>
    </div>
  );
}
