// Re-export from context so all existing imports continue to work unchanged.
// Logic has moved to context/ProposalsContext.tsx so data is fetched once
// and shared across all pages — no more redundant RPC calls per route.
export { useProposals } from "@/context/ProposalsContext";
