"use client";
import { useState, useCallback } from "react";
import { Proposal, VoteChoice } from "@/types";
import { MOCK_PROPOSALS } from "@/lib/data";
import { toast } from "sonner";

export function useProposals() {
  const [proposals, setProposals] = useState<Proposal[]>(MOCK_PROPOSALS);
  const [myVotes, setMyVotes] = useState<Record<string, VoteChoice>>({});

  const vote = useCallback(
    (id: string, choice: VoteChoice, connected: boolean) => {
      if (!connected) {
        toast.error("Connect wallet to vote");
        return false;
      }
      if (myVotes[id]) {
        toast.warning(`Already voted on ${id}`);
        return false;
      }
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
      toast.success(`Vote cast: ${choice.toUpperCase()} on ${id}`);
      return true;
    },
    [myVotes]
  );

  const createProposal = useCallback(
    (
      title: string,
      description: string,
      creator: string,
      connected: boolean
    ) => {
      if (!connected) {
        toast.error("Connect wallet first");
        return false;
      }
      if (!title.trim() || !description.trim()) {
        toast.error("Fill in title and description");
        return false;
      }
      const newId = `VIP-00${proposals.length + 1}`;
      const newProp: Proposal = {
        id: newId,
        title,
        description,
        status: "pending",
        yes: 0,
        no: 0,
        abstain: 0,
        total: 0,
        ends: "Starts soon",
        creator: `${creator.slice(0, 6)}...${creator.slice(-4)}`,
        createdAt: new Date().toISOString().split("T")[0],
        quorum: 400,
      };
      setProposals((prev) => [newProp, ...prev]);
      toast.success(`Proposal ${newId} deployed on Sepolia`);
      return true;
    },
    [proposals.length]
  );

  return { proposals, myVotes, vote, createProposal };
}
