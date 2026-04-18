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
        <button onClick={copy} className="flex items-center gap-1.5 text-xs transition-colors duration-200" style={{ color: "var(--muted)" }}>
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

const CONTRACT_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract VoteChain {
    struct Proposal {
        string title;
        string description;
        uint256 yesVotes;
        uint256 noVotes;
        uint256 abstainVotes;
        uint256 deadline;
        address creator;
        bool exists;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;
    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed id, address creator, string title);
    event VoteCast(uint256 indexed proposalId, address voter, uint8 choice);

    function createProposal(
        string calldata title,
        string calldata description,
        uint256 durationDays
    ) external returns (uint256) {
        uint256 id = ++proposalCount;
        proposals[id] = Proposal({
            title: title,
            description: description,
            yesVotes: 0,
            noVotes: 0,
            abstainVotes: 0,
            deadline: block.timestamp + (durationDays * 1 days),
            creator: msg.sender,
            exists: true
        });
        emit ProposalCreated(id, msg.sender, title);
        return id;
    }

    function vote(uint256 proposalId, uint8 choice) external {
        Proposal storage p = proposals[proposalId];
        require(p.exists, "Proposal not found");
        require(block.timestamp < p.deadline, "Voting ended");
        require(!hasVoted[proposalId][msg.sender], "Already voted");
        require(choice <= 2, "Invalid choice");

        hasVoted[proposalId][msg.sender] = true;
        if (choice == 0) p.yesVotes++;
        else if (choice == 1) p.noVotes++;
        else p.abstainVotes++;

        emit VoteCast(proposalId, msg.sender, choice);
    }

    function getResults(uint256 proposalId)
        external view returns (uint256 yes, uint256 no, uint256 abstain)
    {
        Proposal storage p = proposals[proposalId];
        require(p.exists, "Proposal not found");
        return (p.yesVotes, p.noVotes, p.abstainVotes);
    }
}`;

const SDK_CODE = `import { ethers } from "ethers";
import { VOTING_ABI, CONTRACT_ADDRESS } from "./constants";

// Connect to contract
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const contract = new ethers.Contract(CONTRACT_ADDRESS, VOTING_ABI, signer);

// Create a proposal
const tx = await contract.createProposal(
  "My Proposal Title",
  "Detailed description here...",
  7 // duration in days
);
await tx.wait();

// Cast a vote (0=YES, 1=NO, 2=ABSTAIN)
const voteTx = await contract.vote(proposalId, 0);
await voteTx.wait();

