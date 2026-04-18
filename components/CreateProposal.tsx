"use client";
import { useState } from "react";
import { PlusCircle, FileText, Clock, Send, Lock, AlertCircle } from "lucide-react";

interface CreateProposalProps {
  onSubmit: (title: string, description: string, duration: string) => Promise<boolean> | boolean;
  connected: boolean;
}

const DURATIONS = ["1 DAY", "3 DAYS", "7 DAYS", "14 DAYS"];

const MIN_TITLE_LEN = 10;
const MIN_DESC_LEN = 20;

export default function CreateProposal({ onSubmit, connected }: CreateProposalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("3 DAYS");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ title: false, description: false });

  const titleError = title.trim().length > 0 && title.trim().length < MIN_TITLE_LEN
    ? `At least ${MIN_TITLE_LEN} characters required.`
    : "";
  const descError = description.trim().length > 0 && description.trim().length < MIN_DESC_LEN
    ? `At least ${MIN_DESC_LEN} characters required.`
    : "";
  const canSubmit = connected && !loading && title.trim().length >= MIN_TITLE_LEN && description.trim().length >= MIN_DESC_LEN;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const ok = await onSubmit(title, description, duration);
      if (ok) {
        setTitle("");
        setDescription("");
        setDuration("3 DAYS");
        setTouched({ title: false, description: false });
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase: React.CSSProperties = {
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
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        {/* Header */}
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
          {/* Title field */}
          <div>
            <label
              className="flex items-center gap-2 text-xs tracking-widest mb-2.5 uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
            >
              <FileText size={10} /> Proposal Title
              <span style={{ color: "var(--danger)", fontSize: "0.65rem" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, title: true }))}
              placeholder="e.g. Upgrade Protocol to v2.5"
              style={{
                ...inputBase,
                borderColor: touched.title && titleError ? "var(--danger)" : "var(--border2)",
              }}
              disabled={!connected || loading}
              maxLength={200}
            />
            <div className="flex items-center justify-between mt-1.5">
              {touched.title && titleError ? (
                <div className="flex items-center gap-1">
                  <AlertCircle size={10} style={{ color: "var(--danger)" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--danger)" }}>
                    {titleError}
                  </span>
                </div>
              ) : <span />}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--muted)" }}>
                {title.length}/200
              </span>
            </div>
          </div>

          {/* Description field */}
          <div>
            <label
              className="flex items-center gap-2 text-xs tracking-widest mb-2.5 uppercase"
              style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}
            >
              <FileText size={10} /> Description
              <span style={{ color: "var(--danger)", fontSize: "0.65rem" }}>*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, description: true }))}
              placeholder="Describe your proposal in detail. Include motivation, implementation details, and expected impact..."
              rows={5}
              style={{
                ...inputBase,
                resize: "vertical",
                borderColor: touched.description && descError ? "var(--danger)" : "var(--border2)",
              }}
              disabled={!connected || loading}
              maxLength={2000}
            />
            <div className="flex items-center justify-between mt-1.5">
              {touched.description && descError ? (
                <div className="flex items-center gap-1">
                  <AlertCircle size={10} style={{ color: "var(--danger)" }} />
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.65rem", color: "var(--danger)" }}>
                    {descError}
                  </span>
                </div>
              ) : <span />}
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.6rem", color: "var(--muted)" }}>
                {description.length}/2000
              </span>
            </div>
          </div>

          {/* Duration picker */}
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
                  type="button"
                  onClick={() => connected && !loading && setDuration(d)}
                  className="text-xs px-4 py-2 rounded-lg transition-all duration-200"
                  style={{
                    fontFamily: "var(--font-mono)",
                    letterSpacing: "0.08em",
                    border: duration === d ? "1px solid var(--neon2)" : "1px solid var(--border2)",
                    color: duration === d ? "var(--neon2)" : "var(--muted)",
                    background: duration === d ? "rgba(0,212,255,0.08)" : "var(--surface2)",
                    cursor: connected && !loading ? "pointer" : "not-allowed",
                    opacity: connected && !loading ? 1 : 0.5,
                  }}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm tracking-widest uppercase transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              fontFamily: "var(--font-mono)",
              border: "1px solid var(--neon)",
              color: canSubmit ? "var(--neon)" : "var(--muted)",
              background: canSubmit ? "rgba(0,245,160,0.05)" : "rgba(74,122,155,0.05)",
              cursor: canSubmit ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => {
              if (canSubmit) {
                (e.currentTarget as HTMLElement).style.boxShadow = "0 0 30px rgba(0,245,160,0.2)";
                (e.currentTarget as HTMLElement).style.background = "rgba(0,245,160,0.1)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
              (e.currentTarget as HTMLElement).style.background = canSubmit
                ? "rgba(0,245,160,0.05)"
                : "rgba(74,122,155,0.05)";
            }}
          >
            {loading ? (
              <>
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
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
