# LUCID.drop — Backend Documentation

## Overview
The backend is a Node.js/Express server that powers the Solana casino platform. It handles user management, bet processing, game logic, WebSocket real-time updates, and Solana blockchain integration.

**Tech Stack:** Node.js, Express, Socket.io, MongoDB (Mongoose), Solana Web3.js, Winston logging

---

## Root Files

### `backend/package.json`
**Purpose:** Project manifest and dependency management
- **Scripts:** `start` (production), `dev` (nodemon hot-reload)
- **Dependencies:**
  - `@solana/web3.js` — Solana blockchain interaction
  - `express` — REST API server
  - `socket.io` — Real-time WebSocket communication
  - `mongoose` — MongoDB ODM
  - `jsonwebtoken` — JWT authentication
  - `winston` — Structured logging
  - `cors`, `dotenv`, `bcryptjs`, `uuid`
- **DevDependencies:** `nodemon` for development

### `backend/Dockerfile`
**Purpose:** Containerizes the backend for Docker deployment
- Uses `node:18-alpine` base image
- Copies package files, runs `npm install`
- Exposes port 3001
- Starts with `node src/index.js`

### `backend/logs/` (directory)
**Purpose:** Stores Winston log files
- `error.log` — Error-level logs only
- `combined.log` — All logs

---

## Source Code Structure

### `backend/src/index.js` — Main Entry Point
**Purpose:** Initializes the Express server, middleware, routes, WebSocket, and database connection
- Loads environment variables via `dotenv`
- Creates HTTP server with Socket.io for real-time communication
- **Middleware:** CORS, JSON parsing
- **Routes mounted:** `/api/users`, `/api/bets`, `/api/games`, `/api/health`
- **WebSocket events:**
  - `newBet` → broadcasts `betUpdate` to all clients
  - `crashUpdate` → broadcasts `crashEvent`
  - `chat` → broadcasts chat messages
- Global error handler logs errors with Winston
- Starts server on `PORT` (default 5000)

---

## Middleware (`backend/src/middleware/`)

### `auth.js` — JWT Authentication
**Purpose:** Verifies JWT tokens from `Authorization` header
- Extracts token from `Bearer <token>`
- Verifies with `JWT_SECRET`
- Attaches decoded user to `req.user`
- Returns 401 if token missing or invalid

### `cors.js` — CORS Configuration
**Purpose:** Exports CORS options for cross-origin requests
- Allows origin from `FRONTEND_URL` env or `http://localhost:3000`
- Methods: GET, POST, PUT, DELETE
- Headers: Content-Type, Authorization
- Credentials enabled

### `rateLimit.js` — Request Rate Limiting
**Purpose:** Prevents API abuse
- **General limiter:** 100 requests per 15 minutes per IP
- **Bet limiter:** 10 bets per minute per IP (stricter for betting endpoints)

---

## Models (`backend/src/models/`)

### `User.js` — User Schema
**Purpose:** Stores player account data
- `walletAddress` (string, unique, required) — Solana wallet address
- `balance` (number) — Internal casino balance
- `totalWagered` (number) — Lifetime amount bet
- `totalWon` (number) — Lifetime winnings
- `createdAt`, `lastActive` — Timestamps

### `Bet.js` — Bet Schema
**Purpose:** Records every bet placed
- `userId` — Reference to User (optional)
- `walletAddress` (string, required) — Player's wallet
- `game` (enum: 'crash', 'slots', 'coinflip') — Game type
- `amount` (number) — Bet amount in SOL
- `multiplier` (number) — Applied multiplier
- `result` (enum: 'win', 'loss') — Outcome
- `profit` (number) — Profit/loss amount
- `timestamp` — When bet was placed

### `Session.js` — Session Schema
**Purpose:** Manages user sessions for JWT
- `walletAddress` — User's wallet
- `token` — JWT token string
- `expiresAt` — 7 days from creation
- `createdAt` — Session creation timestamp

---

## Routes (`backend/src/routes/`)

### `users.js` — User Management
**Purpose:** Handles user data retrieval and balance updates
- `GET /:wallet` — Fetches or creates user with real-time Solana balance
  - Validates wallet address with Solana `PublicKey`
  - Calls `solana.getBalance()` for on-chain balance
  - Creates user if not exists, updates balance
- `POST /:wallet/balance` — Updates user's balance (internal use)

### `bets.js` — Bet Operations
**Purpose:** Handles bet placement, history, and leaderboard
- `POST /` — Places a bet
  - Creates Bet document
  - Updates user's `totalWagered`, `totalWon`, `balance`
- `GET /:wallet` — Returns last 50 bets for a user (sorted newest first)
- `GET /leaderboard/top` — Returns top 10 users by `totalWon`

### `games.js` — Game Logic
**Purpose:** Core game mechanics for Crash, Slots, and bonus features

