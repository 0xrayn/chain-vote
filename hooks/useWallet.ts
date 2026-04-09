"use client";
import { useState, useCallback } from "react";
import { WalletState } from "@/types";
import { toast } from "sonner";

export function useWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    connected: false,
    address: null,
    chainId: null,
    balance: null,
  });

  const connect = useCallback(async () => {
    // Simulate wallet connection (replace with real MetaMask logic)
    const mockAddr =
      "0x" +
      Array.from({ length: 40 }, () =>
        "0123456789abcdef"[Math.floor(Math.random() * 16)]
      ).join("");

    setWallet({
      connected: true,
      address: mockAddr,
      chainId: 11155111, // Sepolia
      balance: (Math.random() * 2 + 0.1).toFixed(4),
    });
    toast.success("Wallet connected to Sepolia");
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ connected: false, address: null, chainId: null, balance: null });
    toast.info("Wallet disconnected");
  }, []);

  const shortAddress = wallet.address
    ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`
    : null;

  return { wallet, connect, disconnect, shortAddress };
}
