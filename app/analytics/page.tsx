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
  const { wallet, connect, disconnect, shortAddress } = useWallet();
  const { proposals } = useProposals();
  const [showWalletModal, setShowWalletModal] = useState(false);

  const totalVotes = proposals.reduce((a, p) => a + p.total, 0);
  const activeCount = proposals.filter((p) => p.status === "active").length;
  const endedCount = proposals.filter((p) => p.status === "ended").length;
  const totalYes = proposals.reduce((a, p) => a + p.yes, 0);
  const totalNo = proposals.reduce((a, p) => a + p.no, 0);
  const totalAbstain = proposals.reduce((a, p) => a + p.abstain, 0);
  const passRate = totalVotes > 0 ? Math.round((totalYes / totalVotes) * 100) : 0;

  const forPct = totalVotes > 0 ? Math.round((totalYes / totalVotes) * 100) : 0;
  const againstPct = totalVotes > 0 ? Math.round((totalNo / totalVotes) * 100) : 0;
  const abstainPct = totalVotes > 0 ? Math.round((totalAbstain / totalVotes) * 100) : 0;

  return (
    <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
      <ThreeBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          wallet={wallet}
          shortAddress={shortAddress}
          onConnect={() => setShowWalletModal(true)}
          onDisconnect={disconnect}
        />

        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
          <div className="mb-10 animate-fadeInUp">
            <div
              className="inline-flex items-center gap-2 text-xs tracking-widest mb-4 px-3 py-1.5 rounded-full"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon3)", background: "rgba(168,85,247,0.07)", border: "1px solid rgba(168,85,247,0.2)" }}
            >
              <BarChart3 size={11} />
              PROTOCOL ANALYTICS
            </div>
            <h1 className="text-4xl font-extrabold mb-3 gradient-text">Analytics</h1>
            <p style={{ color: "var(--text2)" }}>Real-time governance metrics and voting statistics.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8 animate-fadeInUp delay-100">
            <StatCard label="Total Proposals" value={proposals.length} icon={<Zap size={18} />} color="var(--neon2)" trend="+12%" sub="All time" />
            <StatCard label="Total Votes" value={totalVotes.toLocaleString()} icon={<Users size={18} />} color="var(--neon)" trend="+8%" sub="Cumulative" />
            <StatCard label="Active Now" value={activeCount} icon={<Activity size={18} />} color="var(--warn)" sub="Live proposals" />
            <StatCard label="Pass Rate" value={`${passRate}%`} icon={<TrendingUp size={18} />} color="var(--neon)" sub="FOR / total" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
            <div className="rounded-2xl p-6 animate-fadeInUp delay-200" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <BarChart3 size={14} style={{ color: "var(--neon2)" }} />
                Vote Distribution
              </h3>
              <div className="flex flex-col gap-4">
                <SimpleBar label="FOR" pct={forPct} color="var(--neon)" />
                <SimpleBar label="AGAINST" pct={againstPct} color="var(--danger)" />
                <SimpleBar label="ABSTAIN" pct={abstainPct} color="var(--muted)" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-3 pt-5" style={{ borderTop: "1px solid var(--border)" }}>
                {[
                  { label: "For", v: totalYes, color: "var(--neon)" },
                  { label: "Against", v: totalNo, color: "var(--danger)" },
                  { label: "Abstain", v: totalAbstain, color: "var(--muted)" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="text-xl font-bold mb-0.5" style={{ fontFamily: "var(--font-mono)", color: item.color }}>{item.v.toLocaleString()}</div>
                    <div className="text-xs" style={{ color: "var(--muted)" }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl p-6 animate-fadeInUp delay-300" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-bold mb-5 flex items-center gap-2" style={{ color: "var(--text)" }}>
                <Activity size={14} style={{ color: "var(--neon)" }} />
                Proposal Status Breakdown
              </h3>
              <div className="flex flex-col gap-4 mb-6">
                {[
                  { label: "ACTIVE", count: activeCount, total: proposals.length, color: "var(--neon)" },
                  { label: "ENDED", count: endedCount, total: proposals.length, color: "var(--muted)" },
                  { label: "PENDING", count: proposals.filter((p) => p.status === "pending").length, total: proposals.length, color: "var(--warn)" },
                ].map((item) => (
                  <SimpleBar key={item.label} label={item.label} pct={proposals.length > 0 ? Math.round((item.count / proposals.length) * 100) : 0} color={item.color} />
                ))}
              </div>
              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full glow-pulse" style={{ background: "var(--neon)" }} />
                  <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}>NETWORK STATUS</span>
                </div>
                <p className="text-xs" style={{ color: "var(--muted)" }}>Sepolia Testnet · Block ~5.8M · Gas 12 gwei</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden animate-fadeInUp delay-400" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h3 className="text-sm font-bold" style={{ color: "var(--text)" }}>Proposal Activity</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["ID", "TITLE", "STATUS", "VOTES", "FOR%", "ENDS"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p, i) => (
                    <tr key={p.id} className="transition-colors duration-150" style={{ borderBottom: i < proposals.length - 1 ? "1px solid var(--border)" : "none" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface2)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    >
                      <td className="px-5 py-3.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{p.id}</td>
                      <td className="px-5 py-3.5 text-sm font-semibold" style={{ color: "var(--text)", maxWidth: "200px" }}>
                        <span className="truncate block">{p.title}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-xs px-2 py-1 rounded-full" style={{ fontFamily: "var(--font-mono)", color: p.status === "active" ? "var(--neon)" : p.status === "pending" ? "var(--warn)" : "var(--muted)", background: p.status === "active" ? "rgba(0,245,160,0.08)" : p.status === "pending" ? "rgba(255,165,2,0.08)" : "rgba(74,122,155,0.08)" }}>
                          {p.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--text2)" }}>{p.total.toLocaleString()}</td>
                      <td className="px-5 py-3.5 text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}>
                        {p.total > 0 ? Math.round((p.yes / p.total) * 100) : 0}%
                      </td>
                      <td className="px-5 py-3.5 text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{p.ends}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {showWalletModal && (
        <ConnectWalletModal onConnect={() => { connect(); setShowWalletModal(false); }} onClose={() => setShowWalletModal(false)} />
      )}
    </main>
  );
}
