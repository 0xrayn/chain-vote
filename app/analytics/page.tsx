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
          isConnecting={isConnecting}
        connectingWallet={connectingWallet}
        discoveredProviders={discoveredProviders}
        onClose={() => setShowWalletModal(false)} />
      )}
    </main>
  );
}
