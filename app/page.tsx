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

export default function Home() {
  const { wallet, connect, disconnect, shortAddress, isConnecting, isWrongNetwork, switchToSepolia, discoveredProviders } = useWallet();
  const { proposals, myVotes, vote, createProposal, votingId } = useProposals();
  const [activeTab, setActiveTab] = useState<Tab>("proposals");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState("");

  const handleConnect = () => setShowWalletModal(true);

  // FIX: Modal ditutup SETELAH connect selesai, bukan sebelumnya
  // Ini memastikan user bisa melihat spinner dan approve MetaMask popup
  const handleConnectConfirm = async (walletType: string) => {
    setConnectingWallet(walletType);
    await connect(walletType);
    setShowWalletModal(false);
    setConnectingWallet("");
  };

  const handleCreateProposal = async (title: string, description: string, duration: string) => {
    const ok = await createProposal(title, description, wallet.address ?? "0x000", wallet.connected, duration);
    if (ok) setActiveTab("proposals");
    return ok;
  };

  // FIX: Stats dihitung dari data proposal nyata, bukan hardcoded
  const totalVotes = proposals.reduce((a, p) => a + p.total, 0);
  const activeCount = proposals.filter((p) => p.status === "active").length;
  const endedCount = proposals.filter((p) => p.status === "ended").length;
  const totalYes = proposals.reduce((a, p) => a + p.yes, 0);
  const passRate = totalVotes > 0 ? Math.round((totalYes / totalVotes) * 100) : 0;

  const STATS = [
    { label: "TOTAL PROPOSALS", value: proposals.length.toString(), icon: <Activity size={14} />, color: "var(--neon)", change: `${activeCount} active` },
    { label: "TOTAL VOTES", value: totalVotes.toLocaleString(), icon: <Users size={14} />, color: "var(--neon2)", change: `across ${proposals.length} props` },
    { label: "CONCLUDED", value: endedCount.toString(), icon: <TrendingUp size={14} />, color: "var(--neon3)", change: `${proposals.filter(p => p.status === "pending").length} pending` },
    { label: "PASS RATE", value: `${passRate}%`, icon: <Zap size={14} />, color: "var(--warn)", change: `of votes FOR` },
  ];

  return (
    <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
      <ThreeBackground />

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          wallet={wallet}
          shortAddress={shortAddress}
          onConnect={handleConnect}
          onDisconnect={disconnect}
          isConnecting={isConnecting}
          isWrongNetwork={isWrongNetwork}
          onSwitchNetwork={switchToSepolia}
        />

        <div className="flex-1">
          <Hero proposals={proposals} />

          {/* Stats row */}
          <div className="max-w-6xl mx-auto px-3 sm:px-4 mb-6 sm:mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
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
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: stat.color,
                        background: `${stat.color}12`,
                        fontSize: "0.6rem",
                      }}
                    >
                      {stat.change}
                    </span>
                  </div>
                  <div
                    className="text-xl sm:text-2xl font-bold mb-0.5"
                    style={{ fontFamily: "var(--font-mono)", color: stat.color }}
                  >
                    {stat.value}
                  </div>
                  <div
                    className="tracking-widest"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", fontSize: "0.55rem" }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab bar */}
          <div className="max-w-6xl mx-auto px-3 sm:px-4 mb-5">
            <div className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-xl w-fit" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className="relative px-3 sm:px-5 py-2 rounded-lg text-xs tracking-widest transition-all duration-200"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: isActive ? "var(--neon2)" : "var(--muted)",
                      border: isActive ? "1px solid var(--neon2)" : "1px solid transparent",
                      background: isActive ? "rgba(0,212,255,0.07)" : "transparent",
                      transform: isActive ? "none" : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = "var(--text2)";
                        el.style.borderColor = "var(--border2)";
                        el.style.transform = "translateY(-1px)";
                        el.style.boxShadow = "0 4px 16px rgba(0,0,0,0.2)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.color = "var(--muted)";
                        el.style.borderColor = "transparent";
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
          </div>

          {/* Tab content */}
          <div className="max-w-6xl mx-auto px-3 sm:px-4 pb-4">
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
                          connected={wallet.connected && !isWrongNetwork}
                          onVote={(id, choice) => vote(id, choice, wallet.connected && !isWrongNetwork)}
                          isVoting={votingId === p.id}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "create" && (
              <div className="animate-scaleIn">
                <CreateProposal
                  onSubmit={handleCreateProposal}
                  connected={wallet.connected && !isWrongNetwork}
                />
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
          onClose={() => {
            if (!isConnecting) setShowWalletModal(false);
          }}
          isConnecting={isConnecting}
          connectingWallet={connectingWallet}
          discoveredProviders={discoveredProviders}
        />
      )}
    </main>
  );
}
