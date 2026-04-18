"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Search, Filter, SlidersHorizontal } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import { useProposals } from "@/hooks/useProposals";
import Navbar from "@/components/Navbar";
import ProposalCard from "@/components/ProposalCard";
import Footer from "@/components/Footer";
import ConnectWalletModal from "@/components/ConnectWalletModal";
import { ProposalStatus } from "@/types";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), { ssr: false });

const FILTERS: { key: ProposalStatus | "all"; label: string }[] = [
  { key: "all", label: "ALL" },
  { key: "active", label: "ACTIVE" },
  { key: "pending", label: "PENDING" },
  { key: "ended", label: "ENDED" },
];

export default function ExplorePage() {
  const { wallet, connect, disconnect, shortAddress, isConnecting, isWrongNetwork, switchToSepolia, discoveredProviders } = useWallet();
  const { proposals, myVotes, vote, votingId } = useProposals();
  const [filter, setFilter] = useState<ProposalStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState("");

  const filtered = proposals.filter((p) => {
    const matchFilter = filter === "all" || p.status === filter;
    const matchSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

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
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon2)", background: "rgba(0,212,255,0.06)", border: "1px solid rgba(0,212,255,0.2)" }}
            >
              <SlidersHorizontal size={11} />
              EXPLORE PROPOSALS
            </div>
            <h1 className="text-4xl font-extrabold mb-3 gradient-text">All Proposals</h1>
            <p style={{ color: "var(--text2)" }}>Browse and filter all governance proposals on VoteChain.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-8 animate-fadeInUp delay-100">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Search proposals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  fontFamily: "var(--font-syne)",
                  outline: "none",
                }}
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter size={13} style={{ color: "var(--muted)" }} />
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className="px-3 py-2 rounded-lg text-xs tracking-widest transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-mono)",
                    border: filter === f.key ? "1px solid var(--neon2)" : "1px solid var(--border)",
                    color: filter === f.key ? "var(--neon2)" : "var(--muted)",
                    background: filter === f.key ? "rgba(0,212,255,0.08)" : "var(--surface)",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-xs tracking-widest mb-4" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
            {filtered.length} PROPOSAL{filtered.length !== 1 ? "S" : ""} FOUND
          </div>

          {filtered.length === 0 ? (
            <div
              className="text-center py-20 rounded-2xl animate-fadeIn"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <Search size={32} style={{ color: "var(--muted)", margin: "0 auto 12px" }} />
              <p style={{ color: "var(--muted)" }}>No proposals match your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 animate-fadeInUp delay-200">
              {filtered.map((p) => (
                <ProposalCard
                  key={p.id}
                  proposal={p}
                  myVote={myVotes[p.id]}
                  connected={wallet.connected && !isWrongNetwork}
                  onVote={(id, choice) => vote(id, choice, wallet.connected && !isWrongNetwork)}
                  isVoting={votingId === p.id}
                />
              ))}
            </div>
          )}
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
