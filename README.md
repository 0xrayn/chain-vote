# ChainVotes — Decentralized Governance on Sepolia

> Proposal creation dan voting **on-chain** di Ethereum Sepolia — transparan, permanen, tidak bisa dimanipulasi.

![ChainVotes Banner](docs/images/banner.png)

🔗 **Live Contract:** [`0xb626C2dFabB8312Dc3d284D8054a3a29Ba2258D3`](https://sepolia.etherscan.io/address/0xb626C2dFabB8312Dc3d284D8054a3a29Ba2258D3)  
👤 **Author:** [@0xrayn](https://github.com/0xrayn)

---

## Screenshots

| Halaman Utama | Detail Proposal | Hasil Voting |
|---|---|---|
| ![Home](docs/images/home.png) | ![Proposal](docs/images/proposal-detail.png) | ![Results](docs/images/results.png) |

---

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | Next.js 15 (App Router, TypeScript) |
| Smart Contract | Solidity `^0.8.24` via Hardhat |
| Blockchain Client | Ethers.js v6 |
| Styling | Tailwind CSS v4 + Shadcn/UI |
| 3D Background | Three.js |
| Animasi | Framer Motion |
| Notifikasi | Sonner |
| Wallet Support | MetaMask, Bitget, Coinbase, Brave (EIP-6963) |

---

## Cara Pakai

Ada **2 opsi** menjalankan project ini:

### Opsi A — Pakai contract yang sudah ada *(Direkomendasikan)*

Contract sudah di-deploy di Sepolia. Kamu cukup jalankan frontend — tidak perlu private key, tidak perlu deploy ulang.

```bash
git clone https://github.com/0xrayn/chainvotes
cd chainvotes
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) — proposal langsung muncul dari blockchain.

> Untuk **vote** atau **create proposal**, kamu butuh wallet (MetaMask / Bitget) dengan saldo Sepolia ETH.

---

### Opsi B — Deploy contract sendiri *(untuk fork / development)*

**1. Clone & install**
```bash
git clone https://github.com/0xrayn/chainvotes
cd chainvotes
npm install
```

**2. Buat file `.env.local`**
```bash
cp .env.example .env.local
```

Isi nilainya:
```env
DEPLOYER_PRIVATE_KEY=0xPRIVATE_KEY_WALLET_KAMU
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/API_KEY_KAMU
ETHERSCAN_API_KEY=API_KEY_ETHERSCAN_KAMU   # opsional
NEXT_PUBLIC_CONTRACT_ADDRESS=              # diisi otomatis setelah deploy
```

> ⚠️ **PENTING:** Jangan pernah commit `.env.local` ke GitHub. File ini sudah masuk `.gitignore`.

**3. Dapatkan Sepolia ETH (gratis)**

- [sepoliafaucet.com](https://sepoliafaucet.com)
- [faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)

**4. Deploy contract**
```bash
npm run deploy:sepolia
```

Output berhasil:
```
✅ ChainVotes deployed!
📋 Contract address: 0xABC123...
🌱 Seeding demo proposals...
📄 .env.local updated with NEXT_PUBLIC_CONTRACT_ADDRESS=0xABC123...
```

**5. (Opsional) Verify contract di Etherscan**
```bash
npm run verify -- 0xALAMAT_CONTRACT_KAMU
```

Setelah verify, kode Solidity bisa diaudit publik dan Etherscan menampilkan tab "Read/Write Contract".

**6. Jalankan frontend**
```bash
npm run dev
```

---

## Setup Wallet

1. Install [MetaMask](https://metamask.io) atau [Bitget Wallet](https://web3.bitget.com)
2. Ganti network ke **Sepolia Testnet** (Chain ID: `11155111`)
3. Isi Sepolia ETH dari faucet
4. Klik **Connect Wallet** di app

---

## Alur Kerja App

```
Buka app
   ↓
Proposal tampil otomatis dari blockchain (tanpa wallet)
   ↓
Connect wallet → bisa vote (FOR / AGAINST / ABSTAIN)
   ↓
Konfirmasi transaksi di wallet → vote tersimpan on-chain
   ↓
Toast muncul + link Etherscan untuk verifikasi
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
│   ├── api/proposals/route.ts  # API route (server-side, dengan cache 10s)
│   ├── analytics/page.tsx
│   ├── explore/page.tsx
│   ├── proposal/[id]/page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
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
│   └── ChainVotes.sol          # Smart contract utama
├── hooks/
│   ├── useWallet.ts            # EIP-6963 multi-wallet support
│   └── useProposals.ts         # Fetch + vote logic
├── lib/
│   ├── contract.ts             # ABI + address (auto-generated)
│   └── utils.ts
├── scripts/
│   └── deploy.ts               # Deploy + seed proposals
├── types/
├── .env.example                # Template env — AMAN untuk commit
└── hardhat.config.ts
```

---

## Environment Variables

| Variable | Wajib | Keterangan |
|---|---|---|
| `DEPLOYER_PRIVATE_KEY` | Opsi B | Private key untuk deploy. **Server-only, jangan commit!** |
| `SEPOLIA_RPC_URL` | Opsi B | RPC URL dari Alchemy/Infura. **Server-only.** |
| `ETHERSCAN_API_KEY` | Opsional | Untuk verify contract di Etherscan |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | Auto | Diisi otomatis oleh deploy script |

> ⚠️ **Jangan pernah prefix RPC URL dengan `NEXT_PUBLIC_`** — itu akan mengekspos API key kamu ke browser/client.

---

## Security Audit

### Smart Contract (`ChainVotes.sol`)

| Status | Aspek | Detail |
|---|---|---|
| ✅ AMAN | Double voting dicegah | `AlreadyVoted` error + mapping `votes[address][proposalId]` — 1 wallet = 1 vote per proposal |
| ✅ AMAN | Validasi input on-chain | Title ≥ 10 karakter, description ≥ 20 karakter, duration ≠ 0 dan ≤ 30 hari |
| ✅ AMAN | Tidak ada fungsi owner berbahaya | Tidak ada `selfdestruct`, `withdraw`, atau `onlyOwner` yang manipulatif |
| ✅ AMAN | Status berbasis `block.timestamp` | Tidak bisa dimanipulasi siapapun termasuk deployer |
| ⚠️ PERHATIAN | Siapapun bisa buat proposal | Tidak ada minimum stake — oke untuk testnet, perlu pertimbangan di mainnet |
| ⚠️ PERHATIAN | Quorum tidak di-enforce on-chain | Quorum tersimpan di contract tapi tidak memblokir proposal "passed" jika tidak tercapai — ditangani di frontend |

### API & Frontend

| Status | Aspek | Detail |
|---|---|---|
| ✅ FIXED | Rate limiting / DDoS protection | Cache in-memory 10 detik + header `Cache-Control: s-maxage=10` |
| ✅ FIXED | RPC URL tidak bocor ke client | Hanya `SEPOLIA_RPC_URL` (server-only) yang dipakai di API route |
| ✅ AMAN | Voting divalidasi on-chain | Manipulasi via frontend tidak mungkin — contract yang final |

---

## FAQ

**Q: Apakah saya perlu wallet untuk melihat proposals?**  
Tidak. Proposal tampil langsung dari blockchain tanpa wallet. Wallet hanya dibutuhkan untuk vote atau create proposal.

**Q: Sepolia ETH habis?**  
[sepoliafaucet.com](https://sepoliafaucet.com) atau [faucet.quicknode.com](https://faucet.quicknode.com/ethereum/sepolia). Gratis, tunggu beberapa menit.

**Q: Apakah vote bisa dibatalkan?**  
Tidak. Setelah transaksi dikonfirmasi di blockchain, vote bersifat permanen dan tidak bisa diubah.

**Q: Wallet apa saja yang didukung?**  
MetaMask, Bitget Wallet, Coinbase Wallet, Brave Wallet — semua wallet yang mendukung standar EIP-6963.

---

## License

MIT © [0xrayn](https://github.com/0xrayn)
