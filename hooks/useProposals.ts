"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Proposal, VoteChoice } from "@/types";
import { MOCK_PROPOSALS } from "@/lib/data";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { toast } from "sonner";

const DURATION_SECONDS: Record<string, bigint> = {
  "1 DAY":   86400n,
  "3 DAYS":  259200n,
  "7 DAYS":  604800n,
  "14 DAYS": 1209600n,
};

function secondsToLabel(remaining: bigint): string {
  if (remaining <= 0n) return "ENDED";
  const days  = remaining / 86400n;
  const hours = (remaining % 86400n) / 3600n;
  const mins  = (remaining % 3600n)  / 60n;
  if (days > 0n)  return `${days}d ${hours}h`;
  if (hours > 0n) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function statusFromCode(code: number): Proposal["status"] {
  if (code === 0) return "pending";
  if (code === 2) return "ended";
  return "active";
}

const STORAGE_KEY = "chainvotes_proposals";
const VOTES_KEY   = "chainvotes_myvotes";

function loadProposals(): Proposal[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) return JSON.parse(s) as Proposal[];
  } catch { /* ignore */ }
  return MOCK_PROPOSALS;
}
function saveProposals(p: Proposal[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}
function loadMyVotes(): Record<string, VoteChoice> {
  try {
    const s = localStorage.getItem(VOTES_KEY);
    if (s) return JSON.parse(s) as Record<string, VoteChoice>;
  } catch { /* ignore */ }
  return {};
}
function saveMyVotes(v: Record<string, VoteChoice>) {
  try { localStorage.setItem(VOTES_KEY, JSON.stringify(v)); } catch { /* ignore */ }
}

export function useProposals(walletAddress?: string | null) {
  const [proposals,  setProposals]  = useState<Proposal[]>(MOCK_PROPOSALS);
  const [myVotes,    setMyVotes]    = useState<Record<string, VoteChoice>>({});
  const [votingId,   setVotingId]   = useState<string | null>(null);
  const [hydrated,   setHydrated]   = useState(false);
  const [isOnChain,  setIsOnChain]  = useState(false);
  const [isLoading,  setIsLoading]  = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const contractReady = Boolean(CONTRACT_ADDRESS);

  const fetchFromChain = useCallback(async (address?: string | null): Promise<boolean> => {
    if (!contractReady || typeof window === "undefined") return false;
    try {
      const eth = (window as any).ethereum;
      if (!eth) return false;
      const provider = new ethers.BrowserProvider(eth);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

      const [ids, titles, creators, yesArr, noArr, abstainArr, endTimes, statuses] =
        await contract.getAllProposals() as [
          bigint[], string[], string[], bigint[], bigint[], bigint[], bigint[], number[]
        ];

      const now = BigInt(Math.floor(Date.now() / 1000));
      const fetched: Proposal[] = ids.map((id, i) => {
        const remaining = endTimes[i] - now;
        return {
          id:          `VIP-${String(Number(id)).padStart(3, "0")}`,
          title:       titles[i],
          description: "",
          status:      statusFromCode(statuses[i]),
          yes:         Number(yesArr[i]),
          no:          Number(noArr[i]),
          abstain:     Number(abstainArr[i]),
          total:       Number(yesArr[i]) + Number(noArr[i]) + Number(abstainArr[i]),
          ends:        secondsToLabel(remaining > 0n ? remaining : 0n),
          creator:     `${creators[i].slice(0, 6)}...${creators[i].slice(-4)}`,
          createdAt:   "",
          quorum:      100,
        };
      });

      setProposals(fetched.length > 0 ? fetched : MOCK_PROPOSALS);
      setIsOnChain(true);

      if (address) {
        const voteMap: Record<string, VoteChoice> = {};
        const choiceMap: Record<number, VoteChoice> = { 1: "yes", 2: "no", 3: "abstain" };
        for (const id of ids) {
          const choiceNum = Number(await contract.getVote(address, id));
          if (choiceNum > 0) {
            voteMap[`VIP-${String(Number(id)).padStart(3, "0")}`] = choiceMap[choiceNum] ?? "abstain";
          }
        }
        setMyVotes(voteMap);
      }
      return true;
    } catch (err) {
      console.warn("[useProposals] chain fetch failed, using localStorage:", err);
      return false;
    }
  }, [contractReady]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      const ok = await fetchFromChain(walletAddress);
      if (!ok) {
        setProposals(loadProposals());
        setMyVotes(loadMyVotes());
      }
      setHydrated(true);
      setIsLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walletAddress]);

  useEffect(() => {
    if (!isOnChain) return;
    pollRef.current = setInterval(() => fetchFromChain(walletAddress), 15_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [isOnChain, fetchFromChain, walletAddress]);

  const vote = useCallback(
    async (id: string, choice: VoteChoice, connected: boolean): Promise<boolean> => {
      if (!connected) { toast.error("Connect wallet to vote."); return false; }
      if (myVotes[id]) { toast.warning(`You already voted on ${id}.`); return false; }

      const proposal = proposals.find((p) => p.id === id);
      if (!proposal) { toast.error("Proposal not found."); return false; }
      if (proposal.status !== "active") { toast.error("This proposal is not active."); return false; }

      setVotingId(id);
      try {
        if (contractReady && typeof window !== "undefined" && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer   = await provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

          const choiceNum  = choice === "yes" ? 1 : choice === "no" ? 2 : 3;
          const proposalNum = parseInt(id.replace("VIP-", ""), 10);

          toast.info("Confirm the transaction in your wallet…");
          const tx = await contract.vote(proposalNum, choiceNum);
          toast.info("Transaction sent! Waiting for confirmation…");
          await tx.wait();

          const choiceLabel = choice === "yes" ? "FOR ✅" : choice === "no" ? "AGAINST ❌" : "ABSTAIN";
          toast.success(`Vote on-chain: ${choiceLabel} | Tx: ${tx.hash.slice(0,10)}…`);

          const updatedVotes = { ...myVotes, [id]: choice };
          setMyVotes(updatedVotes);
          await fetchFromChain(walletAddress);
          return true;
        } else {
          await new Promise((r) => setTimeout(r, 1200));
          const updatedProposals = proposals.map((p) =>
            p.id !== id ? p : { ...p, [choice]: p[choice] + 1, total: p.total + 1 }
          );
          const updatedVotes = { ...myVotes, [id]: choice };
          setProposals(updatedProposals);
          setMyVotes(updatedVotes);
          saveProposals(updatedProposals);
          saveMyVotes(updatedVotes);
          const choiceLabel = choice === "yes" ? "FOR ✅" : choice === "no" ? "AGAINST ❌" : "ABSTAIN";
          toast.success(`Vote cast (local): ${choiceLabel} on ${id}`);
          return true;
        }
      } catch (err: any) {
        const msg: string = err?.reason ?? err?.message ?? "Transaction failed.";
        if (msg.includes("AlreadyVoted")) toast.error("You already voted on this proposal.");
        else if (msg.includes("ProposalNotActive")) toast.error("Proposal is not active.");
        else if (msg.includes("user rejected")) toast.error("Transaction rejected.");
        else toast.error(msg.slice(0, 120));
        return false;
      } finally {
        setVotingId(null);
      }
    },
    [myVotes, proposals, contractReady, fetchFromChain, walletAddress]
  );

  const createProposal = useCallback(
    async (
      title: string,
      description: string,
      creator: string,
      connected: boolean,
      duration: string = "3 DAYS"
    ): Promise<boolean> => {
      if (!connected) { toast.error("Connect wallet first."); return false; }
      if (!title.trim()) { toast.error("Proposal title is required."); return false; }
      if (!description.trim()) { toast.error("Proposal description is required."); return false; }
      if (title.trim().length < 10) { toast.error("Title must be at least 10 characters."); return false; }
      if (description.trim().length < 20) { toast.error("Description must be at least 20 characters."); return false; }

      try {
        if (contractReady && typeof window !== "undefined" && (window as any).ethereum) {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const signer   = await provider.getSigner();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

          const durationSec = DURATION_SECONDS[duration] ?? DURATION_SECONDS["3 DAYS"];
          const quorum      = 100n;

          toast.info("Confirm the transaction in your wallet…");
          const tx = await contract.createProposal(title.trim(), description.trim(), durationSec, quorum);
          toast.info("Transaction sent! Waiting for confirmation…");
          const receipt = await tx.wait();

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

          toast.success(`Proposal ${newId} deployed on Sepolia! 🎉`);
          await fetchFromChain(creator);
          return true;
        } else {
          const existingNums = proposals
            .map((p) => parseInt(p.id.replace("VIP-", ""), 10))
            .filter((n) => !isNaN(n));
          const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
          const newId   = `VIP-${String(nextNum).padStart(3, "0")}`;

          const daysMap: Record<string, string> = {
            "1 DAY": "Ends in 1d", "3 DAYS": "Ends in 3d",
            "7 DAYS": "Ends in 7d", "14 DAYS": "Ends in 14d",
          };
          const newProp: Proposal = {
            id: newId, title: title.trim(), description: description.trim(),
            status: "active", yes: 0, no: 0, abstain: 0, total: 0,
            ends: daysMap[duration] ?? "Ends in 3d",
            creator: `${creator.slice(0, 6)}...${creator.slice(-4)}`,
            createdAt: new Date().toISOString().split("T")[0],
            quorum: 100,
          };
          const updated = [newProp, ...proposals];
          setProposals(updated);
          saveProposals(updated);
          toast.success(`Proposal ${newId} created (local mode) 🎉`);
          return true;
        }
      } catch (err: any) {
        const msg: string = err?.reason ?? err?.message ?? "Transaction failed.";
        if (msg.includes("user rejected")) toast.error("Transaction rejected.");
        else toast.error(msg.slice(0, 120));
        return false;
      }
    },
    [proposals, contractReady, fetchFromChain]
  );

  return {
    proposals,
    myVotes,
    vote,
    createProposal,
    votingId,
    hydrated,
    isOnChain,
    isLoading,
    refresh: () => fetchFromChain(walletAddress),
  };
}
