"use client";
import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, Clock, User, CheckCircle, Loader2,
  Trophy, Users, Shield, ExternalLink, Copy, Check,
  TrendingUp, AlertCircle, Lock, FileText, Hash
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useProposals } from "@/hooks/useProposals";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConnectWalletModal from "@/components/ConnectWalletModal";
import { Proposal, VoteChoice } from "@/types";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), { ssr: false });

function pct(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

const STATUS_CFG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  active:  { color: "var(--neon)",  bg: "rgba(0,245,160,0.07)",  border: "rgba(0,245,160,0.25)",  label: "LIVE"    },
  ended:   { color: "var(--muted)", bg: "rgba(74,122,155,0.07)", border: "rgba(74,122,155,0.2)",  label: "ENDED"   },
  pending: { color: "var(--warn)",  bg: "rgba(255,165,2,0.07)",  border: "rgba(255,165,2,0.25)",  label: "PENDING" },
};

function VoteBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const p = pct(count, total);
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
          {label}
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {count.toLocaleString()} votes
          </span>
          <span className="text-sm font-bold w-12 text-right" style={{ fontFamily: "var(--font-mono)", color }}>
            {p}%
          </span>
        </div>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${p}%`, background: color, boxShadow: `0 0 8px ${color}60` }}
        />
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      style={{ color: "var(--muted)" }}
      className="hover:opacity-70 transition-opacity"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function ProposalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { wallet, connect, disconnect, shortAddress, isConnecting, isWrongNetwork, switchToSepolia, discoveredProviders } = useWallet();
  const { proposals, myVotes, vote, votingId } = useProposals(wallet.address);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState("");
  const [localVoting, setLocalVoting] = useState(false);
  const [hoveredVote, setHoveredVote] = useState<VoteChoice | null>(null);

  const proposal = proposals.find((p) => p.id === decodeURIComponent(id));
  const myVote = proposal ? myVotes[proposal.id] : undefined;

  const handleConnectConfirm = async (walletType: string) => {
    setConnectingWallet(walletType);
    try { await connect(walletType); }
    finally { setShowWalletModal(false); setConnectingWallet(""); }
  };

  const handleVote = async (choice: VoteChoice) => {
    if (!proposal || !canVote) return;
    setLocalVoting(true);
    try { await vote(proposal.id, choice, wallet.connected && !isWrongNetwork); }
    finally { setLocalVoting(false); }
  };

  if (!proposal) {
    return (
      <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
        <ThreeBackground />
        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar
            wallet={wallet} shortAddress={shortAddress} onConnect={() => setShowWalletModal(true)}
            onDisconnect={disconnect} isConnecting={isConnecting} isWrongNetwork={isWrongNetwork}
            onSwitchNetwork={switchToSepolia}
          />
          <div className="flex-1 flex flex-col items-center justify-center gap-5 px-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
              style={{ background: "rgba(0,245,160,0.06)", border: "1px solid rgba(0,245,160,0.2)" }}>
              <FileText size={24} style={{ color: "var(--neon)" }} />
            </div>
            <p className="text-sm tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              PROPOSAL NOT FOUND
            </p>
            <button onClick={() => router.push("/")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs tracking-widest transition-all"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon2)", border: "1px solid var(--neon2)", background: "rgba(0,212,255,0.07)" }}>
              <ArrowLeft size={12} /> BACK TO PROPOSALS
            </button>
          </div>
          <Footer />
        </div>
      </main>
    );
  }

  const st = STATUS_CFG[proposal.status] ?? STATUS_CFG.pending;
  const canVote = proposal.status === "active" && !myVote && wallet.connected && !isWrongNetwork && !votingId && !localVoting;
  const quorumPct = proposal.quorum > 0 ? Math.min(100, Math.round((proposal.total / proposal.quorum) * 100)) : 0;
  const quorumMet = proposal.total >= proposal.quorum;

  const voteOpts: { key: VoteChoice; label: string; count: number; color: string }[] = [
    { key: "yes",     label: "FOR",     count: proposal.yes,     color: "var(--neon)"   },
    { key: "no",      label: "AGAINST", count: proposal.no,      color: "var(--danger)" },
    { key: "abstain", label: "ABSTAIN", count: proposal.abstain, color: "var(--muted)"  },
  ];

  const winner = proposal.total > 0
    ? (proposal.yes > proposal.no ? { text: "FOR WINS", color: "var(--neon)" } : { text: "AGAINST WINS", color: "var(--danger)" })
    : null;

  return (
    <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
      <ThreeBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          wallet={wallet} shortAddress={shortAddress} onConnect={() => setShowWalletModal(true)}
          onDisconnect={disconnect} isConnecting={isConnecting} isWrongNetwork={isWrongNetwork}
          onSwitchNetwork={switchToSepolia}
        />

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-10">
          {/* Back button */}
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-xs tracking-widest mb-8 transition-opacity hover:opacity-70"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            <ArrowLeft size={13} /> BACK
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main panel */}
            <div className="lg:col-span-2 flex flex-col gap-5">
              {/* Header card */}
              <div className="rounded-2xl p-7 animate-fadeInUp"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
                  <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                    {proposal.id}
                  </span>
                  <span className="text-xs px-3 py-1 rounded-full tracking-widest font-bold"
                    style={{ fontFamily: "var(--font-mono)", color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                    {st.label}
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold mb-4 leading-snug" style={{ color: "var(--text)" }}>
                  {proposal.title}
                </h1>
                <p className="leading-relaxed text-sm" style={{ color: "var(--text2)", lineHeight: 1.8 }}>
                  {proposal.description || (
                    <span style={{ color: "var(--muted)", fontStyle: "italic" }}>
                      No description available — description is stored on-chain per proposal.
                    </span>
                  )}
                </p>
              </div>

              {/* Vote results */}
              <div className="rounded-2xl p-7 animate-fadeInUp" style={{ animationDelay: "0.05s", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h2 className="text-xs font-bold tracking-widest mb-6" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                  VOTE RESULTS
                </h2>
                <div className="flex flex-col gap-5 mb-6">
                  <VoteBar label="FOR"     count={proposal.yes}     total={proposal.total} color="var(--neon)"   />
                  <VoteBar label="AGAINST" count={proposal.no}      total={proposal.total} color="var(--danger)" />
                  <VoteBar label="ABSTAIN" count={proposal.abstain} total={proposal.total} color="var(--muted)"  />
                </div>

                {/* Quorum */}
                <div className="mb-5 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      QUORUM PROGRESS
                    </span>
                    <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: quorumMet ? "var(--neon)" : "var(--muted)" }}>
                      {proposal.total.toLocaleString()} / {proposal.quorum.toLocaleString()} {quorumMet ? "✓ MET" : ""}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
                    <div className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${quorumPct}%`, background: quorumMet ? "var(--neon)" : "var(--neon2)", boxShadow: quorumMet ? "0 0 6px var(--neon)" : "none" }} />
                  </div>
                </div>

                {/* Winner badge */}
                {proposal.status === "ended" && winner && (
                  <div className="inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl tracking-widest"
                    style={{ fontFamily: "var(--font-mono)", color: winner.color, background: `${winner.color}12`, border: `1px solid ${winner.color}30` }}>
                    <Trophy size={12} />
                    FINAL RESULT: {winner.text}
                  </div>
                )}
              </div>
            </div>

            {/* Right panel */}
            <div className="flex flex-col gap-5">
              {/* Cast vote */}
              <div className="rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "0.1s", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h2 className="text-xs font-bold tracking-widest mb-5" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                  CAST YOUR VOTE
                </h2>
                {myVote ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(0,245,160,0.1)", border: "1px solid rgba(0,245,160,0.3)" }}>
                      <CheckCircle size={20} style={{ color: "var(--neon)" }} />
                    </div>
                    <p className="text-xs tracking-widest text-center" style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}>
                      YOU VOTED {myVote.toUpperCase()}
                    </p>
                  </div>
                ) : proposal.status !== "active" ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Shield size={20} style={{ color: "var(--muted)" }} />
                    <p className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      {proposal.status === "pending" ? "VOTING NOT STARTED" : "VOTING CLOSED"}
                    </p>
                  </div>
                ) : !wallet.connected ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-2 justify-center py-3">
                      <Lock size={14} style={{ color: "var(--muted)" }} />
                      <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                        CONNECT WALLET
                      </span>
                    </div>
                    <button onClick={() => setShowWalletModal(true)}
                      className="w-full py-3 rounded-xl text-xs tracking-widest transition-all"
                      style={{ fontFamily: "var(--font-mono)", border: "1px solid var(--neon)", color: "var(--neon)", background: "rgba(0,245,160,0.05)" }}>
                      CONNECT
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {voteOpts.map((opt) => {
                      const isHovered = hoveredVote === opt.key;
                      return (
                        <button key={opt.key}
                          onClick={() => handleVote(opt.key)}
                          onMouseEnter={() => setHoveredVote(opt.key)}
                          onMouseLeave={() => setHoveredVote(null)}
                          disabled={!canVote}
                          className="flex items-center justify-between px-4 py-3 rounded-xl text-xs tracking-widest transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            fontFamily: "var(--font-mono)",
                            color: isHovered ? opt.color : "var(--text2)",
                            border: `1px solid ${isHovered ? opt.color : "var(--border)"}`,
                            background: isHovered ? `${opt.color}08` : "transparent",
                          }}>
                          <span>{opt.label}</span>
                          {localVoting && <Loader2 size={11} className="animate-spin" style={{ color: opt.color }} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Proposal info */}
              <div className="rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "0.15s", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h2 className="text-xs font-bold tracking-widest mb-5" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                  PROPOSAL INFO
                </h2>
                <div className="flex flex-col gap-4 text-xs" style={{ fontFamily: "var(--font-mono)" }}>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "var(--muted)" }}>CREATOR</span>
                    <div className="flex items-center gap-2">
                      <User size={10} style={{ color: "var(--neon2)" }} />
                      <span style={{ color: "var(--text2)" }}>{proposal.creator}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "var(--muted)" }}>TIME LEFT</span>
                    <div className="flex items-center gap-2">
                      <Clock size={10} style={{ color: "var(--warn)" }} />
                      <span style={{ color: "var(--text2)" }}>{proposal.ends}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span style={{ color: "var(--muted)" }}>TOTAL VOTES</span>
                    <div className="flex items-center gap-2">
                      <Users size={10} style={{ color: "var(--neon)" }} />
                      <span style={{ color: "var(--text2)" }}>{proposal.total.toLocaleString()}</span>
                    </div>
                  </div>
                  {proposal.createdAt && (
                    <div className="flex flex-col gap-1">
                      <span style={{ color: "var(--muted)" }}>CREATED</span>
                      <span style={{ color: "var(--text2)" }}>{proposal.createdAt}</span>
                    </div>
                  )}
                  {proposal.txHash && (
                    <div className="flex flex-col gap-1">
                      <span style={{ color: "var(--muted)" }}>TX HASH</span>
                      <div className="flex items-center gap-2">
                        <Hash size={10} style={{ color: "var(--neon3)" }} />
                        <a
                          href={`https://sepolia.etherscan.io/tx/${proposal.txHash}`}
                          target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:opacity-70 transition-opacity"
                          style={{ color: "var(--neon3)" }}
                        >
                          {proposal.txHash.slice(0, 10)}…
                          <ExternalLink size={9} />
                        </a>
                        <CopyButton text={proposal.txHash} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick stats */}
              <div className="rounded-2xl p-6 animate-fadeInUp" style={{ animationDelay: "0.2s", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h2 className="text-xs font-bold tracking-widest mb-4" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                  QUICK STATS
                </h2>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "FOR", value: proposal.yes, color: "var(--neon)" },
                    { label: "AGAINST", value: proposal.no, color: "var(--danger)" },
                    { label: "ABSTAIN", value: proposal.abstain, color: "var(--muted)" },
                  ].map((s) => (
                    <div key={s.label} className="flex flex-col items-center gap-1 rounded-xl p-3"
                      style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                      <span className="text-base font-bold" style={{ fontFamily: "var(--font-mono)", color: s.color }}>
                        {s.value}
                      </span>
                      <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.55rem" }}>
                        {s.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {showWalletModal && (
        <ConnectWalletModal
          onConnect={handleConnectConfirm}
          onClose={() => { if (!isConnecting) setShowWalletModal(false); }}
          onForceCancel={() => { setShowWalletModal(false); setConnectingWallet(""); }}
          isConnecting={isConnecting}
          connectingWallet={connectingWallet}
          discoveredProviders={discoveredProviders}
        />
      )}
    </main>
  );
}
