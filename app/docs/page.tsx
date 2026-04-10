"use client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BookOpen, ChevronRight } from "lucide-react";
import { useState } from "react";

const DOCS = [
  {
    title: "What is VoteChain?",
    content:
      "VoteChain is a decentralized governance protocol built on Ethereum Sepolia. It enables token holders to create proposals, cast votes, and collectively shape the protocol's future through transparent, immutable on-chain voting. Every action is recorded permanently on the blockchain.",
  },
  {
    title: "How Voting Works",
    content:
      "Each proposal has three vote options: FOR, AGAINST, and ABSTAIN. Votes are recorded on-chain and cannot be changed once cast. A quorum must be reached for a proposal to be valid. Active proposals have a defined end time after which no new votes are accepted.",
  },
  {
    title: "Creating Proposals",
    content:
      "Any participant can submit a governance proposal. Proposals require a clear title and detailed description. You can select a voting duration from 1 to 14 days. Once deployed, the proposal enters a pending state before voting begins.",
  },
  {
    title: "Quorum Requirements",
    content:
      "Each proposal has a minimum quorum threshold — the minimum number of votes required for the result to be binding. If quorum is not reached by the end of the voting period, the proposal is considered invalid regardless of the FOR/AGAINST ratio.",
  },
  {
    title: "Proposal Lifecycle",
    content:
      "Proposals go through three stages: PENDING (not yet started), ACTIVE (voting open), and ENDED (voting closed). Results are finalized at the end of the voting period based on the majority of votes cast among those who participated.",
  },
  {
    title: "Security & Transparency",
    content:
      "All votes and proposals are stored immutably on the Ethereum Sepolia blockchain. Smart contract code is open source and auditable by anyone. No central party can alter votes, delete proposals, or interfere with the governance process.",
  },
];

function DocCard({ item, index }: { item: (typeof DOCS)[0]; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl overflow-hidden animate-fade-in-up"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        animationDelay: `${index * 60}ms`,
      }}
    >
      <button
        className="w-full flex items-center justify-between px-6 py-5 text-left transition-all duration-200"
        style={{ background: "transparent" }}
        onClick={() => setOpen((o) => !o)}
        onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,212,255,0.04)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
      >
        <div className="flex items-center gap-3">
          <BookOpen size={15} style={{ color: "var(--neon2)", flexShrink: 0 }} />
          <span className="font-bold text-base" style={{ color: "var(--text)" }}>
            {item.title}
          </span>
        </div>
        <ChevronRight
          size={16}
          style={{
            color: "var(--muted)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.25s ease",
            flexShrink: 0,
          }}
        />
      </button>
      {open && (
        <div
          className="px-6 pb-5 animate-fade-in"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          <p className="pt-4 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {item.content}
          </p>
        </div>
      )}
    </div>
  );
}

export default function DocsPage() {
  return (
    <main className="min-h-screen" style={{ fontFamily: "var(--font-syne)" }}>
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: "var(--text)" }}>
            Docs
          </h1>
          <div className="w-10 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--neon), var(--neon2))" }} />
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            Learn how VoteChain governance works.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          {DOCS.map((d, i) => (
            <DocCard key={i} item={d} index={i} />
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
