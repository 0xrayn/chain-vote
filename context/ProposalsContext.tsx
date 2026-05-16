"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Proposal, VoteChoice } from "@/types";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { toast } from "sonner";

const DURATION_SECONDS: Record<string, bigint> = {
  "1 DAY":   86400n,
  "3 DAYS":  259200n,
  "7 DAYS":  604800n,
  "14 DAYS": 1209600n,
};

// ─── Context shape ────────────────────────────────────────────────────────────
interface ProposalsContextValue {
  proposals:      Proposal[];
  myVotes:        Record<string, VoteChoice>;
  votingId:       string | null;
  hydrated:       boolean;
  isOnChain:      boolean;
  isLoading:      boolean;
  vote:           (id: string, choice: VoteChoice, connected: boolean) => Promise<boolean>;
  createProposal: (title: string, description: string, creator: string, connected: boolean, duration?: string) => Promise<boolean>;
  refresh:        () => void;
  setWalletAddress: (address: string | null) => void;
}

const ProposalsContext = createContext<ProposalsContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ProposalsProvider({ children }: { children: React.ReactNode }) {
  const [proposals,     setProposals]     = useState<Proposal[]>([]);
  const [myVotes,       setMyVotes]       = useState<Record<string, VoteChoice>>({});
  const [votingId,      setVotingId]      = useState<string | null>(null);
  const [hydrated,      setHydrated]      = useState(false);
  const [isOnChain,     setIsOnChain]     = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Use a ref for walletAddress so fetchFromChain doesn't need it in deps
  const walletAddressRef = useRef<string | null>(null);

  // Keep ref in sync without triggering re-renders or re-fetches
  useEffect(() => {
    walletAddressRef.current = walletAddress;
  }, [walletAddress]);

  const contractReady = Boolean(CONTRACT_ADDRESS);

  const fetchFromChain = useCallback(async (address?: string | null): Promise<boolean> => {
    if (!contractReady) return false;
    try {
      const res = await fetch("/api/proposals");
      if (!res.ok) throw new Error(`API error ${res.status}`);
      const data = await res.json();
      const fetched: Proposal[] = data.proposals ?? [];

      setProposals(fetched);
      setIsOnChain(true);

      const resolvedAddress = address ?? walletAddressRef.current;
      if (resolvedAddress && typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const voteMap: Record<string, VoteChoice> = {};
        const choiceMap: Record<number, VoteChoice> = { 1: "yes", 2: "no", 3: "abstain" };
        const ids = fetched.map((p) => BigInt(parseInt(p.id.replace("VIP-", ""), 10)));
        for (const id of ids) {
          const choiceNum = Number(await contract.getVote(resolvedAddress, id));
          if (choiceNum > 0) {
            voteMap[`VIP-${String(Number(id)).padStart(3, "0")}`] = choiceMap[choiceNum] ?? "abstain";
          }
        }
        setMyVotes(voteMap);
      }
      return true;
    } catch (err) {
      console.warn("[ProposalsContext] fetch failed:", err);
      return false;
    }
  // Only contractReady in deps  walletAddress read via ref to avoid re-fetch on address change
  }, [contractReady]);

  // Initial fetch  runs once on mount only
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const ok = await fetchFromChain(null);
      if (!ok) { setProposals([]); setMyVotes({}); }
      setHydrated(true);
      setIsLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty  fetch only on mount

  // Re-fetch votes when wallet connects/changes (not proposals)
  useEffect(() => {
    if (!walletAddress || !isOnChain) return;
    const fetchVotes = async () => {
      if (!contractReady || typeof window === "undefined" || !(window as any).ethereum) return;
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const voteMap: Record<string, VoteChoice> = {};
        const choiceMap: Record<number, VoteChoice> = { 1: "yes", 2: "no", 3: "abstain" };
        const ids = proposals.map((p) => BigInt(parseInt(p.id.replace("VIP-", ""), 10)));
        for (const id of ids) {
          const choiceNum = Number(await contract.getVote(walletAddress, id));
          if (choiceNum > 0) {
            voteMap[`VIP-${String(Number(id)).padStart(3, "0")}`] = choiceMap[choiceNum] ?? "abstain";
          }
        }
        setMyVotes(voteMap);
      } catch { /* silent */ }
    };
    fetchVotes();
  }, [walletAddress, isOnChain, contractReady]); // proposals intentionally omitted

  // Polling  stable, never restarts because fetchFromChain deps are stable
  useEffect(() => {
    if (!isOnChain) return;
    pollRef.current = setInterval(() => fetchFromChain(null), 8_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOnChain, fetchFromChain]);

  // ── vote ──────────────────────────────────────────────────────────────────
  const vote = useCallback(async (id: string, choice: VoteChoice, connected: boolean): Promise<boolean> => {
    if (!connected) { toast.error("Connect wallet to vote."); return false; }
    if (myVotes[id]) { toast.warning(`You already voted on ${id}.`); return false; }

    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) { toast.error("Proposal not found."); return false; }
    if (proposal.status !== "active") { toast.error("This proposal is not active."); return false; }

    setVotingId(id);
    try {
      if (contractReady && typeof window !== "undefined" && (window as any).ethereum) {
        const provider  = new ethers.BrowserProvider((window as any).ethereum);
        const signer    = await provider.getSigner();
        const contract  = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const choiceNum = choice === "yes" ? 1 : choice === "no" ? 2 : 3;
        const propNum   = parseInt(id.replace("VIP-", ""), 10);

        toast.info("Confirm the transaction in your wallet...");
        const tx = await contract.vote(propNum, choiceNum);
        toast.info("Transaction sent! Waiting for confirmation...");
        await tx.wait();
        await fetch("/api/proposals", { method: "POST" }).catch(() => {});

        const label = choice === "yes" ? "FOR ✅" : choice === "no" ? "AGAINST ❌" : "ABSTAIN";
        toast.success(`Vote on-chain: ${label}`, {
          action: { label: "Etherscan →", onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank") },
          duration: 8000,
        });

        setMyVotes((prev) => ({ ...prev, [id]: choice }));
        await fetchFromChain(null);
        return true;
      } else {
        await new Promise((r) => setTimeout(r, 1200));
        setProposals((prev) =>
          prev.map((p) => p.id !== id ? p : { ...p, [choice]: p[choice] + 1, total: p.total + 1 })
        );
        setMyVotes((prev) => ({ ...prev, [id]: choice }));
        const label = choice === "yes" ? "FOR ✅" : choice === "no" ? "AGAINST ❌" : "ABSTAIN";
        toast.success(`Vote cast (local): ${label} on ${id}`);
        return true;
      }
    } catch (err: any) {
      const msg: string = err?.reason ?? err?.message ?? "Transaction failed.";
      if (msg.includes("AlreadyVoted"))       toast.error("You already voted on this proposal.");
      else if (msg.includes("ProposalNotActive")) toast.error("Proposal is not active.");
      else if (msg.includes("user rejected")) toast.error("Transaction rejected.");
      else toast.error(msg.slice(0, 120));
      return false;
    } finally {
      setVotingId(null);
    }
  }, [myVotes, proposals, contractReady, fetchFromChain]);

  // ── createProposal ────────────────────────────────────────────────────────
  const createProposal = useCallback(async (
    title: string, description: string, creator: string,
    connected: boolean, duration = "3 DAYS"
  ): Promise<boolean> => {
    if (!connected)               { toast.error("Connect wallet first."); return false; }
    if (!title.trim())            { toast.error("Proposal title is required."); return false; }
    if (!description.trim())      { toast.error("Proposal description is required."); return false; }
    if (title.trim().length < 10) { toast.error("Title must be at least 10 characters."); return false; }
    if (description.trim().length < 20) { toast.error("Description must be at least 20 characters."); return false; }

    try {
      if (contractReady && typeof window !== "undefined" && (window as any).ethereum) {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer   = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const durationSec = DURATION_SECONDS[duration] ?? DURATION_SECONDS["3 DAYS"];

        toast.info("Confirm the transaction in your wallet...");
        const tx = await contract.createProposal(title.trim(), description.trim(), durationSec, 100n);
        toast.info("Transaction sent! Waiting for confirmation...");
        const receipt = await tx.wait();
        await fetch("/api/proposals", { method: "POST" }).catch(() => {});

        const iface = new ethers.Interface(CONTRACT_ABI as any);
        let newId = "?";
        for (const log of receipt.logs ?? []) {
          try {
            const parsed = iface.parseLog(log);
            if (parsed?.name === "ProposalCreated") {
              newId = `VIP-${String(Number(parsed.args.id)).padStart(3, "0")}`;
              break;
            }
          } catch { /* not our event */ }
        }

        toast.success(`Proposal ${newId} live on Sepolia! 🎉`, {
          action: { label: "Etherscan →", onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank") },
          duration: 8000,
        });
        await fetchFromChain(creator);
        return true;
      } else {
        const existingNums = proposals.map((p) => parseInt(p.id.replace("VIP-", ""), 10)).filter((n) => !isNaN(n));
        const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
        const newId   = `VIP-${String(nextNum).padStart(3, "0")}`;
        const daysMap: Record<string, string> = {
          "1 DAY": "Ends in 1d", "3 DAYS": "Ends in 3d",
          "7 DAYS": "Ends in 7d", "14 DAYS": "Ends in 14d",
        };
        setProposals((prev) => [{
          id: newId, title: title.trim(), description: description.trim(),
          status: "active", yes: 0, no: 0, abstain: 0, total: 0,
          ends: daysMap[duration] ?? "Ends in 3d",
          creator: `${creator.slice(0, 6)}...${creator.slice(-4)}`,
          createdAt: new Date().toISOString().split("T")[0],
          quorum: 100,
        }, ...prev]);
        toast.success(`Proposal ${newId} created (local mode) 🎉`);
        return true;
      }
    } catch (err: any) {
      const msg: string = err?.reason ?? err?.message ?? "Transaction failed.";
      if (msg.includes("user rejected")) toast.error("Transaction rejected.");
      else toast.error(msg.slice(0, 120));
      return false;
    }
  }, [proposals, contractReady, fetchFromChain]);

  return (
    <ProposalsContext.Provider value={{
      proposals, myVotes, votingId, hydrated, isOnChain, isLoading,
      vote, createProposal,
      refresh: () => fetchFromChain(null),
      setWalletAddress,
    }}>
      {children}
    </ProposalsContext.Provider>
  );
}

// ─── Consumer hook ────────────────────────────────────────────────────────────
export function useProposals() {
  const ctx = useContext(ProposalsContext);
  if (!ctx) throw new Error("useProposals must be used inside ProposalsProvider");
  return ctx;
}
