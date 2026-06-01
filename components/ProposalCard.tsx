"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Clock, User, CheckCircle, Lock, Loader2, ArrowUpRight } from "lucide-react";
import { Proposal, VoteChoice } from "@/types";

interface ProposalCardProps {
  proposal: Proposal;
  myVote?: VoteChoice;
  onVote: (id: string, choice: VoteChoice) => Promise<boolean> | boolean;
  onConnectWallet?: () => void;
  connected: boolean;
  isVoting?: boolean;
}

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active:     { color: "var(--neon)",   bg: "rgba(0,245,160,0.07)",   border: "rgba(0,245,160,0.25)",   label: "LIVE"        },
  ended:      { color: "var(--danger)", bg: "rgba(255,71,87,0.08)",   border: "rgba(255,71,87,0.30)",   label: "ENDED"       },
  pending:    { color: "var(--warn)",   bg: "rgba(255,165,2,0.07)",   border: "rgba(255,165,2,0.25)",   label: "PENDING"     },
  confirming: { color: "var(--warn)",   bg: "rgba(255,165,2,0.05)",   border: "rgba(255,165,2,0.35)",   label: "CONFIRMING"  },
};

function pct(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

export default function ProposalCard({ proposal: p, myVote, onVote, onConnectWallet, connected, isVoting = false }: ProposalCardProps) {
  const router = useRouter();
  const [hoveredVote, setHoveredVote] = useState<VoteChoice | null>(null);
  // pendingVote: pilihan yang sedang diproses (menunggu tx hash/konfirmasi)
  // null = tidak ada tx berjalan; non-null = tampilkan sebagai "selected" sambil loading
  const [pendingVote, setPendingVote] = useState<VoteChoice | null>(null);

  const st = STATUS_CFG[p.status] ?? STATUS_CFG.pending;
  const yp = pct(p.yes, p.total);
  const np = pct(p.no, p.total);
  const ap = pct(p.abstain, p.total);

  // Guard ganda: cek status string DAN endTime client-side
  // Mencegah tombol vote aktif saat proposal sudah expired tapi status belum di-update
  const nowSec = Math.floor(Date.now() / 1000);
  const isExpiredByTime = Boolean(p.endTime && nowSec > p.endTime);
  const isActive = p.status === "active" && !isExpiredByTime;
  const isConfirming = p.status === "confirming";
  const isEnded = !isActive && !isConfirming;
  // Proposal "baru" = dibuat dalam 5 menit terakhir (createdAt ISO atau txHash ada + confirming)
  // Untuk proposal yang baru confirmed, createdAt mungkin belum terisi — cek txHash sebagai fallback
  const isNew = (() => {
    if (!p.createdAt) return false;
    const created = new Date(p.createdAt).getTime();
    return !isNaN(created) && Date.now() - created < 5 * 60 * 1000;
  })();
  const canVote = isActive && !myVote && !pendingVote && connected && !isVoting;

  const voteOpts: { key: VoteChoice; label: string; desc: string; pct: number; count: number; color: string }[] = [
    { key: "yes",     label: "FOR",     desc: "Support this proposal",         pct: yp, count: p.yes,     color: "var(--neon)"   },
    { key: "no",      label: "AGAINST", desc: "Oppose this proposal",          pct: np, count: p.no,      color: "var(--danger)" },
    { key: "abstain", label: "ABSTAIN", desc: "Acknowledge but do not decide", pct: ap, count: p.abstain, color: "var(--muted)"  },
  ];

  // Proposal masih "confirming" — tombol vote tidak ditampilkan sama sekali,
  // diganti overlay waiting supaya user tahu voting belum bisa
  if (isConfirming) {
    return (
      <div
        className="rounded-2xl p-5 flex flex-col gap-4 transition-all duration-300"
        style={{
          background: st.bg,
          border: `1px solid ${st.border}`,
          opacity: 0.85,
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs px-2 py-0.5 rounded-full tracking-widest animate-pulse"
                style={{ fontFamily: "var(--font-mono)", color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
              >
                ● {st.label}
              </span>
              {isNew && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full tracking-widest animate-pulse"
                  style={{ fontFamily: "var(--font-mono)", color: "rgba(255,165,2,1)", background: "rgba(255,165,2,0.1)", border: "1px solid rgba(255,165,2,0.4)" }}
                >
                  ✦ NEW
                </span>
              )}
              <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                {p.id}
              </span>
            </div>
            <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: "var(--text1)" }}>
              {p.title}
            </h3>
          </div>
        </div>

        {/* Waiting overlay */}
        <div
          className="rounded-xl flex flex-col items-center justify-center gap-3 py-6"
          style={{ border: "1px dashed rgba(255,165,2,0.3)", background: "rgba(255,165,2,0.03)" }}
        >
          <Loader2 size={22} className="animate-spin" style={{ color: "var(--warn)" }} />
          <p className="text-xs text-center tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--warn)" }}>
            WAITING FOR ON-CHAIN CONFIRMATION
          </p>
          <p className="text-xs text-center" style={{ color: "var(--muted)" }}>
            Voting will be available once the proposal is confirmed
          </p>
          {p.txHash && (
            <a
              href={`https://sepolia.etherscan.io/tx/${p.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs"
              style={{ fontFamily: "var(--font-mono)", color: "var(--warn)", opacity: 0.8, textDecoration: "underline" }}
            >
              View on Etherscan ↗
            </a>
          )}
        </div>
      </div>
    );
  }

  const handleVote = async (choice: VoteChoice) => {
    if (!canVote) return;
    setPendingVote(choice);  // tampilkan pilihan sebagai "selected" sambil loading
    try {
      const ok = await onVote(p.id, choice);
      // onVote return false = gagal (revert/error) — reset ke state awal
      if (ok === false) setPendingVote(null);
      // Kalau berhasil, myVote akan diupdate dari context dan pendingVote jadi irrelevant
      // tapi kita juga reset untuk kebersihan state
      else setPendingVote(null);
    } catch {
      setPendingVote(null);
    }
  };

  const quorumPct = p.quorum > 0 ? Math.min(100, Math.round((p.total / p.quorum) * 100)) : 0;
  const quorumMet = p.total >= p.quorum;

  // Pilih hover class berdasarkan state proposal
  const hoverClass = isEnded
    ? "card-hover-ended"
    : isNew
    ? "card-hover-new"
    : "card-hover";

  // Background & border TEGAS per state supaya user langsung tahu kondisi proposal
  //  ended     : latar merah gelap + border merah tebal — jelas "selesai/tutup"
  //  new       : latar amber/gold + border amber — menonjol "baru"
  //  active    : latar hijau neon subtle + border hijau — "bisa vote"
  //  confirming: sudah punya style sendiri di early return

  const cardBg = isEnded
    ? "var(--surface)"
    : isNew
    ? "var(--surface)"
    : isActive
    ? "var(--surface)"
    : "var(--surface)";

  const cardBorder = isEnded
    ? "1px solid rgba(255,71,87,0.35)"
    : isNew
    ? "1px solid rgba(255,165,2,0.45)"
    : isActive
    ? "1px solid rgba(0,245,160,0.25)"
    : "1px solid var(--border)";

  return (
    <div
      className={`relative rounded-2xl p-6 flex flex-col gap-0 overflow-hidden group ${hoverClass}`}
      style={{ background: cardBg, border: cardBorder, minHeight: "340px" }}
    >
      {/* Top glow line — warnanya ikut hover class */}
      <div
        className="glow-line-hover absolute top-0 left-0 right-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={
          isEnded
            ? { background: "linear-gradient(90deg,transparent,rgba(255,71,87,0.8),transparent)" }
            : isNew
            ? { background: "linear-gradient(90deg,transparent,rgba(255,165,2,0.85),transparent)" }
            : { background: "linear-gradient(90deg,transparent,var(--neon),transparent)" }
        }
      />

      {/* Header  clickable to detail */}
      <div
        className="flex items-start justify-between gap-3 mb-4 cursor-pointer group/header"
        onClick={() => router.push(`/proposal/${encodeURIComponent(p.id)}`)}
      >
        <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
          {p.id}
        </span>
        <div className="flex items-center gap-2">
          {isNew && (
            <span
              className="text-xs px-2 py-0.5 rounded-full tracking-widest animate-pulse"
              style={{ fontFamily: "var(--font-mono)", color: "rgba(255,165,2,1)", background: "rgba(255,165,2,0.1)", border: "1px solid rgba(255,165,2,0.4)" }}
            >
              ✦ NEW
            </span>
          )}
          <span
            className="text-xs px-2.5 py-1 rounded-full tracking-widest font-bold"
            style={{ fontFamily: "var(--font-mono)", color: st.color, background: st.bg, border: `1px solid ${st.border}` }}
          >
            {st.label}
          </span>
          <ArrowUpRight size={12} className="opacity-0 group-hover/header:opacity-100 transition-opacity" style={{ color: "var(--muted)" }} />
        </div>
      </div>

      <h3
        className="font-bold text-base leading-snug mb-2 cursor-pointer hover:opacity-80 transition-opacity"
        style={{ color: "var(--text)" }}
        onClick={() => router.push(`/proposal/${encodeURIComponent(p.id)}`)}
      >
        {p.title}
      </h3>
      <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: "var(--text2)", fontSize: "0.82rem" }}>
        {p.description}
      </p>

      {/* Vote options */}
      <div className="flex flex-col gap-2 mb-4">
        {voteOpts.map((opt) => {
          // isSelected: sudah vote (confirmed) ATAU sedang pending tx untuk opsi ini
          const isSelected = myVote === opt.key;
          const isPending  = pendingVote === opt.key;
          // Only allow hover state when canVote — prevents flicker on disabled/ended
          const isHovered = isActive && !myVote && hoveredVote === opt.key;
          return (
            <div
              key={opt.key}
              className="relative rounded-lg transition-all duration-150"
              style={{
                cursor: isActive && !myVote ? "pointer" : "default",
                pointerEvents: isActive && !myVote ? "auto" : "none",
                // Border dan background langsung di wrapper — tidak ada overflow-hidden
                // yang meng-clip border saat hover (itu root cause bug hilangnya outline)
                border: `1px solid ${
                  isSelected || isPending ? opt.color
                  : isHovered            ? opt.color
                  : "var(--border)"
                }`,
                background: isSelected
                  ? `${opt.color}0d`
                  : isPending
                  ? `${opt.color}08`
                  : isHovered
                  ? `${opt.color}08`
                  : "var(--surface3)",
                opacity: pendingVote && !isPending ? 0.45 : 1,
                boxShadow: isHovered && !isSelected && !isPending
                  ? `0 0 0 1px ${opt.color}40, inset 0 0 12px ${opt.color}06`
                  : "none",
              }}
              onClick={() => { if (!connected && isActive && !myVote) { onConnectWallet?.(); } else if (canVote) { handleVote(opt.key); } }}
              onMouseEnter={() => { if (isActive && !myVote) setHoveredVote(opt.key); }}
              onMouseLeave={() => setHoveredVote(null)}
              role={canVote ? "button" : undefined}
              tabIndex={canVote ? 0 : undefined}
              onKeyDown={(e) => e.key === "Enter" && canVote && handleVote(opt.key)}
              aria-label={`Vote ${opt.label}`}
            >
              {/* Progress fill — tidak perlu absolute inset karena tidak ada overflow-hidden */}
              <div
                className="absolute inset-0 rounded-lg transition-all duration-700 pointer-events-none"
                style={{ width: `${opt.pct}%`, background: `${opt.color}10` }}
              />
              <div
                className="relative flex items-center justify-between px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  {isSelected ? (
                    <CheckCircle size={11} style={{ color: opt.color }} />
                  ) : isPending ? (
                    <Loader2 size={11} className="animate-spin" style={{ color: opt.color }} />
                  ) : null}
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-xs tracking-widest"
                      style={{ fontFamily: "var(--font-mono)", color: isSelected || isPending || isHovered ? opt.color : "var(--text2)" }}
                    >
                      {opt.label}{isPending ? "..." : ""}
                    </span>
                    {(isHovered || isSelected || isPending) && (
                      <span className="text-xs" style={{ color: "var(--muted)", fontSize: "0.62rem" }}>
                        {opt.desc}
                      </span>
                    )}
                  </div>
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

      {/* Quorum bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.6rem" }}>
            QUORUM
          </span>
          <span
            className="text-xs tracking-widest font-bold"
            style={{ fontFamily: "var(--font-mono)", color: quorumMet ? "var(--neon)" : "var(--muted)", fontSize: "0.6rem" }}
          >
            {p.total.toLocaleString()} / {p.quorum.toLocaleString()} {quorumMet ? "✓ MET" : ""}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{
              width: `${quorumPct}%`,
              background: quorumMet ? "var(--neon)" : "var(--neon2)",
              boxShadow: quorumMet ? "0 0 6px var(--neon)" : "none",
            }}
          />
        </div>
      </div>

      {/* Footer */}
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
              VOTED {myVote === "yes" ? "FOR" : myVote === "no" ? "AGAINST" : "ABSTAIN"}
            </span>
          </div>
        ) : isActive && !connected ? (
          <div className="flex items-center gap-1.5">
            <Lock size={10} style={{ color: "var(--muted)" }} />
            <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              CONNECT TO VOTE
            </span>
          </div>
        ) : isConfirming ? (
          <div className="flex items-center gap-2">
            <Loader2 size={11} className="animate-spin" style={{ color: "var(--warn)" }} />
            <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--warn)" }}>
              AWAITING CONFIRMATION
            </span>
            {p.txHash && (
              <a
                href={`https://sepolia.etherscan.io/tx/${p.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs"
                style={{ fontFamily: "var(--font-mono)", color: "var(--warn)", opacity: 0.7, textDecoration: "underline" }}
                onClick={(e) => e.stopPropagation()}
              >
                ↗
              </a>
            )}
          </div>
        ) : isEnded ? (
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--danger)" }} />
            <span
              className="text-xs tracking-widest font-bold"
              style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}
            >
              {p.status === "pending" ? "NOT STARTED" : "CLOSED"}
            </span>
          </div>
        ) : pendingVote ? (
          <div className="flex items-center gap-2">
            <Loader2 size={11} className="animate-spin" style={{ color: "var(--neon)" }} />
            <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}>
              SUBMITTING {pendingVote.toUpperCase()}...
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