**Bonus:**
- `GET /bonus/status` — Returns bonus timer and active status (15% bonus every 5 minutes)

**Jackpot:**
- `GET /jackpot` — Aggregates total winnings from all winning bets

**Crash Game:**
- `POST /crash/result` — Generates deterministic crash point
  - Uses server seed + client seed → SHA256 hash
  - Crash point = 1.5 + (hash % 850) / 100
  - Saves bet as 'loss' with profit = -betAmount
- `POST /crash/cashout` — Processes cashout
  - Calculates winAmount = betAmount * multiplier
  - Profit = winAmount - betAmount
  - Saves as 'win', updates user balance and totalWon

**Slots:**
- `POST /slots/result` — Simulates slot machine spin
  - Weighted symbols: 🍒(25), 🍋(20), 🍊(18), 🍇(15), 💎(10), 7️⃣(6), ⭐(4), 🎰(2)
  - Multipliers: 3 matching = 1.5x-100x; 2 matching = 1.5x
  - Saves winning bets, updates user balance

### `health.js` — Health Check
**Purpose:** Service health monitoring
- `GET /` — Returns status, uptime, database connection state, version

---

## Services (`backend/src/services/`)

### `bonus.js` — Bonus Timer Service
**Purpose:** Manages periodic bonus events
- 5-minute countdown timer (300 seconds)
- Toggles bonus active/inactive every cycle
- Returns: `timeLeft`, `active`, `bonusPercent` (15% when active)

### `solana.js` — Solana Blockchain Interaction
**Purpose:** Core Solana RPC operations
- `getBalance(walletAddress)` — Fetches SOL balance from blockchain
  - Converts lamports to SOL (divide by LAMPORTS_PER_SOL)
- `validateWallet(walletAddress)` — Checks if address is a valid Solana public key

### `solanaStealth.js` — Stealth Transfer (Mock)
**Purpose:** Simulates privacy-preserving SOL transfers with obfuscation
- **Current implementation:** Mock-only (not actually sending real transactions)
- Generates 5 fake transactions + 1 real transfer
- Returns a mock Base58-encoded signature
- **Note:** This is a simulation; real Solana transactions would require private key signing

---

## Utilities (`backend/src/utils/`)

### `logger.js` — Winston Logger
**Purpose:** Structured logging with multiple transports
- **Level:** Configurable via `LOG_LEVEL` env (default: 'info')
- **Format:** JSON with timestamps
- **Transports:**
  - Console with colorized, simple format
  - File (`logs/error.log`) — Error-level only
  - File (`logs/combined.log`) — All logs
- Exported as `logger` for use across the backend

---

## Environment Variables Required

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/luciddrop` |
| `JWT_SECRET` | Secret for JWT signing | — |
| `SOLANA_RPC` | Solana RPC endpoint | `https://api.mainnet-beta.solana.com` |
| `FRONTEND_URL` | Allowed CORS origin | `http://localhost:3000` |
| `LOG_LEVEL` | Logging verbosity | `info` |

---

## Data Flow Summary

1. **User connects wallet** → Frontend calls `GET /api/users/:wallet` → Backend fetches on-chain balance, creates/updates user
2. **User places bet** → Frontend calls `POST /api/bets` → Backend saves bet, updates user stats, broadcasts via WebSocket
3. **Crash game** → Frontend sends bet to `POST /api/games/crash/result` → Backend generates crash point via seeds, saves loss
4. **Cashout** → Frontend calls `POST /api/games/crash/cashout` → Backend calculates win, saves win, updates balance
5. **Slots** → Frontend calls `POST /api/games/slots/result` → Backend simulates spin, saves win/loss, updates balance
6. **Leaderboard** → Frontend calls `GET /api/bets/leaderboard/top` → Backend returns top 10 users by total winnings
7. **Real-time updates** → WebSocket broadcasts bet updates and chat messages to all connected clients

---

## Key Dependencies Purpose

| Package | Purpose |
|---------|---------|
| `@solana/web3.js` | Interact with Solana blockchain (balances, transactions) |
| `express` | REST API server |
| `socket.io` | Real-time WebSocket communication |
| `mongoose` | MongoDB ODM for data modeling |
| `jsonwebtoken` | JWT creation and verification |
| `winston` | Structured logging |
| `cors` | Cross-origin resource sharing |
| `dotenv` | Environment variable management |
| `bcryptjs` | Password hashing (currently unused but available) |
| `uuid` | Unique ID generation |

---

## Security Notes

- JWT tokens are used for authentication (though currently not fully implemented in all routes)
- Rate limiting protects against API abuse
- CORS restricts allowed origins
- Wallet validation prevents invalid Solana addresses
- Error logging captures all server errors

---

*Documentation generated on 2026-07-01*