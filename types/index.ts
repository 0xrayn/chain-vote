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
  txHash?: string; // optional Sepolia tx hash for on-chain proposals
}

export interface WalletState {
  connected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
}

export interface WalletHook {
  wallet: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  shortAddress: string | null;
  isConnecting: boolean;
  isWrongNetwork: boolean;
  switchToSepolia: () => Promise<void>;
}
