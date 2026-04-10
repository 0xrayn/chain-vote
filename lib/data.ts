import { Proposal } from "@/types";

export const MOCK_PROPOSALS: Proposal[] = [
  {
    id: "VIP-001",
    title: "Upgrade Treasury Multi-sig to 5/9",
    description:
      "Proposal to increase treasury multi-signature threshold from 3/7 to 5/9 for enhanced security of protocol funds. This change will require consensus from 5 out of 9 signers before any fund movement.",
    status: "active",
    yes: 312,
    no: 89,
    abstain: 24,
    total: 425,
    ends: "2d 14h",
    creator: "0x7f3a...b2c1",
    createdAt: "2025-01-10",
    quorum: 500,
  },
  {
    id: "VIP-002",
    title: "Enable Cross-chain Bridge to Arbitrum",
    description:
      "Deploy official bridge contract enabling seamless asset transfers between Sepolia and Arbitrum One testnet. Reduces friction for multi-chain operations and improves developer experience.",
    status: "active",
    yes: 198,
    no: 203,
    abstain: 41,
    total: 442,
    ends: "5h 32m",
    creator: "0x2d91...a4f8",
    createdAt: "2025-01-08",
    quorum: 500,
  },
  {
    id: "VIP-003",
    title: "Reduce Voting Quorum to 10%",
    description:
      "Lower the minimum quorum requirement from 20% to 10% of total supply to improve governance participation rates and prevent proposal deadlock due to voter apathy.",
    status: "ended",
    yes: 567,
    no: 112,
    abstain: 88,
    total: 767,
    ends: "ENDED",
    creator: "0x9c14...e7d2",
    createdAt: "2025-01-01",
    quorum: 600,
  },
  {
    id: "VIP-004",
    title: "Allocate 500 ETH to Dev Fund Q2",
    description:
      "Release 500 ETH from the protocol treasury to fund development activities for Q2 2025 roadmap milestones including ZK rollup integration and new SDK release.",
    status: "pending",
    yes: 0,
    no: 0,
    abstain: 0,
    total: 0,
    ends: "Starts in 2d",
    creator: "0x4b78...c3a9",
    createdAt: "2025-01-12",
    quorum: 400,
  },
];
