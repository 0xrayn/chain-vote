"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { LayoutGrid, PlusCircle, BarChart3, Activity, Users, Zap, TrendingUp } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useProposals } from "@/hooks/useProposals";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProposalCard from "@/components/ProposalCard";
import CreateProposal from "@/components/CreateProposal";
import Results from "@/components/Results";
import Footer from "@/components/Footer";
import ConnectWalletModal from "@/components/ConnectWalletModal";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), { ssr: false });

type Tab = "proposals" | "create" | "results";

const TABS: { key: Tab; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: "proposals", label: "PROPOSALS", icon: <LayoutGrid size={13} />, desc: "Active votes" },
  { key: "create", label: "CREATE", icon: <PlusCircle size={13} />, desc: "New proposal" },
  { key: "results", label: "RESULTS", icon: <BarChart3 size={13} />, desc: "Final counts" },
];

const STATS = [
  { label: "TOTAL PROPOSALS", value: "247", icon: <Activity size={14} />, color: "var(--neon)", change: "+12%" },
  { label: "VOTERS", value: "8,412", icon: <Users size={14} />, color: "var(--neon2)", change: "+5.3%" },
  { label: "VOTES CAST", value: "31,094", icon: <TrendingUp size={14} />, color: "var(--neon3)", change: "+18%" },
  { label: "PASSED", value: "183", icon: <Zap size={14} />, color: "var(--warn)", change: "74.1%" },
];

export default function Home() {
  const { wallet, connect, disconnect, shortAddress } = useWallet();
  const { proposals, myVotes, vote, createProposal } = useProposals();
  const [activeTab, setActiveTab] = useState<Tab>("proposals");
  const [showWalletModal, setShowWalletModal] = useState(false);

  const handleConnect = () => setShowWalletModal(true);
  const handleConnectConfirm = () => {
    connect();
    setShowWalletModal(false);
  };

  const handleCreateProposal = (title: string, description: string) => {
    const ok = createProposal(title, description, wallet.address ?? "0x000", wallet.connected);
    if (ok) setActiveTab("proposals");
    return ok;
  };

  return (
    <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
      <ThreeBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          wallet={wallet}
          shortAddress={shortAddress}
          onConnect={handleConnect}
          onDisconnect={disconnect}
        />

        <div className="flex-1">
          <Hero proposals={proposals} />

          {/* Stats row */}
          <div className="max-w-6xl mx-auto px-4 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STATS.map((stat, i) => (
                <div
                  key={stat.label}
                  className="rounded-xl p-4 animate-fadeInUp"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    animationDelay: `${i * 0.08}s`,
                    transition: "border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease",
                    cursor: "default",
                  }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = stat.color;
                    el.style.boxShadow = `0 4px 24px ${stat.color}22`;
                    el.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "var(--border)";
                    el.style.boxShadow = "none";
                    el.style.transform = "translateY(0)";
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span style={{ color: stat.color }}>{stat.icon}</span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: "0.6rem",
                        color: stat.color,
                        background: `${stat.color}15`,
                      }}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <div
                    className="text-2xl font-extrabold mb-0.5"
                    style={{ color: "var(--text)" }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="text-xs tracking-widest"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.6rem" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 px-4 mb-8">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative flex items-center gap-2 px-5 py-3 rounded-xl text-xs tracking-widest overflow-hidden"
                  style={{
                    fontFamily: "var(--font-mono)",
                    border: isActive ? "1px solid var(--neon2)" : "1px solid var(--border)",
                    color: isActive ? "var(--neon2)" : "var(--muted)",
                    background: isActive ? "rgba(0,212,255,0.09)" : "var(--surface)",
                    boxShadow: isActive ? "0 0 24px rgba(0,212,255,0.15), inset 0 0 12px rgba(0,212,255,0.04)" : "none",
                    transform: isActive ? "translateY(-2px)" : "translateY(0)",
                    transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = "var(--text)";
                      el.style.borderColor = "var(--border2)";
                      el.style.transform = "translateY(-1px)";
                      el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLElement;
                      el.style.color = "var(--muted)";
                      el.style.borderColor = "var(--border)";
                      el.style.transform = "translateY(0)";
                      el.style.boxShadow = "none";
                    }
                  }}
                >
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-xl pointer-events-none"
                      style={{
                        background: "linear-gradient(135deg, rgba(0,212,255,0.06) 0%, rgba(0,245,160,0.03) 100%)",
                      }}
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab content with animated transitions */}
          <div className="max-w-6xl mx-auto px-4 pb-4">
            {activeTab === "proposals" && (
              <div className="animate-scaleIn">
                {proposals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex items-center justify-center animate-float"
                      style={{ background: "rgba(0,245,160,0.06)", border: "1px solid rgba(0,245,160,0.2)" }}
                    >
                      <LayoutGrid size={24} style={{ color: "var(--neon)" }} />
                    </div>
                    <p className="text-sm tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                      NO ACTIVE PROPOSALS
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {proposals.map((p, i) => (
                      <div
                        key={p.id}
                        className="animate-fadeInUp"
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        <ProposalCard
                          proposal={p}
                          myVote={myVotes[p.id]}
                          connected={wallet.connected}
                          onVote={(id, choice) => vote(id, choice, wallet.connected)}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "create" && (
              <div className="animate-scaleIn">
                <CreateProposal onSubmit={handleCreateProposal} connected={wallet.connected} />
              </div>
            )}

            {activeTab === "results" && (
              <div className="animate-scaleIn">
                <Results proposals={proposals} />
              </div>
            )}
          </div>
        </div>

        <Footer />
      </div>

      {showWalletModal && (
        <ConnectWalletModal
          onConnect={handleConnectConfirm}
          onClose={() => setShowWalletModal(false)}
        />
      )}
    </main>
  );
}
