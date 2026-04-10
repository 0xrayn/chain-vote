"use client";
import { useProposals } from "@/hooks/useProposals";
import Navbar from "@/components/Navbar";
import Results from "@/components/Results";
import Footer from "@/components/Footer";

export default function ResultsPage() {
  const { proposals } = useProposals();
  return (
    <main className="min-h-screen" style={{ fontFamily: "var(--font-syne)" }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: "var(--text)" }}>
            Results
          </h1>
          <div className="w-10 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--neon), var(--neon2))" }} />
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            Final and ongoing vote tallies for all proposals.
          </p>
        </div>
        <Results proposals={proposals} />
      </div>
      <Footer />
    </main>
  );
}
