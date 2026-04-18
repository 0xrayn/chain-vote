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
  const { wallet, connect, disconnect, shortAddress, isConnecting, isWrongNetwork, switchToSepolia, discoveredProviders } = useWallet();
  const [activeSection, setActiveSection] = useState("overview");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [connectingWallet, setConnectingWallet] = useState("");

  return (
    <main className="relative min-h-screen grid-bg" style={{ fontFamily: "var(--font-syne)" }}>
      <ThreeBackground />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar wallet={wallet} shortAddress={shortAddress} onConnect={() => setShowWalletModal(true)} onDisconnect={disconnect} isConnecting={isConnecting}
        connectingWallet={connectingWallet}
        discoveredProviders={discoveredProviders}
        onClose={() => setShowWalletModal(false)} />
      )}
    </main>
  );
}
