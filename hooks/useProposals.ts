"use client";
import { useState, useCallback } from "react";
import { Proposal, VoteChoice } from "@/types";
import { MOCK_PROPOSALS } from "@/lib/data";
import { toast } from "sonner";

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  // Map: proposalId -> VoteChoice (per session, since we're not using a real contract)
  const [myVotes, setMyVotes] = useState<Record<string, VoteChoice>>({});
  const [votingId, setVotingId] = useState<string | null>(null);

  const vote = useCallback(
    async (id: string, choice: VoteChoice, connected: boolean): Promise<boolean> => {
      if (!connected) {
        toast.error("Connect wallet to vote.");
        return false;
      }
      if (myVotes[id]) {
        toast.warning(`You already voted on ${id}.`);
        return false;
      }
      const proposal = proposals.find((p) => p.id === id);
      if (!proposal) {
        toast.error("Proposal not found.");
        return false;
      }
      if (proposal.status !== "active") {
        toast.error("This proposal is not active.");
        return false;
      }

      // Simulate tx submission (replace with actual contract call)
      setVotingId(id);
      try {
        await new Promise((r) => setTimeout(r, 1200)); // simulate tx delay

        setProposals((prev) =>
          prev.map((p) => {
            if (p.id !== id) return p;
            return {
              ...p,
              [choice]: p[choice] + 1,
              total: p.total + 1,
            };
          })
        );
        setMyVotes((prev) => ({ ...prev, [id]: choice }));

        const choiceLabel = choice === "yes" ? "FOR ✅" : choice === "no" ? "AGAINST ❌" : "ABSTAIN";
        toast.success(`Vote cast: ${choiceLabel} on ${id}`);
        return true;
      } catch (err: any) {
        toast.error(err?.message ?? "Transaction failed.");
        return false;
      } finally {
        setVotingId(null);
      }
    },
    [myVotes, proposals]
  );

  const createProposal = useCallback(
    async (
      title: string,
      description: string,
      creator: string,
      connected: boolean,
      duration: string = "3 DAYS"
    ): Promise<boolean> => {
      if (!connected) {
        toast.error("Connect wallet first.");
        return false;
      }
      if (!title.trim()) {
        toast.error("Proposal title is required.");
        return false;
      }
      if (!description.trim()) {
        toast.error("Proposal description is required.");
        return false;
      }
      if (title.trim().length < 10) {
        toast.error("Title must be at least 10 characters.");
        return false;
      }
      if (description.trim().length < 20) {
        toast.error("Description must be at least 20 characters.");
        return false;
      }

      // Generate next VIP ID
      const existingNums = proposals
        .map((p) => parseInt(p.id.replace("VIP-", ""), 10))
        .filter((n) => !isNaN(n));
      const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
      const newId = `VIP-${String(nextNum).padStart(3, "0")}`;

      // Parse duration into days for display
      const daysMap: Record<string, string> = {
        "1 DAY": "Ends in 1d",
        "3 DAYS": "Ends in 3d",
        "7 DAYS": "Ends in 7d",
        "14 DAYS": "Ends in 14d",
      };

      const newProp: Proposal = {
        id: newId,
        title: title.trim(),
        description: description.trim(),
        status: "active",
        yes: 0,
        no: 0,
        abstain: 0,
        total: 0,
        ends: daysMap[duration] ?? "Ends in 3d",
        creator: `${creator.slice(0, 6)}...${creator.slice(-4)}`,
        createdAt: new Date().toISOString().split("T")[0],
        quorum: 100,
      };

      setProposals((prev) => [newProp, ...prev]);
      toast.success(`Proposal ${newId} deployed on Sepolia! 🎉`);
      return true;
    },
    [proposals]
  );

  return { proposals, myVotes, vote, createProposal, votingId };
}
