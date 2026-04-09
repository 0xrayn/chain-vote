# VoteChain — Decentralized Governance on Sepolia

A Web3 voting dApp frontend built with Next.js 15, Tailwind v4, Three.js, and Shadcn/UI.

## Tech Stack

- **Next.js 15.2** (App Router, TypeScript)
- **Tailwind CSS v4** (PostCSS plugin)
- **Three.js** — animated 3D background (particles, wireframe grid, floating nodes)
- **Shadcn/UI** — custom components (Button, Card, Badge, Progress, Input, Textarea, Tooltip)
- **Framer Motion** — transitions
- **Sonner** — toast notifications
- **Lucide React** — icons
- **Ethers.js v6** — ready for wallet integration

## Features

- 🗳 **Proposals** — browse active, ended, and pending proposals
- ✅ **Vote** — cast FOR / AGAINST / ABSTAIN with animated progress bars
- ➕ **Create** — deploy new proposals with title, description, and duration
- 📊 **Results** — visualize vote outcomes with bar charts
- 👛 **Wallet** — connect/disconnect (mock, ready for MetaMask)
- 🌐 **Sepolia** — targeted at Ethereum Sepolia testnet

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── layout.tsx       # Root layout with fonts & Toaster
│   ├── page.tsx         # Main page with tabs
│   └── globals.css      # Tailwind v4 + CSS variables
├── components/
│   ├── ThreeBackground.tsx  # Three.js animated canvas
│   ├── Navbar.tsx           # Sticky nav + wallet connect
│   ├── Hero.tsx             # Stats header
│   ├── ProposalCard.tsx     # Vote card with animated bars
│   ├── CreateProposal.tsx   # Proposal form
│   ├── Results.tsx          # Results view
│   └── ui/                  # Shadcn-style UI primitives
│       ├── button.tsx
│       ├── badge.tsx
│       ├── card.tsx
│       ├── progress.tsx
│       ├── input.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
├── hooks/
│   ├── useWallet.ts     # Wallet state management
│   └── useProposals.ts  # Proposals + voting logic
├── lib/
│   ├── utils.ts         # cn() helper
│   └── data.ts          # Mock proposals
└── types/
    └── index.ts         # TypeScript types
```

## Connecting Real Wallet (MetaMask)

Replace `useWallet.ts` connect logic with:

```ts
const provider = new ethers.BrowserProvider(window.ethereum);
await provider.send("eth_requestAccounts", []);
const signer = await provider.getSigner();
const address = await signer.getAddress();
```

Make sure MetaMask is set to **Sepolia Testnet** (Chain ID: `11155111`).

## Next Steps — Smart Contract

1. Write `Voting.sol` with `createProposal()`, `vote()`, `getResults()`
2. Deploy to Sepolia via Hardhat or Foundry
3. Wire up `useProposals.ts` to call contract functions via ethers.js
