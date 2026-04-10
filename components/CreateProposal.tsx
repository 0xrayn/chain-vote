"use client";
import { useState } from "react";
import { FileText, Clock, Send } from "lucide-react";

interface CreateProposalProps {
  onSubmit: (title: string, description: string) => boolean;
}

const DURATIONS = ["1 DAY", "3 DAYS", "7 DAYS", "14 DAYS"];

export default function CreateProposal({ onSubmit }: CreateProposalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("3 DAYS");
  const [loading, setLoading] = useState(false);

  const canSubmit = title.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const ok = onSubmit(title, description);
    if (ok) { setTitle(""); setDescription(""); }
    setLoading(false);
  };

  const inputBase: React.CSSProperties = {
    width: "100%",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    padding: "10px 14px",
    color: "var(--text)",
    fontFamily: "var(--font-syne)",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in-up">
      <div
        className="rounded-2xl p-8"
        style={{ background: "var(--card)", border: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-3 mb-7">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "rgba(0,212,255,0.1)",
              border: "1px solid rgba(0,212,255,0.25)",
            }}
          >
            <Send size={16} style={{ color: "var(--neon2)" }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text)" }}>
              New Proposal
            </h2>
            <p className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>
              Submit on-chain governance proposal
            </p>
          </div>
        </div>

        <div className="mb-5">
          <label
            className="flex items-center gap-2 text-xs tracking-widest mb-2 uppercase"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            <FileText size={11} /> Proposal Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Upgrade Protocol v2.5"
            style={inputBase}
            onFocus={(e) => (e.target.style.borderColor = "var(--neon2)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        <div className="mb-5">
          <label
            className="flex items-center gap-2 text-xs tracking-widest mb-2 uppercase"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            <FileText size={11} /> Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your proposal in detail..."
            rows={5}
            style={{ ...inputBase, resize: "vertical" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--neon2)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>

        <div className="mb-7">
          <label
            className="flex items-center gap-2 text-xs tracking-widest mb-3 uppercase"
            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
          >
            <Clock size={11} /> Voting Duration
          </label>
          <div className="flex gap-2 flex-wrap">
            {DURATIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className="text-xs px-4 py-2 rounded-lg transition-all duration-200"
                style={{
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.08em",
                  border: duration === d
                    ? "1px solid var(--neon2)"
                    : "1px solid var(--border)",
                  color: duration === d ? "var(--neon2)" : "var(--muted)",
                  background: duration === d
                    ? "rgba(0,212,255,0.1)"
                    : "transparent",
                }}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit || loading}
          className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm tracking-widest uppercase transition-all duration-300"
          style={{
            fontFamily: "var(--font-mono)",
            border: canSubmit
              ? "1px solid rgba(0,245,160,0.45)"
              : "1px solid var(--border)",
            color: canSubmit ? "var(--neon)" : "var(--muted)",
            background: canSubmit
              ? "rgba(0,245,160,0.06)"
              : "rgba(74,127,160,0.04)",
            cursor: canSubmit && !loading ? "pointer" : "not-allowed",
            opacity: loading ? 0.75 : 1,
          }}
          onMouseEnter={(e) => {
            if (canSubmit && !loading) {
              e.currentTarget.style.background = "rgba(0,245,160,0.12)";
              e.currentTarget.style.boxShadow = "0 0 28px rgba(0,245,160,0.18)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = canSubmit
              ? "rgba(0,245,160,0.06)"
              : "rgba(74,127,160,0.04)";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 rounded-full animate-spin-slow"
                style={{ border: "2px solid rgba(0,245,160,0.3)", borderTopColor: "var(--neon)" }} />
              DEPLOYING TO SEPOLIA...
            </>
          ) : (
            <>
              <Send size={14} />
              {canSubmit ? "DEPLOY PROPOSAL" : "FILL IN FIELDS FIRST"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
