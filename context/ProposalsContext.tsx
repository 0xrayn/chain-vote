"use client";
import { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { Proposal, VoteChoice } from "@/types";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { toast } from "sonner";
import { useWalletContext } from "@/context/WalletContext";
import { getFallbackProvider } from "@/lib/rpc";

// ─── waitForReceipt ───────────────────────────────────────────────────────────
// tx.wait() dari ethers memakai provider WalletConnect untuk polling, yang
// sering lambat / silent-fail pada WC v2 mobile. Fungsi ini poll receipt
// langsung via RPC fallback sehingga UI update segera setelah on-chain confirm,
// tidak perlu nunggu WC provider yang tidak reliable.
async function waitForReceipt(
  txHash: string,
  timeoutMs = 120_000,
  intervalMs = 2_500
): Promise<ethers.TransactionReceipt> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const provider = await getFallbackProvider();
      const receipt = await provider.getTransactionReceipt(txHash);
      if (receipt && receipt.blockNumber) return receipt;
    } catch { /* RPC hiccup — coba lagi */ }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Transaction ${txHash} not confirmed after ${timeoutMs / 1000}s`);
}

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
  const { getActiveProvider } = useWalletContext();
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

      // Recompute status di sisi client berdasarkan endTime — ini mencegah
      // status stale dari cache server yang belum expire, sehingga proposal
      // yang sudah lewat tidak pernah muncul sebagai "active" di UI
      const nowSec = Math.floor(Date.now() / 1000);
      const normalized = fetched.map((p) =>
        p.endTime && nowSec > p.endTime && p.status !== "ended"
          ? { ...p, status: "ended" as const }
          : p
      );

      // Gabungkan dengan optimistic "confirming" proposals yang sudah ada di state
      // (tidak ditimpa oleh fetch dari chain karena id-nya "PENDING-xxx")
      setProposals((prev) => {
        const confirming = prev.filter((p) => p.status === "confirming");
        const merged = [...confirming, ...normalized];
        // Sort: confirming & active terbaru di atas, ended di bawah
        merged.sort((a, b) => {
          const statusOrder = (s: string) =>
            s === "confirming" ? 0 : s === "active" ? 1 : s === "pending" ? 2 : 3;
          const so = statusOrder(a.status) - statusOrder(b.status);
          if (so !== 0) return so;
          // Dalam grup yang sama, urutkan berdasarkan endTime desc (terbaru di atas)
          return (b.endTime ?? 0) - (a.endTime ?? 0);
        });
        return merged;
      });
      setIsOnChain(true);

      // Only fetch votes when we have an address — never clear existing myVotes
      // during background polling (walletAddressRef.current may be null)
      const resolvedAddress = address ?? walletAddressRef.current;
      if (resolvedAddress) {
        // Use read-only RPC provider — wallet provider (especially WalletConnect)
        // is unreliable for read calls and can silently return wrong data
        try {
          const provider = await getFallbackProvider();
          const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
          const voteMap: Record<string, VoteChoice> = {};
          const choiceMap: Record<number, VoteChoice> = { 1: "yes", 2: "no", 3: "abstain" };
          const ids = fetched.map((p) => BigInt(parseInt(p.id.replace("VIP-", ""), 10)));
          await Promise.all(ids.map(async (id) => {
            const choiceNum = Number(await contract.getVote(resolvedAddress, id));
            if (choiceNum > 0) {
              voteMap[`VIP-${String(Number(id)).padStart(3, "0")}`] = choiceMap[choiceNum] ?? "abstain";
            }
          }));
          // Merge — never wipe existing votes, only add/update
          setMyVotes((prev) => {
            const merged = { ...prev, ...voteMap };
            const validIds = new Set(fetched.map((p) => p.id));
            for (const k of Object.keys(merged)) {
              if (!validIds.has(k)) delete merged[k];
            }
            return merged;
          });
        } catch {
          // Keep existing myVotes on read error — don't clear what we already know
        }
      }
      return true;
    } catch (err) {
      console.warn("[ProposalsContext] fetch failed:", err);
      return false;
    }
  // contractReady only — walletAddress read via ref
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

  // Re-fetch votes when wallet connects/changes
  useEffect(() => {
    if (!walletAddress || !isOnChain || !contractReady) return;
    const fetchVotes = async () => {
      try {
        // Always use read-only RPC — reliable for both MetaMask and WalletConnect
        const provider = await getFallbackProvider();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
        const voteMap: Record<string, VoteChoice> = {};
        const choiceMap: Record<number, VoteChoice> = { 1: "yes", 2: "no", 3: "abstain" };
        const ids = proposals.map((p) => BigInt(parseInt(p.id.replace("VIP-", ""), 10)));
        await Promise.all(ids.map(async (id) => {
          const choiceNum = Number(await contract.getVote(walletAddress, id));
          if (choiceNum > 0) {
            voteMap[`VIP-${String(Number(id)).padStart(3, "0")}`] = choiceMap[choiceNum] ?? "abstain";
          }
        }));
        setMyVotes((prev) => ({ ...prev, ...voteMap }));
      } catch { /* silent — keep existing votes */ }
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

    const proposal = proposals.find((p) => p.id === id);
    if (!proposal) { toast.error("Proposal not found."); return false; }
    if (proposal.status !== "active") { toast.error("This proposal is not active."); return false; }

    // Frontend guard — fast check from local state
    if (myVotes[id]) { toast.warning("You already voted on this proposal."); return false; }

    // On-chain pre-check — source of truth, catches cases where myVotes may be stale
    // (e.g. user voted from a different device/session, or just reconnected)
    const voterAddress = walletAddressRef.current;
    if (voterAddress && contractReady) {
      try {
        const readProvider = await getFallbackProvider();
        const readContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, readProvider);
        const propNum = parseInt(id.replace("VIP-", ""), 10);
        const existingVote = Number(await readContract.getVote(voterAddress, propNum));
        if (existingVote > 0) {
          const choiceMap: Record<number, VoteChoice> = { 1: "yes", 2: "no", 3: "abstain" };
          // Sync local state so UI updates immediately
          setMyVotes((prev) => ({ ...prev, [id]: choiceMap[existingVote] ?? "abstain" }));
          toast.warning("You already voted on this proposal.");
          return false;
        }
      } catch { /* non-fatal — proceed and let the contract revert if needed */ }
    }

    setVotingId(id);
    try {
      const activeProvider = getActiveProvider();
      if (contractReady && activeProvider) {
        const provider  = new ethers.BrowserProvider(activeProvider);
        // Pass address explicitly to getSigner — required for WalletConnect v2
        // which doesn't support eth_requestAccounts for signer resolution
        const signerAddress = walletAddressRef.current ?? undefined;
        const signer    = await provider.getSigner(signerAddress);
        const contract  = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const choiceNum = choice === "yes" ? 1 : choice === "no" ? 2 : 3;
        const propNum   = parseInt(id.replace("VIP-", ""), 10);

        toast.info("Confirm the transaction in your wallet...");
        let GAS_VOTE = 200_000n;
        try {
          const estimated = await contract.vote.estimateGas(propNum, choiceNum);
          GAS_VOTE = (estimated * 130n) / 100n; // +30% buffer
        } catch {
          // estimateGas gagal — pakai fallback 200k
        }
        const tx = await contract.vote(propNum, choiceNum, { gasLimit: GAS_VOTE });

        // ── Optimistic update ───────────────────────────────────────────────
        // Update UI langsung setelah tx hash ada — tidak perlu nunggu confirm.
        // Ini mencegah UI "stuck" saat WC provider lambat polling receipt.
        const label = choice === "yes" ? "FOR ✅" : choice === "no" ? "AGAINST ❌" : "ABSTAIN";
        toast.info(`Transaction sent! Vote ${label} sedang diproses...`, {
          action: { label: "Etherscan →", onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank") },
          duration: 10000,
        });
        // Optimistically update local state supaya tombol vote langsung disabled
        setMyVotes((prev) => ({ ...prev, [id]: choice }));
        setProposals((prev) =>
          prev.map((p) =>
            p.id !== id ? p : {
              ...p,
              [choice]: p[choice as keyof typeof p] as number + 1,
              total: p.total + 1,
            }
          )
        );

        // ── Background confirmation ─────────────────────────────────────────
        // Poll via RPC fallback — jauh lebih reliable dari tx.wait() WalletConnect
        waitForReceipt(tx.hash).then(async (receipt) => {
          if (receipt.status === 0) {
            // Transaksi revert di blockchain — rollback optimistic update
            toast.error("Transaction reverted on-chain. Vote tidak tercatat.", {
              action: { label: "Etherscan →", onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank") },
              duration: 8000,
            });
            // Rollback: hapus vote optimistic dan sync ulang dari chain
            setMyVotes((prev) => { const next = { ...prev }; delete next[id]; return next; });
            await fetchFromChain(null);
            return;
          }
          await fetch("/api/proposals", { method: "POST" }).catch(() => {});
          toast.success(`Vote confirmed on-chain: ${label}`, {
            action: { label: "Etherscan →", onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank") },
            duration: 8000,
          });
          await fetchFromChain(null);
        }).catch(() => {
          // Timeout polling — tx mungkin tetap berhasil atau pending.
          // Refresh dari chain agar state akurat, tanpa rollback.
          fetchFromChain(null);
        });

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
  }, [myVotes, proposals, contractReady, fetchFromChain, getActiveProvider]);

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
      const activeProvider = getActiveProvider();
      if (contractReady && activeProvider) {
        const provider = new ethers.BrowserProvider(activeProvider);

        // Selalu ambil address dari walletAddressRef — paling reliable untuk
        // WalletConnect v2 yang tidak support eth_requestAccounts untuk getSigner
        // Hindari pakai `creator` prop karena bisa kosong saat komponen belum re-render
        const signerAddress = walletAddressRef.current || creator || undefined;
        if (!signerAddress) {
          toast.error("Wallet address not found. Please reconnect your wallet.");
          return false;
        }

        const signer   = await provider.getSigner(signerAddress);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        const durationSec = DURATION_SECONDS[duration] ?? DURATION_SECONDS["3 DAYS"];

        toast.info("Confirm the transaction in your wallet...");

        // Estimasi gas aktual + tambah buffer 30% — lebih reliable daripada
        // hardcode 600k yang bikin WalletConnect tampil "loading" lama karena
        // wallet mobile harus decode calldata besar dengan gas tinggi
        let gasLimit = 600_000n;
        try {
          const estimated = await contract.createProposal.estimateGas(
            title.trim(), description.trim(), durationSec, 100n
          );
          gasLimit = (estimated * 130n) / 100n; // +30% buffer
        } catch {
          // estimateGas gagal (misal RPC lambat) — pakai fallback 600k
        }

        const tx = await contract.createProposal(title.trim(), description.trim(), durationSec, 100n, { gasLimit });

        // ── Optimistic proposal card ────────────────────────────────────────
        // Inject proposal sementara ke list dengan status "confirming" supaya
        // user bisa langsung melihat proposalnya (dan tahu tx sedang berjalan).
        // ID sementara pakai tx hash agar unik dan tidak bentrok dengan VIP-xxx.
        const tempId = `PENDING-${tx.hash.slice(0, 10)}`;
        const daysMap: Record<string, string> = {
          "1 DAY": "1d", "3 DAYS": "3d", "7 DAYS": "7d", "14 DAYS": "14d",
        };
        const optimisticProposal = {
          id:          tempId,
          title:       title.trim(),
          description: description.trim(),
          status:      "confirming" as const,
          yes: 0, no: 0, abstain: 0, total: 0,
          ends:        `Ends in ${daysMap[duration] ?? "3d"}`,
          endTime:     undefined,
          creator:     signerAddress
            ? `${signerAddress.slice(0, 6)}...${signerAddress.slice(-4)}`
            : "you",
          createdAt:   new Date().toISOString().split("T")[0],
          quorum:      100,
          txHash:      tx.hash,
        };
        setProposals((prev) => [optimisticProposal, ...prev]);

        toast.info("Transaction sent! Menunggu konfirmasi on-chain...", {
          action: { label: "Etherscan →", onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank") },
          duration: 12000,
        });

        // Background: tunggu confirm via RPC fallback (bukan WC provider)
        waitForReceipt(tx.hash).then(async (receipt) => {
          if (receipt.status === 0) {
            // Revert — hapus optimistic card dari list
            setProposals((prev) => prev.filter((p) => p.id !== tempId));
            toast.error("Transaction reverted. Proposal tidak tersimpan.", {
              action: { label: "Etherscan →", onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank") },
              duration: 8000,
            });
            return;
          }

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

          // Hapus optimistic card — fetchFromChain akan inject proposal real
          setProposals((prev) => prev.filter((p) => p.id !== tempId));
          toast.success(`Proposal ${newId} confirmed on Sepolia! 🎉`, {
            action: { label: "Etherscan →", onClick: () => window.open(`https://sepolia.etherscan.io/tx/${tx.hash}`, "_blank") },
            duration: 8000,
          });
          await fetchFromChain(signerAddress);
        }).catch(() => {
          // Timeout — hapus optimistic card dan refresh
          setProposals((prev) => prev.filter((p) => p.id !== tempId));
          fetchFromChain(signerAddress);
        });

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
  }, [proposals, contractReady, fetchFromChain, getActiveProvider]);

  // Wrap setWalletAddress so that when address changes (connect/disconnect/switch),
  // we immediately fetch on-chain votes for the new address before re-render.
  // This closes the window where myVotes is empty and the vote button briefly re-appears.
  const setWalletAddressAndFetch = useCallback(async (address: string | null) => {
    setWalletAddress(address);
    walletAddressRef.current = address;
    if (!address) {
      // Wallet disconnected — clear votes immediately so no stale votes from old address
      setMyVotes({});
      return;
    }
    if (!contractReady || !isOnChain) return;
    try {
      const provider = await getFallbackProvider();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      const choiceMap: Record<number, VoteChoice> = { 1: "yes", 2: "no", 3: "abstain" };
      const voteMap: Record<string, VoteChoice> = {};
      const ids = proposals.map((p) => BigInt(parseInt(p.id.replace("VIP-", ""), 10)));
      await Promise.all(ids.map(async (id) => {
        const choiceNum = Number(await contract.getVote(address, id));
        if (choiceNum > 0) {
          voteMap[`VIP-${String(Number(id)).padStart(3, "0")}`] = choiceMap[choiceNum] ?? "abstain";
        }
      }));
      // Set atomically — replaces any stale votes from previous address
      setMyVotes(voteMap);
    } catch {
      // Non-fatal — the polling useEffect will catch it on next tick
    }
  }, [contractReady, isOnChain, proposals]);

  return (
    <ProposalsContext.Provider value={{
      proposals, myVotes, votingId, hydrated, isOnChain, isLoading,
      vote, createProposal,
      refresh: () => fetchFromChain(null),
      setWalletAddress: setWalletAddressAndFetch,
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
