"use client";
import { useState } from "react";
import { Clock, User, CheckCircle, Lock } from "lucide-react";
import { Proposal, VoteChoice } from "@/types";

interface ProposalCardProps {
  proposal: Proposal;
  myVote?: VoteChoice;
  onVote: (id: string, choice: VoteChoice) => void;
  connected: boolean;
}

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active: { color: "var(--neon)", bg: "rgba(0,245,160,0.07)", border: "rgba(0,245,160,0.25)", label: "LIVE" },
  ended: { color: "var(--muted)", bg: "rgba(74,122,155,0.07)", border: "rgba(74,122,155,0.2)", label: "ENDED" },
  pending: { color: "var(--warn)", bg: "rgba(255,165,2,0.07)", border: "rgba(255,165,2,0.25)", label: "PENDING" },
};

function pct(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

export default function ProposalCard({ proposal: p, myVote, onVote, connected }: ProposalCardProps) {
  const [hoveredVote, setHoveredVote] = useState<VoteChoice | null>(null);
  const st = STATUS_CFG[p.status];
  const yp = pct(p.yes, p.total);
  const np = pct(p.no, p.total);
  const ap = pct(p.abstain, p.total);
  const canVote = p.status === "active" && !myVote && connected;

  const voteOpts: { key: VoteChoice; label: string; pct: number; count: number; color: string }[] = [
    { key: "yes", label: "FOR", pct: yp, count: p.yes, color: "var(--neon)" },
    { key: "no", label: "AGAINST", pct: np, count: p.no, color: "var(--danger)" },
    { key: "abstain", label: "ABSTAIN", pct: ap, count: p.abstain, color: "var(--muted)" },
  ];

  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col gap-0 card-hover overflow-hidden"
      style={{ background: "var(--surface)", border: "1px solid var(--border)", minHeight: "320px" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px opacity-0 transition-opacity duration-300"
        style={{ background: "linear-gradient(90deg,transparent,var(--neon2),transparent)" }}
      />

      <div className="flex items-start justify-between gap-3 mb-4">
        <span
          className="text-xs tracking-widest"
          style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
        >
          {p.id}
        </span>
        <span
          className="text-xs px-2.5 py-1 rounded-full tracking-widest font-bold"
          style={{
            fontFamily: "var(--font-mono)",
            color: st.color,
            background: st.bg,
            border: `1px solid ${st.border}`,
          }}
        >
          {st.label}
        </span>
      </div>

      <h3 className="font-bold text-base leading-snug mb-2" style={{ color: "var(--text)" }}>
        {p.title}
      </h3>
      <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--text2)", fontSize: "0.82rem" }}>
        {p.description}
      </p>

      <div className="flex flex-col gap-2 mb-5">
        {voteOpts.map((opt) => {
          const isSelected = myVote === opt.key;
          const isHovered = hoveredVote === opt.key;
          return (
            <div
              key={opt.key}
              className="relative rounded-lg overflow-hidden"
              style={{ cursor: canVote ? "pointer" : "default" }}
              onClick={() => canVote && onVote(p.id, opt.key)}
              onMouseEnter={() => canVote && setHoveredVote(opt.key)}
              onMouseLeave={() => setHoveredVote(null)}
            >
              <div
                className="absolute inset-0 rounded-lg transition-all duration-700"
                style={{ width: `${opt.pct}%`, background: `${opt.color}14` }}
              />
              <div
                className="relative flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200"
                style={{
                  border: `1px solid ${isSelected ? opt.color : isHovered ? `${opt.color}60` : "var(--border)"}`,
                  background: isSelected ? `${opt.color}08` : isHovered ? `${opt.color}05` : "transparent",
                }}
              >
                <div className="flex items-center gap-2">
                  {isSelected && (
                    <CheckCircle size={11} style={{ color: opt.color }} />
                  )}
                  <span
                    className="text-xs tracking-widest"
                    style={{ fontFamily: "var(--font-mono)", color: isSelected ? opt.color : "var(--text2)" }}
                  >
                    {opt.label}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                    {opt.count.toLocaleString()}
                  </span>
                  <span
                    className="text-xs w-9 text-right font-bold"
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

      <div
        className="flex items-center justify-between pt-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Clock size={10} style={{ color: "var(--muted)" }} />
            <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              {p.ends}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <User size={10} style={{ color: "var(--muted)" }} />
            <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              {p.creator}
            </span>
          </div>
        </div>

        {myVote ? (
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{ background: "rgba(0,245,160,0.07)", border: "1px solid rgba(0,245,160,0.2)" }}
          >
            <div className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: "var(--neon)" }} />
            <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}>
              VOTED {myVote.toUpperCase()}
            </span>
          </div>
        ) : p.status === "active" && !connected ? (
          <div className="flex items-center gap-1.5">
            <Lock size={10} style={{ color: "var(--muted)" }} />
            <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              CONNECT TO VOTE
            </span>
          </div>
        ) : p.status !== "active" ? (
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {p.status === "pending" ? "NOT STARTED" : "CLOSED"}
          </span>
        ) : null}
      </div>
    </div>
  );
}
