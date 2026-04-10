"use client";
import { useState, useEffect } from "react";
import { Clock, User, CheckCircle, ChevronDown } from "lucide-react";
import { Proposal, VoteChoice } from "@/types";
import { cn } from "@/lib/utils";

interface ProposalCardProps {
  proposal: Proposal;
  myVote?: VoteChoice;
  onVote: (id: string, choice: VoteChoice) => void;
}

const STATUS_STYLES: Record<string, { color: string; bg: string; border: string }> = {
  active:  { color: "var(--neon)",    bg: "rgba(0,245,160,0.08)",  border: "rgba(0,245,160,0.25)" },
  ended:   { color: "var(--muted)",   bg: "rgba(74,127,160,0.08)", border: "rgba(74,127,160,0.25)" },
  pending: { color: "var(--warn)",    bg: "rgba(255,165,2,0.08)",  border: "rgba(255,165,2,0.25)" },
};

function pct(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

function AnimatedBar({ value, color }: { value: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setWidth(value), 80);
    return () => clearTimeout(id);
  }, [value]);
  return (
    <div
      className="flex-1 h-1.5 rounded-full overflow-hidden"
      style={{ background: "var(--surface2)" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          background: color,
          transition: "width 0.9s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

export default function ProposalCard({ proposal: p, myVote, onVote }: ProposalCardProps) {
  const [hovered, setHovered] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const st = STATUS_STYLES[p.status];

  const voteOptions: { key: VoteChoice; label: string; pct: number; count: number; color: string }[] = [
    { key: "yes",     label: "FOR",     pct: pct(p.yes, p.total),     count: p.yes,     color: "var(--neon)" },
    { key: "no",      label: "AGAINST", pct: pct(p.no, p.total),      count: p.no,      color: "var(--danger)" },
    { key: "abstain", label: "ABSTAIN", pct: pct(p.abstain, p.total), count: p.abstain, color: "var(--muted)" },
  ];

  const quorumPct = Math.min(100, pct(p.total, p.quorum));

  return (
    <div
      className="relative rounded-2xl overflow-hidden transition-all duration-300"
      style={{
        background: "var(--card)",
        border: `1px solid ${hovered ? "rgba(0,212,255,0.5)" : "var(--border)"}`,
        boxShadow: hovered ? "0 8px 32px rgba(0,212,255,0.08)" : "none",
        transform: hovered ? "translateY(-3px)" : "translateY(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px transition-opacity duration-300"
        style={{
          background: "linear-gradient(90deg, transparent, var(--neon2), transparent)",
          opacity: hovered ? 1 : 0,
        }}
      />

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <span
            className="text-xs tracking-widest"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            {p.id}
          </span>
          <span
            className="text-xs px-2 py-1 rounded-md tracking-widest shrink-0"
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

        <button
          className="flex items-center gap-1 mb-3 transition-all duration-200"
          style={{ color: "var(--muted)", fontSize: 12, fontFamily: "var(--font-mono)" }}
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Hide" : "Details"}
          <ChevronDown
            size={12}
            style={{
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s",
            }}
          />
        </button>

        {expanded && (
          <p
            className="text-sm leading-relaxed mb-4 animate-fade-in"
            style={{ color: "var(--muted)" }}
          >
            {p.description}
          </p>
        )}

        <div className="flex flex-col gap-2 mb-4">
          {voteOptions.map((opt) => {
            const isSelected = myVote === opt.key;
            const canVote = p.status === "active" && !myVote;
            return (
              <div
                key={opt.key}
                className={cn("relative rounded-lg overflow-hidden transition-all duration-200", canVote ? "cursor-pointer" : "cursor-default")}
                onClick={() => canVote && onVote(p.id, opt.key)}
              >
                <div
                  className="absolute inset-0 rounded-lg"
                  style={{
                    width: `${opt.pct}%`,
                    background: `${opt.color}14`,
                    transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
                  }}
                />
                <div
                  className="relative flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200"
                  style={{
                    border: `1px solid ${isSelected ? opt.color : "var(--border)"}`,
                    background: isSelected ? `${opt.color}0a` : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (canVote)
                      e.currentTarget.style.borderColor = opt.color + "88";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.borderColor = "var(--border)";
                  }}
                >
                  <span
                    className="text-xs tracking-widest font-semibold"
                    style={{ fontFamily: "var(--font-mono)", color: isSelected ? opt.color : "var(--text)" }}
                  >
                    {opt.label}
                  </span>
                  <div className="flex items-center gap-3">
                    <AnimatedBar value={opt.pct} color={opt.color} />
                    <span
                      className="text-xs w-8 text-right"
                      style={{ fontFamily: "var(--font-mono)", color: opt.color }}
                    >
                      {opt.pct}%
                    </span>
                    <span
                      className="text-xs w-10 text-right"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
                    >
                      {opt.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mb-4">
          <div
            className="flex justify-between text-xs mb-1.5"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            <span>QUORUM</span>
            <span>{p.total.toLocaleString()} / {p.quorum.toLocaleString()}</span>
          </div>
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: "var(--surface2)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${quorumPct}%`,
                background: quorumPct >= 100 ? "var(--neon)" : "var(--neon2)",
                transition: "width 1s cubic-bezier(.4,0,.2,1)",
              }}
            />
          </div>
        </div>

        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <Clock size={11} style={{ color: "var(--muted)" }} />
              <span
                className="text-xs"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
              >
                {p.ends}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <User size={11} style={{ color: "var(--muted)" }} />
              <span
                className="text-xs"
                style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
              >
                {p.creator}
              </span>
            </div>
          </div>

          {myVote ? (
            <div className="flex items-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse-glow"
                style={{ background: "var(--neon)" }}
              />
              <span
                className="text-xs tracking-widest"
                style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}
              >
                VOTED {myVote.toUpperCase()}
              </span>
            </div>
          ) : p.status === "active" ? (
            <span
              className="text-xs tracking-widest"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon2)" }}
            >
              Click row to vote
            </span>
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
    </div>
  );
}
