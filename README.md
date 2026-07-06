# LUCID.drop — Premium Solana Casino

A high-energy, dark-themed Solana casino with Crash, Slots, and Coin Flip games.

**Architecture:** Hybrid custodial model — real SOL deposits/withdrawals on-chain, fast in-game bets via internal balance (MongoDB). Same pattern as Solpump-style casinos.

## Features

- Phantom wallet integration
- Crash game with auto-cashout
- Slots with jackpot
- Coin Flip
- Live leaderboard
- Live chat (Socket.io)
- Provably fair seed verification
- Rakeback system
- Hot streak indicator
- Cashout celebration with falling SOL coins

## Tech Stack

- **Frontend:** React 18, Tailwind CSS, Zustand
- **Backend:** Node.js, Express, Socket.io
- **Database:** MongoDB (Atlas free tier or local Docker)
- **Blockchain:** Solana Web3.js (devnet for dev, mainnet for production)

## Prerequisites

- Node.js 18+
- MongoDB (local, Docker, or [MongoDB Atlas free tier](https://mongodb.com/atlas))
- Phantom wallet browser extension
- Solana devnet SOL for testing ([faucet](https://faucet.solana.com))

## Quick Start

### 1. Environment

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — set MONGODB_URI, JWT_SECRET, CASINO_PRIVATE_KEY

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Generate casino wallet (devnet)

```bash
node -e "const {Keypair}=require('@solana/web3.js'); const bs58=require('bs58'); const kp=Keypair.generate(); console.log('CASINO_PRIVATE_KEY='+bs58.encode(kp.secretKey)); console.log('CASINO_WALLET_PUBLIC_KEY='+kp.publicKey.toString());"
```

Fund the public key via the Solana devnet faucet, then set `SOLANA_RPC=https://api.devnet.solana.com`.

### 3. MongoDB (Docker)

```bash
docker compose up -d mongodb
```

### 4. Run

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm start
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Where | Description |
|----------|-------|-------------|
| `MONGODB_URI` | backend | MongoDB connection string |
| `JWT_SECRET` | backend | JWT signing secret |
| `CASINO_PRIVATE_KEY` | backend | Base58 casino wallet secret |
| `CASINO_WALLET_PUBLIC_KEY` | backend | Casino wallet public key |
| `SOLANA_RPC` | backend | Solana RPC URL (devnet or mainnet) |
| `FRONTEND_URL` | backend | CORS origin (e.g. `http://localhost:3000`) |
| `REACT_APP_API_URL` | frontend | Backend API (e.g. `http://localhost:5000`) |
| `REACT_APP_WS_URL` | frontend | WebSocket URL (e.g. `ws://localhost:5000`) |

## Free Tier Deployment

- **Backend:** [Render](https://render.com) free web service
- **Frontend:** [Vercel](https://vercel.com) free tier
- **Database:** MongoDB Atlas M0 (free)
- **RPC:** Public devnet RPC or [Helius](https://helius.dev) free tier

See `DEPLOY.md` for full deployment steps.

## Smart Contracts

The `smart-contract/` folder contains a legacy Hardhat/Solidity scaffold. **Runtime uses Solana Web3.js only** — no Ethereum contract required for gameplay.
