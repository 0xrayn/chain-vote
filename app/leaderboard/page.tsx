"use client";
import { useProposals } from "@/hooks/useProposals";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Trophy, TrendingUp, Users, BarChart3 } from "lucide-react";

function pct(v: number, t: number) {
  return t === 0 ? 0 : Math.round((v / t) * 100);
}

export default function LeaderboardPage() {
  const { proposals } = useProposals();

  const sorted = [...proposals].filter((p) => p.total > 0).sort((a, b) => b.total - a.total);
  const totalVotes = proposals.reduce((a, p) => a + p.total, 0);
  const activeCount = proposals.filter((p) => p.status === "active").length;
  const withVotes = proposals.filter((p) => p.total > 0);
  const avgVotes = withVotes.length
    ? Math.round(withVotes.reduce((a, p) => a + p.total, 0) / withVotes.length)
    : 0;

  const statCards = [
    { label: "TOTAL PROPOSALS", value: proposals.length, icon: <BarChart3 size={16} />, color: "var(--neon2)" },
    { label: "ACTIVE NOW",      value: activeCount,       icon: <TrendingUp size={16} />, color: "var(--neon)" },
    { label: "TOTAL VOTES",     value: totalVotes.toLocaleString(), icon: <Users size={16} />, color: "var(--warn)" },
    { label: "AVG VOTES",       value: avgVotes,          icon: <Trophy size={16} />, color: "var(--muted)" },
  ];

  const rankColors = [
    { color: "var(--neon)",  bg: "rgba(0,245,160,0.15)" },
    { color: "var(--neon2)", bg: "rgba(0,212,255,0.15)" },
    { color: "var(--warn)",  bg: "rgba(255,165,2,0.15)" },
  ];

  return (
    <main className="min-h-screen" style={{ fontFamily: "var(--font-syne)" }}>
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-3xl font-extrabold mb-1" style={{ color: "var(--text)" }}>
            Stats
          </h1>
          <div className="w-10 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, var(--neon), var(--neon2))" }} />
          <p className="mt-3 text-sm" style={{ color: "var(--muted)" }}>
            Governance leaderboard and protocol-wide statistics.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <div
              key={s.label}
              className="rounded-2xl p-5 animate-fade-in-up"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                animationDelay: `${i * 60}ms`,
              }}
            >
              <div className="flex items-center gap-2 mb-3" style={{ color: s.color }}>
                {s.icon}
                <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                  {s.label}
                </span>
              </div>
              <div className="text-2xl font-bold" style={{ fontFamily: "var(--font-mono)", color: s.color }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <div
          className="rounded-2xl p-6 animate-fade-in-up"
          style={{ background: "var(--card)", border: "1px solid var(--border)", animationDelay: "240ms" }}
        >
          <div className="flex items-center gap-2 mb-6">
            <Trophy size={18} style={{ color: "var(--neon)" }} />
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>Most Voted Proposals</h2>
          </div>

          {sorted.length === 0 && (
            <p className="text-sm" style={{ color: "var(--muted)" }}>No votes have been cast yet.</p>
          )}

          {sorted.map((p, i) => {
            const rc = rankColors[i] ?? { color: "var(--muted)", bg: "rgba(74,127,160,0.1)" };
            return (
              <div
                key={p.id}
                className="flex items-center gap-4 py-4 transition-all duration-200"
                style={{ borderBottom: i < sorted.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: rc.color,
                    background: rc.bg,
                  }}
                >
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate mb-1" style={{ color: "var(--text)" }}>
                    {p.title}
                  </p>
                  <div className="flex gap-4">
                    <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--neon)" }}>
                      FOR {pct(p.yes, p.total)}%
                    </span>
                    <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--danger)" }}>
                      AGAINST {pct(p.no, p.total)}%
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>
                    {p.total.toLocaleString()}
                  </div>
                  <div className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
                    VOTES
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Footer />
    </main>
  );
}
