import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";

// ─── In-memory cache (10-second TTL) ─────────────────────────────────────────
// Mencegah spam ke Alchemy RPC — tanpa cache, 1000 req/detik = 1000 RPC calls.
let cachedPayload: string | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 10_000;

function secondsToLabel(remaining: bigint): string {
  if (remaining <= 0n) return "ENDED";
  const days  = remaining / 86400n;
  const hours = (remaining % 86400n) / 3600n;
  const mins  = (remaining % 3600n)  / 60n;
  if (days > 0n)  return `${days}d ${hours}h`;
  if (hours > 0n) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

// FIX: tambah explicit case untuk code === 1 (Active)
function statusFromCode(code: number): string {
  if (code === 0) return "pending";
  if (code === 1) return "active";
  if (code === 2) return "ended";
  return "active"; // safe default
}

export async function GET() {
  if (!CONTRACT_ADDRESS) {
    return NextResponse.json({ error: "Contract not deployed" }, { status: 503 });
  }

  // ── Serve dari cache jika masih fresh ──────────────────────────────────────
  if (cachedPayload && Date.now() < cacheExpiresAt) {
    return new NextResponse(cachedPayload, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=5",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    // Hanya gunakan SEPOLIA_RPC_URL (server-side only) — jangan pakai NEXT_PUBLIC_
    const rpcUrl = process.env.SEPOLIA_RPC_URL ?? "https://rpc2.sepolia.org";
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const [ids, titles, creators, yesArr, noArr, abstainArr, endTimes, statuses] =
      await contract.getAllProposals() as [
        bigint[], string[], string[], bigint[], bigint[], bigint[], bigint[], number[]
      ];

    const now = BigInt(Math.floor(Date.now() / 1000));

    // Parallel fetch descriptions (Promise.all = concurrent, bukan sequential)
    const descriptions = await Promise.all(
      ids.map(async (id) => {
        try {
          const [,, desc] = await contract.getProposal(id) as [bigint, string, string, ...unknown[]];
          return desc as string;
        } catch {
          return "";
        }
      })
    );

    const proposals = ids.map((id, i) => {
      const remaining = endTimes[i] - now;
      return {
        id:          `VIP-${String(Number(id)).padStart(3, "0")}`,
        title:       titles[i],
        description: descriptions[i] ?? "",
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

    const body = JSON.stringify({ proposals });

    // Simpan ke cache
    cachedPayload = body;
    cacheExpiresAt = Date.now() + CACHE_TTL_MS;

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=10, stale-while-revalidate=5",
        "X-Cache": "MISS",
      },
    });
  } catch (err: any) {
    console.error("[API /proposals] error:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch" }, { status: 500 });
  }
}
