/**
 * Shared RPC utility — used by both server (API route) and client (WalletContext).
 * Falls back automatically: tries each URL in order until one succeeds.
 */
import { ethers } from "ethers";

export const SEPOLIA_RPC_URLS = [
  // Put your own RPC first via env var for best reliability
  typeof process !== "undefined" ? (process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? process.env.SEPOLIA_RPC_URL) : undefined,
  "https://ethereum-sepolia-rpc.publicnode.com",
  "https://sepolia.drpc.org",
  "https://rpc.sepolia.org",
  "https://rpc2.sepolia.org",
].filter(Boolean) as string[];

/**
 * Call `fn` with each RPC URL in order until one succeeds.
 * Throws only if ALL URLs fail.
 */
export async function withRpcFallback<T>(
  fn: (rpcUrl: string) => Promise<T>
): Promise<T> {
  let lastError: unknown;
  for (const url of SEPOLIA_RPC_URLS) {
    try {
      return await fn(url);
    } catch (err: any) {
      lastError = err;
      const short = err?.message?.slice(0, 80) ?? "unknown";
      console.warn(`[RPC] ${url} failed: ${short}`);
    }
  }
  throw lastError ?? new Error("All Sepolia RPC endpoints failed");
}

/**
 * Returns a JsonRpcProvider, trying each URL until one is reachable.
 */
export async function getFallbackProvider(): Promise<ethers.JsonRpcProvider> {
  return withRpcFallback(async (url) => {
    const p = new ethers.JsonRpcProvider(url, undefined, { staticNetwork: true });
    // Ping to confirm it's alive before returning
    await p.getBlockNumber();
    return p;
  });
}
