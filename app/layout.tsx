import type { Metadata } from "next";
import { Syne, Space_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/components/ThemeProvider";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "VoteChain: Decentralized Governance on Sepolia",
  description: "Create proposals, cast votes, and shape the future on Ethereum Sepolia testnet.",
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${syne.variable} ${spaceMono.variable}`} data-scroll-behavior="smooth">
      <body className="antialiased">
        <ThemeProvider>
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--surface)",
                border: "1px solid var(--neon)",
                color: "var(--neon)",
                fontFamily: "var(--font-mono)",
                fontSize: "0.78rem",
                letterSpacing: "0.05em",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
