"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { LayoutGrid, PlusCircle, BarChart3 } from "lucide-react";
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

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "proposals", label: "PROPOSALS", icon: <LayoutGrid size={13} /> },
  { key: "create", label: "CREATE", icon: <PlusCircle size={13} /> },
  { key: "results", label: "RESULTS", icon: <BarChart3 size={13} /> },
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

          <div className="flex justify-center gap-2 px-4 mb-8">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs tracking-widest transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-mono)",
                    border: isActive ? "1px solid var(--neon2)" : "1px solid var(--border)",
                    color: isActive ? "var(--neon2)" : "var(--muted)",
                    background: isActive ? "rgba(0,212,255,0.09)" : "var(--surface)",
                    boxShadow: isActive ? "0 0 20px rgba(0,212,255,0.1)" : "none",
                    transform: isActive ? "translateY(-1px)" : "none",
                  }}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="max-w-6xl mx-auto px-4 pb-4">
            {activeTab === "proposals" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fadeInUp">
                {proposals.map((p) => (
                  <ProposalCard
                    key={p.id}
                    proposal={p}
                    myVote={myVotes[p.id]}
                    connected={wallet.connected}
                    onVote={(id, choice) => vote(id, choice, wallet.connected)}
                  />
                ))}
              </div>
            )}

            {activeTab === "create" && (
              <div className="animate-fadeInUp">
                <CreateProposal onSubmit={handleCreateProposal} connected={wallet.connected} />
              </div>
            )}

            {activeTab === "results" && (
              <div className="animate-fadeInUp">
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
