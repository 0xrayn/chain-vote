"use client";
import { useProposals } from "@/hooks/useProposals";
import Navbar from "@/components/Navbar";
import CreateProposal from "@/components/CreateProposal";
import Footer from "@/components/Footer";

export default function CreatePage() {
  const { createProposal } = useProposals();
  return (
    <main className="min-h-screen" style={{ fontFamily: "var(--font-syne)" }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: "var(--text)" }}>
            Create
          </h1>
          <div className="w-10 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--neon), var(--neon2))" }} />
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            Submit a new governance proposal to the protocol.
          </p>
        </div>
        <CreateProposal onSubmit={createProposal} />
      </div>
      <Footer />
    </main>
  );
}
