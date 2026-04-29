"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User, Wallet, CheckCircle, Clock, ExternalLink,
  BarChart3, Shield, Zap, ArrowUpRight, Copy, Check,
  Trophy, Activity
} from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useProposals } from "@/hooks/useProposals";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConnectWalletModal from "@/components/ConnectWalletModal";
import { VoteChoice } from "@/types";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), { ssr: false });

const VOTE_COLOR: Record<VoteChoice, string> = {
  yes:     "var(--neon)",
  no:      "var(--danger)",
  abstain: "var(--muted)",
};
const VOTE_LABEL: Record<VoteChoice, string> = {
  yes:     "FOR",
  no:      "AGAINST",
  abstain: "ABSTAIN",
};

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="hover:opacity-60 transition-opacity"
      style={{ color: "var(--muted)" }}
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const { wallet, connect, disconnect, shortAddress, isConnecting, isWrongNetwork, switchToSepolia, discoveredProviders } = useWallet();
  const { proposals, myVotes, isLoading } = useProposals(wallet.address);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState("");

  const handleConnectConfirm = async (walletType: string) => {
    setConnectingWallet(walletType);
    try { await connect(walletType); }
    finally { setShowWalletModal(false); setConnectingWallet(""); }
  };

  // Voted proposals
  const votedEntries = Object.entries(myVotes) as [string, VoteChoice][];
  const votedProposals = votedEntries
    .map(([id, choice]) => ({ proposal: proposals.find((p) => p.id === id), choice }))
    .filter((e) => e.proposal !== undefined);

  // Stats
  const totalVoted = votedEntries.length;
  const forVotes     = votedEntries.filter(([, c]) => c === "yes").length;
  const againstVotes = votedEntries.filter(([, c]) => c === "no").length;
  const abstainVotes = votedEntries.filter(([, c]) => c === "abstain").length;

  const createdProposals = proposals.filter((p) =>
    wallet.address && p.creator.toLowerCase().startsWith(wallet.address.slice(0, 6).toLowerCase())
  );

  return (
    <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
      <ThreeBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          wallet={wallet} shortAddress={shortAddress} onConnect={() => setShowWalletModal(true)}
          onDisconnect={disconnect} isConnecting={isConnecting} isWrongNetwork={isWrongNetwork}
          onSwitchNetwork={switchToSepolia}
        />

        <div className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
          {/* Header */}
          <div className="mb-10 animate-fadeInUp">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest mb-4 px-3 py-1.5 rounded-full"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon)", background: "rgba(0,245,160,0.06)", border: "1px solid rgba(0,245,160,0.2)" }}>
              <User size={11} />
              MY PROFILE
            </div>
            <h1 className="text-4xl font-extrabold mb-3 gradient-text">Profile</h1>
            <p style={{ color: "var(--text2)" }}>Your wallet identity and voting history on ChainVotes.</p>
          </div>

          {!wallet.connected ? (
            /* Not connected */
            <div className="flex flex-col items-center justify-center py-24 gap-5 rounded-2xl animate-fadeInUp"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
                style={{ background: "rgba(0,245,160,0.06)", border: "1px solid rgba(0,245,160,0.2)" }}>
                <Wallet size={24} style={{ color: "var(--neon)" }} />
              </div>
              <p className="text-sm tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                CONNECT YOUR WALLET
              </p>
              <p className="text-sm text-center max-w-xs" style={{ color: "var(--text2)" }}>
                Connect your wallet to view your voting history, stats, and profile.
              </p>
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm tracking-widest transition-all"
                style={{ fontFamily: "var(--font-mono)", border: "1px solid var(--neon)", color: "var(--neon)", background: "rgba(0,245,160,0.07)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(0,245,160,0.15)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
              >
                <Wallet size={14} />
                CONNECT WALLET
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Wallet card */}
              <div className="rounded-2xl p-7 animate-fadeInUp" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                <div className="flex items-start gap-5 flex-wrap">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                    style={{ background: "rgba(0,245,160,0.08)", border: "1px solid rgba(0,245,160,0.25)" }}>
                    <User size={22} style={{ color: "var(--neon)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className="font-bold text-lg" style={{ color: "var(--text)" }}>
                        {shortAddress}
                      </span>
                      <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                        style={{ fontFamily: "var(--font-mono)", color: "var(--neon)", background: "rgba(0,245,160,0.07)", border: "1px solid rgba(0,245,160,0.2)" }}>
                        <span className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: "var(--neon)" }} />
                        CONNECTED
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs mb-3" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      <span className="truncate">{wallet.address}</span>
                      {wallet.address && <CopyBtn text={wallet.address} />}
                      <a href={`https://sepolia.etherscan.io/address/${wallet.address}`} target="_blank" rel="noopener noreferrer"
                        className="hover:opacity-70 transition-opacity" style={{ color: "var(--neon2)" }}>
                        <ExternalLink size={11} />
                      </a>
                    </div>
                    {wallet.balance && (
                      <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                        Balance: <span style={{ color: "var(--neon)" }}>{parseFloat(wallet.balance).toFixed(4)} ETH</span>
                        <span style={{ color: "var(--muted)" }}> (Sepolia)</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fadeInUp" style={{ animationDelay: "0.05s" }}>
                {[
                  { label: "VOTES CAST",    value: totalVoted,    color: "var(--neon2)",  icon: <Activity size={16} /> },
                  { label: "FOR",           value: forVotes,      color: "var(--neon)",   icon: <CheckCircle size={16} /> },
                  { label: "AGAINST",       value: againstVotes,  color: "var(--danger)", icon: <Shield size={16} /> },
                  { label: "ABSTAIN",       value: abstainVotes,  color: "var(--muted)",  icon: <Zap size={16} /> },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl p-5 flex flex-col gap-3"
                    style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                      style={{ background: `${s.color}12`, border: `1px solid ${s.color}30` }}>
                      <span style={{ color: s.color }}>{s.icon}</span>
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold mb-0.5" style={{ fontFamily: "var(--font-mono)", color: s.color }}>
                        {s.value}
                      </div>
                      <div className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.55rem" }}>
                        {s.label}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Voting history */}
              <div className="rounded-2xl p-7 animate-fadeInUp" style={{ animationDelay: "0.1s", background: "var(--surface)", border: "1px solid var(--border)" }}>
                <h2 className="text-xs font-bold tracking-widest mb-6" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>
                  VOTING HISTORY
                </h2>
                {isLoading ? (
                  <div className="flex flex-col gap-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="rounded-xl h-16 animate-pulse" style={{ background: "var(--surface2)" }} />
                    ))}
                  </div>
                ) : votedProposals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <BarChart3 size={28} style={{ color: "var(--muted)" }} />
                    <p className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      NO VOTES YET
                    </p>
                    <p className="text-sm text-center" style={{ color: "var(--text2)" }}>
                      Head to the Proposals tab and cast your first on-chain vote.
                    </p>
                    <button onClick={() => router.push("/")}
                      className="flex items-center gap-2 mt-2 px-4 py-2 rounded-xl text-xs tracking-widest transition-all"
                      style={{ fontFamily: "var(--font-mono)", border: "1px solid var(--neon)", color: "var(--neon)", background: "rgba(0,245,160,0.05)" }}>
                      VIEW PROPOSALS <ArrowUpRight size={11} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {votedProposals.map(({ proposal: p, choice }, i) => {
                      if (!p) return null;
                      const vColor = VOTE_COLOR[choice];
                      return (
                        <div key={p.id}
                          className="flex items-center gap-4 px-5 py-4 rounded-xl cursor-pointer transition-all duration-200"
                          style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
                          onClick={() => router.push(`/proposal/${encodeURIComponent(p.id)}`)}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = vColor; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                        >
                          <span className="text-xs w-16 flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                            {p.id}
                          </span>
                          <span className="flex-1 text-sm truncate" style={{ color: "var(--text2)" }}>
                            {p.title}
                          </span>
                          <span className="text-xs px-3 py-1 rounded-full tracking-widest font-bold flex-shrink-0"
                            style={{ fontFamily: "var(--font-mono)", color: vColor, background: `${vColor}12`, border: `1px solid ${vColor}30` }}>
                            {VOTE_LABEL[choice]}
                          </span>
                          <span className="text-xs flex-shrink-0" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.6rem" }}>
                            {p.status.toUpperCase()}
                          </span>
                          <ArrowUpRight size={12} style={{ color: "var(--muted)", flexShrink: 0 }} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
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
