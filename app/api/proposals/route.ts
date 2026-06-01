import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "@/lib/contract";
import { getFallbackProvider } from "@/lib/rpc";

// ─── In-memory cache (10-second TTL) ─────────────────────────────────────────
let cachedPayload: string | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 10_000;

// Strip non-printable / control characters from on-chain strings before serving to client
function sanitizeStr(s: string, maxLen: number): string {
  return s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "").slice(0, maxLen);
}

function secondsToLabel(remaining: bigint): string {
  if (remaining <= 0n) return "ENDED";
  const days  = remaining / 86400n;
  const hours = (remaining % 86400n) / 3600n;
  const mins  = (remaining % 3600n)  / 60n;
  if (days > 0n)  return `${days}d ${hours}h`;
  if (hours > 0n) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function statusFromCode(code: number): string {
  if (code === 0) return "pending";
  if (code === 1) return "active";
  if (code === 2) return "ended";
  return "active";
}

export async function GET() {
  if (!CONTRACT_ADDRESS) {
    return NextResponse.json({ error: "Contract not deployed" }, { status: 503 });
  }

  // Serve from cache if still fresh
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
    // Auto-fallback: tries each RPC until one works
    const provider = await getFallbackProvider();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

    const [ids, titles, creators, yesArr, noArr, abstainArr, endTimes, statuses] =
      await contract.getAllProposals() as [
        bigint[], string[], string[], bigint[], bigint[], bigint[], bigint[], number[]
      ];

    const now = BigInt(Math.floor(Date.now() / 1000));

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
      // Hitung status dari endTime (waktu server) — jangan percaya buta ke enum kontrak
      // karena data bisa stale di cache, dan block.timestamp blockchain bisa sedikit beda
      const statusStr = now > endTimes[i]
        ? "ended"
        : statusFromCode(statuses[i]);
      return {
        id:          `VIP-${String(Number(id)).padStart(3, "0")}`,
        title:       sanitizeStr(titles[i], 200),
        description: sanitizeStr(descriptions[i] ?? "", 2000),
        status:      statusStr,
        yes:         Number(yesArr[i]),
        no:          Number(noArr[i]),
        abstain:     Number(abstainArr[i]),
        total:       Number(yesArr[i]) + Number(noArr[i]) + Number(abstainArr[i]),
        ends:        secondsToLabel(remaining > 0n ? remaining : 0n),
        endTime:     Number(endTimes[i]),
        creator:     `${creators[i].slice(0, 6)}...${creators[i].slice(-4)}`,
        createdAt:   "",
        quorum:      100,
      };
    });

    const body = JSON.stringify({ proposals });
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
    console.error("[API /proposals] All RPCs failed:", err?.message);
    return NextResponse.json({ error: err?.message ?? "Failed to fetch" }, { status: 500 });
  }
}

// POST /api/proposals — invalidate cache after vote/create
export async function POST(request: Request) {
  const secret = process.env.INTERNAL_CACHE_SECRET;
  if (secret) {
    const provided = request.headers.get("x-internal-secret");
    if (provided !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
  cachedPayload = null;
  cacheExpiresAt = 0;
  return NextResponse.json({ ok: true });
}