// Get results
const [yes, no, abstain] = await contract.getResults(proposalId);`;

export default function DocsPage() {
  const { wallet, connect, disconnect, shortAddress, isConnecting, isWrongNetwork, switchToSepolia, discoveredProviders } = useWallet();
  const [activeSection, setActiveSection] = useState("overview");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState("");

  const handleConnectConfirm = async (walletType: string) => {
    setConnectingWallet(walletType);
    try {
      await connect(walletType);
    } finally {
      setShowWalletModal(false);
      setConnectingWallet("");
    }
  };

  return (
    <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
      <ThreeBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar
          wallet={wallet}
          shortAddress={shortAddress}
          onConnect={() => setShowWalletModal(true)}
          onDisconnect={disconnect}
          isConnecting={isConnecting}
          isWrongNetwork={isWrongNetwork}
          onSwitchNetwork={switchToSepolia}
        />

        <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-12">
          <div className="mb-10 animate-fadeInUp">
            <div
              className="inline-flex items-center gap-2 text-xs tracking-widest mb-4 px-3 py-1.5 rounded-full"
              style={{ fontFamily: "var(--font-mono)", color: "var(--neon)", background: "rgba(0,245,160,0.06)", border: "1px solid rgba(0,245,160,0.2)" }}
            >
              <BookOpen size={11} />
              DOCUMENTATION
            </div>
            <h1 className="text-4xl font-extrabold mb-3 gradient-text">Docs</h1>
            <p style={{ color: "var(--text2)" }}>Learn how to integrate VoteChain into your project.</p>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Sidebar */}
            <div className="lg:w-48 flex-shrink-0">
              <div className="flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
                {SECTIONS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSection(s.id)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-left transition-all duration-200 whitespace-nowrap"
                    style={{
                      background: activeSection === s.id ? "rgba(0,245,160,0.07)" : "transparent",
                      border: activeSection === s.id ? "1px solid rgba(0,245,160,0.25)" : "1px solid transparent",
                      color: activeSection === s.id ? "var(--neon)" : "var(--muted)",
                    }}
                  >
                    {s.icon}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {activeSection === "overview" && (
                <div className="rounded-2xl p-6 animate-fadeIn" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Overview</h2>
                  <p className="text-sm leading-relaxed mb-4" style={{ color: "var(--text2)" }}>
                    VoteChain is a decentralized governance platform built on Ethereum Sepolia testnet. It allows communities to create proposals, cast votes, and view results — all on-chain.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6">
                    {[
                      { icon: <Zap size={14} />, title: "Fast", desc: "Instant proposal creation and voting" },
                      { icon: <Shield size={14} />, title: "Secure", desc: "All votes verified on Sepolia" },
                      { icon: <Code2 size={14} />, title: "Open", desc: "Fully open-source smart contracts" },
                      { icon: <ExternalLink size={14} />, title: "Transparent", desc: "All data publicly verifiable" },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        <span style={{ color: "var(--neon)", marginTop: "2px" }}>{item.icon}</span>
                        <div>
                          <div className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{item.title}</div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(0,245,160,0.04)", border: "1px solid rgba(0,245,160,0.15)" }}>
                    <ChevronRight size={14} style={{ color: "var(--neon)", flexShrink: 0 }} />
                    <p className="text-xs" style={{ color: "var(--text2)" }}>
                      Need Sepolia ETH to test?{" "}
                      <a href="https://sepoliafaucet.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--neon)", textDecoration: "underline" }}>
                        Get free testnet ETH →
                      </a>
                    </p>
                  </div>
                </div>
              )}

              {activeSection === "contracts" && (
                <div className="rounded-2xl p-6 animate-fadeIn" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>Smart Contracts</h2>
                  <p className="text-sm mb-4" style={{ color: "var(--text2)" }}>
                    The VoteChain contract handles proposal creation, voting, and result queries on Sepolia.
                  </p>
                  <CodeBlock code={CONTRACT_CODE} />
                </div>
              )}

              {activeSection === "api" && (
                <div className="rounded-2xl p-6 animate-fadeIn" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h2 className="text-xl font-bold mb-2" style={{ color: "var(--text)" }}>SDK & API</h2>
                  <p className="text-sm mb-4" style={{ color: "var(--text2)" }}>
                    Use ethers.js v6 to interact with the VoteChain contract. Install with <code className="px-1 rounded" style={{ background: "var(--surface2)", color: "var(--neon2)" }}>npm install ethers</code>.
                  </p>
                  <CodeBlock code={SDK_CODE} />
                </div>
              )}

              {activeSection === "security" && (
                <div className="rounded-2xl p-6 animate-fadeIn" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <h2 className="text-xl font-bold mb-4" style={{ color: "var(--text)" }}>Security</h2>
                  <div className="flex flex-col gap-3">
                    {[
                      { title: "One vote per address", desc: "The contract prevents double voting via address mapping." },
                      { title: "Deadline enforced on-chain", desc: "Votes after the deadline are rejected at the contract level." },
                      { title: "Immutable results", desc: "Once recorded on Sepolia, votes cannot be altered or deleted." },
                      { title: "Verify URL before signing", desc: "Always confirm you are on the correct domain before approving any transaction." },
                    ].map((item) => (
                      <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "var(--surface2)", border: "1px solid var(--border)" }}>
                        <Shield size={14} style={{ color: "var(--neon)", flexShrink: 0, marginTop: "2px" }} />
                        <div>
                          <div className="text-sm font-semibold mb-1" style={{ color: "var(--text)" }}>{item.title}</div>
                          <div className="text-xs" style={{ color: "var(--muted)" }}>{item.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </div>

      {showWalletModal && (
        <ConnectWalletModal
          onConnect={handleConnectConfirm}
          onClose={() => { if (!isConnecting) setShowWalletModal(false); }}
          isConnecting={isConnecting}
          connectingWallet={connectingWallet}
          discoveredProviders={discoveredProviders}
        />
      )}
    </main>
  );
}
