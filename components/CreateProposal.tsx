"use client";
import { useState } from "react";
import { PlusCircle, FileText, Clock, Send, Lock } from "lucide-react";

interface CreateProposalProps {
  onSubmit: (title: string, description: string) => boolean;
  connected: boolean;
}

const DURATIONS = ["1 DAY", "3 DAYS", "7 DAYS", "14 DAYS"];

const inputStyle = {
  width: "100%",
  background: "var(--surface2)",
  border: "1px solid var(--border2)",
  borderRadius: "10px",
  padding: "12px 16px",
  color: "var(--text)",
  fontFamily: "inherit",
  fontSize: "0.9rem",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
} as React.CSSProperties;

export default function CreateProposal({ onSubmit, connected }: CreateProposalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("3 DAYS");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!connected || loading || !title.trim()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));
    const ok = onSubmit(title, description);
    if (ok) {
      setTitle("");
      setDescription("");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <div
          className="px-8 py-6 flex items-center gap-3"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(0,212,255,0.1)", border: "1px solid rgba(0,212,255,0.25)" }}
          >
            <PlusCircle size={16} style={{ color: "var(--neon2)" }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text)" }}>New Proposal</h2>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Deploy a governance proposal to Sepolia</p>
          </div>
        </div>

        <div className="px-8 py-6 flex flex-col gap-5">
          <div>
            <label
              className="flex items-center gap-2 text-xs tracking-widest mb-2.5 uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
            >
              <FileText size={10} /> Proposal Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Upgrade Protocol to v2.5"
              style={inputStyle}
              disabled={!connected}
            />
          </div>

          <div>
            <label
              className="flex items-center gap-2 text-xs tracking-widest mb-2.5 uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
            >
              <FileText size={10} /> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal in detail. Include motivation, implementation details, and expected impact..."
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
              disabled={!connected}
            />
          </div>

          <div>
            <label
              className="flex items-center gap-2 text-xs tracking-widest mb-3 uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
            >
              <Clock size={10} /> Voting Duration
            </label>
            <div className="flex gap-2 flex-wrap">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => connected && setDuration(d)}
                  className="text-xs px-4 py-2 rounded-lg transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    border: duration === d ? "1px solid var(--neon2)" : "1px solid var(--border2)",
                    color: duration === d ? "var(--neon2)" : "var(--muted)",
                    background: duration === d ? "rgba(0,212,255,0.08)" : "var(--surface2)",
                    cursor: connected ? "pointer" : "not-allowed",
                    opacity: connected ? 1 : 0.5,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!connected || loading || !title.trim()}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm tracking-widest uppercase transition-all duration-300"
            style={{
              fontFamily: "var(--font-mono)",
              border: "1px solid var(--neon)",
              color: connected ? "var(--neon)" : "var(--muted)",
              background: connected ? "rgba(0,245,160,0.05)" : "rgba(74,122,155,0.05)",
              cursor: connected && !loading ? "pointer" : "not-allowed",
              opacity: loading || (!connected) ? 0.65 : 1,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget;
              if (connected && !loading && title.trim()) {
                el.style.boxShadow = "0 0 30px rgba(0,245,160,0.2)";
                el.style.background = "rgba(0,245,160,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget;
              el.style.boxShadow = "none";
              el.style.background = connected ? "rgba(0,245,160,0.05)" : "rgba(74,122,155,0.05)";
            }}
          >
            {loading ? (
              <>
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin-slow"
                  style={{ borderColor: "var(--neon)", borderTopColor: "transparent" }}
                />
                DEPLOYING TO SEPOLIA...
              </>
            ) : !connected ? (
              <>
                <Lock size={13} />
                CONNECT WALLET TO DEPLOY
              </>
            ) : (
              <>
                <Send size={13} />
                DEPLOY PROPOSAL
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
