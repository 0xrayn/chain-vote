export type ProposalStatus = "active" | "ended" | "pending";
export type VoteChoice = "yes" | "no" | "abstain";

export interface Proposal {
  id: string;
  title: string;
  description: string;
  status: ProposalStatus;
  yes: number;
  no: number;
  abstain: number;
  total: number;
  ends: string;
  creator: string;
  createdAt: string;
  quorum: number;
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}
