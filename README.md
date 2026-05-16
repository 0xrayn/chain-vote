# ChainVotes — Decentralized Governance on Sepolia

A Web3 voting dApp built with Next.js 15, Hardhat, and Ethers.js. Proposals dan voting tersimpan **on-chain** di Ethereum Sepolia testnet — transparan, permanen, dan tidak bisa dimanipulasi.

🔗 **Contract:** [`0xb626C2dFabB8312Dc3d284D8054a3a29Ba2258D3`](https://sepolia.etherscan.io/address/0xb626C2dFabB8312Dc3d284D8054a3a29Ba2258D3)

---

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Hardhat** — compile & deploy smart contract
- **Ethers.js v6** — interaksi blockchain
- **Tailwind CSS v4** + **Shadcn/UI**
- **Three.js** — animasi background 3D
- **Framer Motion** — transisi UI
- **Sonner** — toast notifikasi
- **Solidity** — smart contract `ChainVotes.sol`

---

## Pilihan Penggunaan

Ada **2 cara** menggunakan project ini:

### Opsi A — Pakai contract yang sudah ada (Direkomendasikan)

Contract sudah di-deploy di Sepolia. Kamu langsung jalankan frontend-nya saja — tidak perlu deploy ulang, tidak perlu private key.

```bash
git clone https://github.com/username/chainvotes
cd chainvotes
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — proposal langsung muncul dari blockchain.

> Untuk **vote** atau **create proposal**, kamu butuh wallet (MetaMask / Bitget) yang sudah punya Sepolia ETH.

---

### Opsi B — Deploy contract sendiri (untuk development / fork)

Gunakan ini kalau kamu ingin modifikasi smart contract atau deploy instance baru.

**1. Clone & install**
```bash
git clone https://github.com/username/chainvotes
cd chainvotes
npm install
```

**2. Buat file `.env.local`**

Salin dari template:
```bash
cp .env.example .env.local
```

Lalu isi nilainya:
```env
DEPLOYER_PRIVATE_KEY=0xPRIVATE_KEY_WALLET_KAMU
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/API_KEY_KAMU
ETHERSCAN_API_KEY=API_KEY_ETHERSCAN_KAMU   # opsional
NEXT_PUBLIC_CONTRACT_ADDRESS=              # diisi otomatis setelah deploy
```

> ⚠️ Jangan pernah commit `.env.local` ke GitHub — sudah ada di `.gitignore`.

**3. Dapatkan Sepolia ETH (gratis)**

Wallet deployer kamu butuh Sepolia ETH untuk bayar gas:
- [https://sepoliafaucet.com](https://sepoliafaucet.com)
- [https://faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

**4. Deploy contract**
```bash
npm run deploy:sepolia
```

Output yang muncul kalau berhasil:
```
✅ ChainVotes deployed!
📋 Contract address: 0xABC123...
🌱 Seeding demo proposals...
📄 .env.local updated with NEXT_PUBLIC_CONTRACT_ADDRESS=0xABC123...
```

File `lib/contract.ts` dan `.env.local` otomatis terupdate dengan address contract baru.

**5. (Opsional) Verify contract di Etherscan**
```bash
npm run verify -- 0xALAMAT_CONTRACT_KAMU
```

Setelah verify, kode Solidity bisa dibaca publik di Etherscan dan ada tab "Read/Write Contract".

**6. Jalankan frontend**
```bash
npm run dev
```

---

## Setup Wallet untuk Vote

1. Install [MetaMask](https://metamask.io) atau [Bitget Wallet](https://web3.bitget.com)
2. Ganti network ke **Sepolia Testnet** (Chain ID: `11155111`)
3. Isi Sepolia ETH dari faucet di atas
4. Klik **Connect Wallet** di app

---

## Cara Kerja App

```
Buka app
   ↓
Proposal tampil otomatis dari blockchain (tanpa perlu wallet)
   ↓
Connect wallet → bisa vote (FOR / AGAINST / ABSTAIN)
   ↓
Transaksi dikonfirmasi di wallet → vote tersimpan on-chain
   ↓
Toast muncul dengan link ke Etherscan untuk verifikasi
```

---

## Scripts

| Command | Fungsi |
|---|---|
| `npm run dev` | Jalankan frontend development |
| `npm run build` | Build production |
| `npm run compile` | Compile smart contract |
| `npm run deploy:sepolia` | Deploy contract ke Sepolia |
| `npm run deploy:local` | Deploy ke Hardhat local node |
| `npm run verify -- 0x...` | Verify contract di Etherscan |
| `npm run node` | Jalankan Hardhat local node |

---

## Struktur Project

```
chainvotes/
├── app/
│   ├── api/proposals/route.ts  # API route — fetch proposals server-side
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Navbar.tsx
│   ├── Hero.tsx
│   ├── ProposalCard.tsx
│   ├── CreateProposal.tsx
│   ├── Results.tsx
│   ├── ThreeBackground.tsx
│   └── ui/
├── contracts/
│   └── ChainVotes.sol          # Smart contract utama
├── hooks/
│   ├── useWallet.ts
│   └── useProposals.ts         # Logic fetch + vote on-chain
├── lib/
│   ├── contract.ts             # ABI + address (auto-generated setelah deploy)
│   └── utils.ts
├── scripts/
│   └── deploy.ts               # Deploy + seed proposals
├── types/
├── .env.example                # Template environment variables
└── hardhat.config.ts
```

---

## Environment Variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `DEPLOYER_PRIVATE_KEY` | Opsi B | Private key wallet untuk deploy |
| `SEPOLIA_RPC_URL` | Opsi B | RPC URL dari Alchemy/Infura (server-side) |
| `ETHERSCAN_API_KEY` | Opsional | Untuk verify contract |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Auto | Diisi otomatis oleh deploy script |

---

## FAQ

**Q: Apakah saya perlu wallet untuk melihat proposals?**
Tidak. Proposal tampil langsung dari blockchain tanpa perlu connect wallet. Wallet hanya dibutuhkan untuk vote atau create proposal.

**Q: Sepolia ETH habis, di mana minta lagi?**
[sepoliafaucet.com](https://sepoliafaucet.com) atau [faucet.quicknode.com](https://faucet.quicknode.com/ethereum/sepolia). Gratis, tunggu beberapa menit.

**Q: Apakah vote bisa dibatalkan?**
Tidak. Setelah transaksi dikonfirmasi di blockchain, vote bersifat permanen dan tidak bisa diubah.

**Q: Contract address apa yang dipakai?**
[`0xb626C2dFabB8312Dc3d284D8054a3a29Ba2258D3`](https://sepolia.etherscan.io/address/0xb626C2dFabB8312Dc3d284D8054a3a29Ba2258D3) di Sepolia testnet.
