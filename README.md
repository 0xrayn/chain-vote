# ChainVotes

On-chain proposal creation and voting on Ethereum Sepolia. Transparent, permanent, and tamper-proof.

![ChainVotes Banner](docs/images/banner.png)

**Live Contract:** [`0xb626C2dFabB8312Dc3d284D8054a3a29Ba2258D3`](https://sepolia.etherscan.io/address/0xb626C2dFabB8312Dc3d284D8054a3a29Ba2258D3)

**Author:** [@0xrayn](https://github.com/0xrayn)

---

## Screenshots

### Governance / Main Dashboard

The landing page shows live on-chain stats (total proposals, total votes, pass rate) alongside all active proposals. No wallet needed to view.

![Governance Dashboard](docs/images/governance.png)

### Proposal Cards

Each card shows real-time vote counts and percentages pulled directly from the blockchain. Three vote options:

**FOR** means you support the proposal and want it to pass. **AGAINST** means you oppose it. **ABSTAIN** means you acknowledge the proposal but choose not to influence the FOR/AGAINST outcome. It still counts toward quorum.

Every vote is an actual Ethereum transaction. Once confirmed on-chain it cannot be changed.

![Proposal Cards](docs/images/proposal-vote.png)

### Proposal Detail

Full detail page with the complete description, creator address, time remaining, quorum progress bar, and a live vote breakdown chart. You can also cast your vote from here.

![Proposal Detail](docs/images/proposal-detail.png)

### Create Proposal

Any connected wallet can submit a new governance proposal. Requires a title (min 10 characters), description (min 20 characters), and a voting duration of 1, 3, 7, or 14 days. Proposals go live on-chain the moment the transaction confirms.

![Create Proposal](docs/images/create-proposal.png)

### Explore

Search proposals by title, description, or ID. Filter by status: ALL, ACTIVE, PENDING, or ENDED. Useful once the number of proposals grows.

![Explore](docs/images/explore.png)

### Analytics

Real-time governance statistics from the blockchain. Shows total proposals over time, vote distribution across all proposals, top proposals by participation, and the overall pass rate.

![Analytics](docs/images/analytics.png)

### Docs

In-app documentation covering how the smart contract works, the ABI and function signatures, and local setup instructions.

![Docs](docs/images/docs.png)

### Profile

Connect your wallet to see your personal voting history: every proposal you voted on, which choice you made, and a direct Etherscan link for each transaction.

![Profile](docs/images/profile.png)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.2 (App Router, TypeScript) |
| Smart Contract | Solidity `^0.8.24` via Hardhat |
| Blockchain Client | Ethers.js v6 |
| Styling | Tailwind CSS v4 + Shadcn/UI |
| 3D Background | Three.js |
| Animations | Framer Motion |
| Notifications | Sonner |
| Wallet Support | MetaMask, Bitget, Coinbase, Brave (EIP-6963) |

---

## Getting Started

### Option A: Use the existing contract (Recommended)

The contract is already deployed on Sepolia. Just run the frontend: no private key or deployment needed.

```bash
git clone https://github.com/0xrayn/chainvotes
cd chainvotes
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and proposals load directly from the blockchain.

To vote or create a proposal you need a wallet (MetaMask or Bitget) with some Sepolia ETH.

### Option B: Deploy your own contract

**1. Clone and install**

```bash
git clone https://github.com/0xrayn/chainvotes
cd chainvotes
npm install
```

**2. Create `.env.local`**

```bash
cp .env.example .env.local
```

Fill in your values:

```env
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
ETHERSCAN_API_KEY=YOUR_ETHERSCAN_KEY
NEXT_PUBLIC_CONTRACT_ADDRESS=
```

Never commit `.env.local` to GitHub. It is already in `.gitignore`.

**3. Get Sepolia ETH (free)**

[sepoliafaucet.com](https://sepoliafaucet.com) or [faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

**4. Deploy**

```bash
npm run deploy:sepolia
```

**5. Verify on Etherscan (optional)**

```bash
npm run verify -- 0xYOUR_CONTRACT_ADDRESS
```

**6. Start the app**

```bash
npm run dev
```

---

## Wallet Setup

1. Install [MetaMask](https://metamask.io) or [Bitget Wallet](https://web3.bitget.com)
2. Switch to Sepolia Testnet (Chain ID: 11155111)
3. Get Sepolia ETH from a faucet
4. Click Connect Wallet in the app

---

## How It Works

```
Open app
Proposals load automatically from the blockchain (no wallet needed)
Connect wallet to vote FOR / AGAINST / ABSTAIN
Confirm the transaction in your wallet
Vote is stored permanently on-chain
Toast appears with an Etherscan link to verify your transaction
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run compile` | Compile the smart contract |
| `npm run deploy:sepolia` | Deploy contract to Sepolia |
| `npm run deploy:local` | Deploy to local Hardhat node |
| `npm run verify -- 0x...` | Verify contract on Etherscan |
| `npm run node` | Start local Hardhat node |

---

## Project Structure

```
chainvotes/
├── app/
│   ├── api/proposals/route.ts   server-side API with 10s cache
│   ├── analytics/page.tsx       governance stats
│   ├── explore/page.tsx         search and filter
│   ├── proposal/[id]/page.tsx   proposal detail and voting
│   ├── docs/page.tsx            in-app documentation
│   ├── profile/page.tsx         personal voting history
│   ├── layout.tsx
│   ├── page.tsx                 main governance page
│   └── globals.css
├── context/
│   └── ProposalsContext.tsx     single shared data source for all pages
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── ProposalCard.tsx
│   ├── CreateProposal.tsx
│   ├── Results.tsx
│   ├── ConnectWalletModal.tsx
│   ├── ThreeBackground.tsx
│   └── ui/
├── contracts/
│   └── ChainVotes.sol
├── hooks/
│   ├── useWallet.ts             EIP-6963 multi-wallet support
│   └── useProposals.ts          re-exports from context
├── lib/
│   ├── contract.ts              ABI and address
│   └── utils.ts
├── scripts/
│   └── deploy.ts
├── types/
├── .env.example
└── hardhat.config.ts
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DEPLOYER_PRIVATE_KEY` | Option B | Deployer wallet key. Server-only, never commit. |
| `SEPOLIA_RPC_URL` | Option B | Alchemy or Infura RPC URL. Server-only, never use NEXT_PUBLIC_ prefix. |
| `ETHERSCAN_API_KEY` | Optional | For contract verification on Etherscan |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Auto | Filled automatically by the deploy script |

---

## Security

### Smart Contract

| Status | Aspect | Detail |
|---|---|---|
| SAFE | Double voting prevented | `AlreadyVoted` error plus `votes[address][proposalId]` mapping, enforced on-chain |
| SAFE | Input validation on-chain | Title min 10 chars, description min 20 chars, duration between 1 second and 30 days |
| SAFE | No dangerous owner functions | No `selfdestruct`, no `withdraw`, no manipulative `onlyOwner` |
| SAFE | Time-based status | Computed from `block.timestamp`, cannot be manipulated by anyone including the deployer |
| NOTE | Anyone can create proposals | No minimum stake. Fine for testnet, consider restricting for mainnet. |
| NOTE | Quorum not enforced on-chain | Quorum is a frontend display only; the contract does not block results if quorum is not met |

### API and Frontend

| Status | Aspect | Detail |
|---|---|---|
| FIXED | Rate limiting | 10-second in-memory cache plus `Cache-Control: s-maxage=10` header |
| FIXED | Cache invalidation after vote | Client calls `POST /api/proposals` after `tx.wait()` so the UI updates immediately |
| FIXED | RPC key not exposed to client | Only `SEPOLIA_RPC_URL` (server-only env var) is used in the API route |
| FIXED | No redundant RPC calls | Proposals are fetched once via React Context and shared across all pages |
| SAFE | Votes validated on-chain | The contract is the source of truth, frontend manipulation is impossible |

---

## FAQ

**Do I need a wallet to view proposals?**
No. Proposals load from the blockchain without any wallet connection. A wallet is only needed to vote or create proposals.

**Can I change my vote after submitting?**
No. Once a transaction confirms on-chain, your vote is permanent and cannot be modified.

**What wallets are supported?**
MetaMask, Bitget Wallet, Coinbase Wallet, and Brave Wallet. Any wallet that implements EIP-6963 works.

**Where do I get Sepolia ETH?**
[sepoliafaucet.com](https://sepoliafaucet.com) or [faucet.quicknode.com](https://faucet.quicknode.com/ethereum/sepolia). Free, arrives in a few minutes.

**What does ABSTAIN mean?**
Abstaining means you participate in governance without influencing the FOR/AGAINST result. It counts toward quorum but not toward the pass or fail decision.

---

## License

MIT © [0xrayn](https://github.com/0xrayn)
