"use client";
import { useState } from "react";
import { useProposals } from "@/hooks/useProposals";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import ProposalCard from "@/components/ProposalCard";
import Footer from "@/components/Footer";

const FILTERS = ["all", "active", "pending", "ended"] as const;
type Filter = (typeof FILTERS)[number];

export default function Home() {
  const { proposals, myVotes, vote } = useProposals();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered =
    filter === "all" ? proposals : proposals.filter((p) => p.status === filter);

  return (
    <main className="relative min-h-screen" style={{ fontFamily: "var(--font-syne)" }}>
      <Navbar />
      <Hero proposals={proposals} />

      <div className="max-w-6xl mx-auto px-4 pb-10">
        <div className="flex gap-2 flex-wrap mb-8 justify-center">
          {FILTERS.map((f) => {
            const count = f === "all" ? proposals.length : proposals.filter((p) => p.status === f).length;
            const active = filter === f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="text-xs px-4 py-2.5 rounded-lg tracking-widest transition-all duration-200"
                style={{
                  fontFamily: "var(--font-mono)",
                  border: active ? "1px solid var(--neon2)" : "1px solid var(--border)",
                  color: active ? "var(--neon2)" : "var(--muted)",
                  background: active ? "rgba(0,212,255,0.1)" : "transparent",
                }}
              >
                {f.toUpperCase()} ({count})
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p, i) => (
            <div
              key={p.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <ProposalCard
                proposal={p}
                myVote={myVotes[p.id]}
                onVote={(id, choice) => vote(id, choice)}
              />
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </main>
  );
}
