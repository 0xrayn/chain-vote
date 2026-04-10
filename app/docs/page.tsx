"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { BookOpen, Code2, Shield, Zap, ChevronRight, ExternalLink, Terminal, Copy, Check } from "lucide-react";
import { useWallet } from "@/hooks/useWallet";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ConnectWalletModal from "@/components/ConnectWalletModal";

const ThreeBackground = dynamic(() => import("@/components/ThreeBackground"), { ssr: false });

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl overflow-hidden mt-3" style={{ background: "var(--bg)", border: "1px solid var(--border2)" }}>
      <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <Terminal size={12} style={{ color: "var(--neon2)" }} />
          <span className="text-xs tracking-widest" style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>SOLIDITY</span>
        </div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs transition-colors duration-200 hover:text-[var(--neon)]" style={{ color: "var(--muted)" }}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "COPIED" : "COPY"}
        </button>
      </div>
      <pre className="p-4 text-xs overflow-x-auto" style={{ fontFamily: "var(--font-mono)", color: "var(--neon2)", lineHeight: 1.7 }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

const SECTIONS = [
  { id: "overview", label: "Overview", icon: <BookOpen size={13} /> },
  { id: "contracts", label: "Contracts", icon: <Code2 size={13} /> },
  { id: "api", label: "SDK & API", icon: <Terminal size={13} /> },
  { id: "security", label: "Security", icon: <Shield size={13} /> },
];

export default function DocsPage() {
  const { wallet, connect, disconnect, shortAddress } = useWallet();
  const [activeSection, setActiveSection] = useState("overview");
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
      <ThreeBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar wallet={wallet} shortAddress={shortAddress} onConnect={() => setShowWalletModal(true)} onDisconnect={disconnect} />

        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
          <div className="mb-10 animate-fadeInUp">
            <div className="inline-flex items-center gap-2 text-xs tracking-widest mb-4 px-3 py-1.5 rounded-full"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon)", background: "rgba(0,245,160,0.06)", border: "1px solid rgba(0,245,160,0.2)" }}>
              <BookOpen size={11} />
              DOCUMENTATION
            </div>
            <h1 className="text-4xl font-extrabold mb-3 gradient-text">Developer Docs</h1>
            <p style={{ color: "var(--text2)" }}>Everything you need to build with VoteChain.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-56 flex-shrink-0">
              <div className="sticky top-24 rounded-2xl p-3" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                {SECTIONS.map((s) => (
                  <button key={s.id} onClick={() => setActiveSection(s.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 mb-1"
                    style={{
                      background: activeSection === s.id ? "rgba(0,212,255,0.09)" : "transparent",
                      color: activeSection === s.id ? "var(--neon2)" : "var(--text2)",
                      border: activeSection === s.id ? "1px solid rgba(0,212,255,0.2)" : "1px solid transparent",
                    }}>
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>
            </aside>

            <div className="flex-1 min-w-0 animate-fadeInUp delay-100">
              {activeSection === "overview" && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>What is VoteChain?</h2>
                    <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text2)" }}>
                      VoteChain is a decentralized governance protocol deployed on Ethereum Sepolia testnet. It enables DAOs and protocols to run on-chain proposals with cryptographically verifiable voting.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { icon: <Shield size={14} />, t: "Trustless", d: "No central authority", c: "var(--neon)" },
                        { icon: <Zap size={14} />, t: "Fast", d: "~12s finality", c: "var(--neon2)" },
                        { icon: <BookOpen size={14} />, t: "Open Source", d: "MIT Licensed", c: "var(--neon3)" },
                      ].map((item) => (
                        <div key={item.t} className="p-4 rounded-xl" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                          <div className="mb-2" style={{ color: item.c }}>{item.icon}</div>
                          <div className="text-sm font-bold mb-0.5" style={{ color: "var(--text)" }}>{item.t}</div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>{item.d}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <h2 className="text-xl font-bold mb-3" style={{ color: "var(--text)" }}>Quick Start</h2>
                    <p className="text-sm mb-2" style={{ color: "var(--text2)" }}>Install the VoteChain SDK via npm:</p>
                    <CodeBlock code={`npm install @votechain/sdk ethers\n\n# or using yarn\nyarn add @votechain/sdk ethers`} />
                  </div>
                </div>
              )}

              {activeSection === "contracts" && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Smart Contracts</h2>
                    {[
                      { name: "VoteChainGovernor", addr: "0x1a2b3c4d5e6f...7890", desc: "Main governance contract. Manages proposals, votes, and execution." },
                      { name: "VoteToken", addr: "0xabcdef012345...6789", desc: "ERC-20 voting token with delegation support." },
                      { name: "TimeLock", addr: "0x9876543210ab...cdef", desc: "2-day timelock for executed proposals." },
                    ].map((c) => (
                      <div key={c.name} className="mb-4 pb-4" style={{ borderBottom: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between mb-1 flex-wrap gap-2">
                          <span className="text-sm font-bold" style={{ color: "var(--neon2)" }}>{c.name}</span>
                          <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs transition-colors duration-200"
                            style={{ fontFamily: "var(--font-mono)", color: "var(--muted)", textDecoration: "none" }}>
                            {c.addr} <ExternalLink size={10} />
                          </a>
                        </div>
                        <p className="text-xs" style={{ color: "var(--text2)" }}>{c.desc}</p>
                      </div>
                    ))}
                    <CodeBlock code={`// SPDX-License-Identifier: MIT\npragma solidity ^0.8.20;\n\ninterface IVoteChainGovernor {\n    function propose(\n        address[] memory targets,\n        uint256[] memory values,\n        bytes[] memory calldatas,\n        string memory description\n    ) external returns (uint256 proposalId);\n\n    function castVote(\n        uint256 proposalId,\n        uint8 support  // 0=against, 1=for, 2=abstain\n    ) external returns (uint256 balance);\n\n    function state(\n        uint256 proposalId\n    ) external view returns (ProposalState);\n}`} />
                  </div>
                </div>
              )}

              {activeSection === "api" && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>SDK Usage</h2>
                    <p className="text-sm mb-2" style={{ color: "var(--text2)" }}>Connect and fetch proposals:</p>
                    <CodeBlock code={`import { VoteChain } from "@votechain/sdk";\nimport { ethers } from "ethers";\n\nconst provider = new ethers.BrowserProvider(window.ethereum);\nconst signer = await provider.getSigner();\n\nconst vc = new VoteChain({\n  provider,\n  signer,\n  network: "sepolia",\n});\n\nconst proposals = await vc.getProposals();\nconst result = await vc.castVote(proposalId, 1);`} />
                  </div>
                  <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>REST API</h2>
                    {[
                      { method: "GET", path: "/api/proposals", desc: "List all proposals" },
                      { method: "GET", path: "/api/proposals/:id", desc: "Get single proposal" },
                      { method: "POST", path: "/api/proposals", desc: "Create a new proposal" },
                      { method: "POST", path: "/api/vote", desc: "Submit a vote (requires signature)" },
                    ].map((ep) => (
                      <div key={ep.path} className="flex items-center gap-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                        <span className="text-xs px-2 py-0.5 rounded font-bold w-14 text-center"
                          style={{ fontFamily: "var(--font-mono)", background: ep.method === "GET" ? "rgba(0,212,255,0.1)" : "rgba(0,245,160,0.1)", color: ep.method === "GET" ? "var(--neon2)" : "var(--neon)" }}>
                          {ep.method}
                        </span>
                        <code className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>{ep.path}</code>
                        <span className="text-xs ml-auto" style={{ color: "var(--muted)" }}>{ep.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeSection === "security" && (
                <div className="flex flex-col gap-5">
                  <div className="rounded-2xl p-6" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                    <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Security Model</h2>
                    {[
                      { title: "Audited Contracts", desc: "VoteChain contracts have been reviewed by Trail of Bits and Consensys Diligence. All findings have been remediated.", icon: <Shield size={15} />, color: "var(--neon)" },
                      { title: "Timelock Protection", desc: "All successful proposals are subject to a 48-hour timelock before execution, allowing the community to react to malicious proposals.", icon: <Zap size={15} />, color: "var(--neon2)" },
                      { title: "Vote Delegation", desc: "Token holders can delegate their voting power without transferring tokens, using EIP-712 signed messages.", icon: <Code2 size={15} />, color: "var(--neon3)" },
                    ].map((item) => (
                      <div key={item.title} className="flex gap-4 p-5 rounded-xl mb-3" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${item.color}12`, border: `1px solid ${item.color}25` }}>
                          <span style={{ color: item.color }}>{item.icon}</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold mb-1" style={{ color: "var(--text)" }}>{item.title}</div>
                          <p className="text-xs leading-relaxed" style={{ color: "var(--text2)" }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-5 rounded-2xl flex items-start gap-3" style={{ background: "rgba(255,71,87,0.05)", border: "1px solid rgba(255,71,87,0.2)" }}>
                    <ChevronRight size={14} style={{ color: "var(--danger)", marginTop: 2, flexShrink: 0 }} />
                    <p className="text-sm" style={{ color: "var(--text2)" }}>
                      Found a vulnerability? Email <span style={{ color: "var(--neon2)" }}>security@votechain.io</span> — we offer up to $50,000 in bug bounties.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {showWalletModal && (
        <ConnectWalletModal onConnect={() => { connect(); setShowWalletModal(false); }} onClose={() => setShowWalletModal(false)} />
      )}
    </main>
  );
}
