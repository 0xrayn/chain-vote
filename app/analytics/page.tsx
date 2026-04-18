"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { BarChart3, TrendingUp, Users, Activity, Zap, ArrowUpRight } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useProposals } from "@/hooks/useProposals";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConnectWalletModal from "@/components/ConnectWalletModal";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), { ssr: false });

function StatCard({ label, value, sub, icon, color, trend }: { label: string; value: string | number; sub?: string; icon: React.ReactNode; color: string; trend?: string }) {
  return (
    <div className="rounded-2xl p-6 card-hover" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}12`, border: `1px solid ${color}30` }}>
          <span style={{ color }}>{icon}</span>
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ background: "rgba(0,245,160,0.07)", color: "var(--neon)" }}>
            <ArrowUpRight size={10} />
            {trend}
          </div>
        )}
      </div>
      <div className="text-3xl font-extrabold mb-1" style={{ fontFamily: "var(--font-mono)", color }}>{value}</div>
      <div className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{label}</div>
      {sub && <div className="text-xs" style={{ color: "var(--muted)" }}>{sub}</div>}
    </div>
  );
}

function SimpleBar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs w-20 tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{label}</span>
      <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <span className="text-xs w-10 text-right font-bold" style={{ fontFamily: "var(--font-mono)", color }}>{pct}%</span>
    </div>
  );
}

export default function AnalyticsPage() {
  const { wallet, connect, disconnect, shortAddress, isConnecting, isWrongNetwork, switchToSepolia, discoveredProviders } = useWallet();
  const { proposals } = useProposals();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState("");

  // FIX: Semua stats dihitung dari data proposals nyata (termasuk yang dibuat user)
  const totalVotes = proposals.reduce((a, p) => a + p.total, 0);
  const activeCount = proposals.filter((p) => p.status === "active").length;
  const endedCount = proposals.filter((p) => p.status === "ended").length;
  const pendingCount = proposals.filter((p) => p.status === "pending").length;
  const totalYes = proposals.reduce((a, p) => a + p.yes, 0);
  const totalNo = proposals.reduce((a, p) => a + p.no, 0);
  const totalAbstain = proposals.reduce((a, p) => a + p.abstain, 0);
  const passRate = totalVotes > 0 ? Math.round((totalYes / totalVotes) * 100) : 0;

  const forPct = totalVotes > 0 ? Math.round((totalYes / totalVotes) * 100) : 0;
  const againstPct = totalVotes > 0 ? Math.round((totalNo / totalVotes) * 100) : 0;
  const abstainPct = totalVotes > 0 ? Math.round((totalAbstain / totalVotes) * 100) : 0;

  // FIX: Modal ditutup setelah connect selesai
  const handleConnectConfirm = async (walletType: string) => {
    setConnectingWallet(walletType);
    await connect(walletType);
    setShowWalletModal(false);
    setConnectingWallet("");
  };

  return (
    <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
      <ThreeBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          wallet={wallet}
          shortAddress={shortAddress}
          onConnect={() => setShowWalletModal(true)}
          onDisconnect={disconnect}
          isConnecting={isConnecting}
          isWrongNetwork={isWrongNetwork}
          onSwitchNetwork={switchToSepolia}
        />

        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
          <div className="mb-10 animate-fadeInUp">
            <div
              className="inline-flex items-center gap-2 text-xs tracking-widest mb-4 px-3 py-1.5 rounded-full"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon3)", background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.2)" }}
            >
              <BarChart3 size={11} />
              GOVERNANCE ANALYTICS
            </div>
            <h1 className="text-4xl font-extrabold mb-3 gradient-text">Analytics</h1>
            <p style={{ color: "var(--text2)" }}>Real-time governance statistics from proposal data.</p>
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-fadeInUp delay-100">
            <StatCard label="Total Proposals" value={proposals.length} icon={<Activity size={18} />} color="var(--neon2)" trend={`${activeCount} active`} sub={`${endedCount} ended · ${pendingCount} pending`} />
            <StatCard label="Total Votes Cast" value={totalVotes.toLocaleString()} icon={<Users size={18} />} color="var(--neon)" trend="on-chain" sub="simulated on Sepolia" />
            <StatCard label="Pass Rate" value={`${passRate}%`} icon={<TrendingUp size={18} />} color="var(--warn)" trend="FOR votes" sub={`${totalYes.toLocaleString()} FOR / ${totalNo.toLocaleString()} AGAINST`} />
            <StatCard label="Active Now" value={activeCount} icon={<Zap size={18} />} color="var(--neon3)" sub={`${endedCount} concluded`} />
          </div>

          {/* Vote breakdown */}
          <div
            className="rounded-2xl p-6 mb-6 animate-fadeInUp delay-200"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-bold tracking-widest mb-6" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>VOTE BREAKDOWN</h2>
            <div className="flex flex-col gap-4">
              <SimpleBar label="FOR" pct={forPct} color="var(--neon)" />
              <SimpleBar label="AGAINST" pct={againstPct} color="#f87171" />
              <SimpleBar label="ABSTAIN" pct={abstainPct} color="var(--muted)" />
            </div>
            <div className="mt-6 pt-4 flex gap-6 text-xs" style={{ borderTop: "1px solid var(--border)", fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              <span>FOR: <strong style={{ color: "var(--neon)" }}>{totalYes.toLocaleString()}</strong></span>
              <span>AGAINST: <strong style={{ color: "#f87171" }}>{totalNo.toLocaleString()}</strong></span>
              <span>ABSTAIN: <strong style={{ color: "var(--muted)" }}>{totalAbstain.toLocaleString()}</strong></span>
            </div>
          </div>

          {/* Per proposal breakdown */}
          <div
            className="rounded-2xl p-6 animate-fadeInUp delay-300"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <h2 className="text-sm font-bold tracking-widest mb-6" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>PER PROPOSAL</h2>
            <div className="flex flex-col gap-4">
              {proposals.map((p) => {
                const pForPct = p.total > 0 ? Math.round((p.yes / p.total) * 100) : 0;
                const statusColor = p.status === "active" ? "var(--neon)" : p.status === "ended" ? "var(--muted)" : "var(--warn)";
                return (
                  <div key={p.id} className="flex flex-col gap-2 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--neon2)" }}>{p.id}</span>
                        <span className="text-xs" style={{ color: statusColor, fontFamily: "var(--font-mono)", fontSize: "0.6rem" }}>{p.status.toUpperCase()}</span>
                      </div>
                      <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{p.total} votes</span>
                    </div>
                    <p className="text-sm truncate" style={{ color: "var(--text2)" }}>{p.title}</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--surface2)" }}>
                        <div className="h-full rounded-full" style={{ width: `${pForPct}%`, background: "var(--neon)" }} />
                      </div>
                      <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--neon)", minWidth: "36px", textAlign: "right" }}>{pForPct}% FOR</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {showWalletModal && (
        <ConnectWalletModal
          onConnect={handleConnectConfirm}
          onClose={() => { if (!isConnecting) setShowWalletModal(false); }}
          isConnecting={isConnecting}
          connectingWallet={connectingWallet}
          discoveredProviders={discoveredProviders}
        />
      )}
    </main>
  );
}
