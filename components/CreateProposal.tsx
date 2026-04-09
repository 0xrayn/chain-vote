"use client";
import { useState } from "react";
import { PlusCircle, FileText, Clock, Send } from "lucide-react";

interface CreateProposalProps {
  onSubmit: (title: string, description: string) => boolean;
  connected: boolean;
}

const DURATIONS = ["1 DAY", "3 DAYS", "7 DAYS", "14 DAYS"];

export default function CreateProposal({ onSubmit, connected }: CreateProposalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("3 DAYS");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // simulate tx
    const ok = onSubmit(title, description);
    if (ok) {
      setTitle("");
      setDescription("");
    }
    setLoading(false);
  };

  const inputStyle = {
    width: "100%",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "10px 14px",
    color: "var(--text)",
    fontFamily: "var(--font-syne)",
    fontSize: "0.9rem",
    outline: "none",
    transition: "border-color 0.2s",
  };

  return (
    <div
      className="max-w-2xl mx-auto rounded-xl p-8"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-8 h-8 rounded flex items-center justify-center"
          style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}
        >
          <PlusCircle size={16} style={{ color: "var(--neon2)" }} />
        </div>
        <h2
          className="text-xl font-bold tracking-wide"
          style={{ color: "var(--neon2)" }}
        >
          // New Proposal
        </h2>
      </div>

      {/* Title */}
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
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = "var(--neon2)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Description */}
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
          style={{ ...inputStyle, resize: "vertical" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--neon2)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
        />
      </div>

      {/* Duration */}
      <div className="mb-6">
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
              className="text-xs px-4 py-2 rounded transition-all duration-200"
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                border: duration === d ? "1px solid var(--neon2)" : "1px solid var(--border)",
                color: duration === d ? "var(--neon2)" : "var(--muted)",
                background: duration === d ? "rgba(0,212,255,0.08)" : "transparent",
              }}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={!connected || loading}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-lg text-sm tracking-widest uppercase transition-all duration-300"
        style={{
          fontFamily: "var(--font-mono)",
          border: "1px solid var(--neon)",
          color: connected ? "var(--neon)" : "var(--muted)",
          background: connected ? "rgba(0,245,160,0.05)" : "rgba(74,122,155,0.05)",
          cursor: connected ? "pointer" : "not-allowed",
          boxShadow: connected ? "0 0 0 rgba(0,245,160,0)" : "none",
          opacity: loading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => {
          if (connected && !loading) {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 25px rgba(0,245,160,0.2)";
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(0,245,160,0.1)";
          }
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.boxShadow = "none";
          (e.currentTarget as HTMLButtonElement).style.background = connected
            ? "rgba(0,245,160,0.05)"
            : "rgba(74,122,155,0.05)";
        }}
      >
        {loading ? (
          <>
            <div
              className="w-4 h-4 rounded-full border-t-transparent animate-spin"
              style={{ border: "2px solid var(--neon)", borderTopColor: "transparent" }}
            />
            DEPLOYING TO SEPOLIA...
          </>
        ) : (
          <>
            <Send size={14} />
            {connected ? "DEPLOY PROPOSAL →" : "CONNECT WALLET TO DEPLOY"}
          </>
        )}
      </button>
    </div>
  );
}
