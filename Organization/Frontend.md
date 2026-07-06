# LUCID.drop — Frontend Documentation

## Overview
The frontend is a React single-page application that provides the casino gaming interface. It connects to Phantom wallet, communicates with the backend API via REST and WebSocket, and renders three games: Crash, Slots, and Coin Flip.

**Tech Stack:** React 18, Tailwind CSS, Zustand (state), React Router, Solana Wallet Adapter, Axios, Socket.io client

---

## Root Files

### `frontend/package.json`
**Purpose:** Project manifest and dependency management
- **Scripts:** `start`, `build`, `test` (using react-app-rewired)
- **Dependencies:**
  - `@solana/wallet-adapter-*` — Phantom wallet integration
  - `@solana/web3.js` — Solana blockchain utilities
  - `axios` — HTTP client for API calls
  - `react`, `react-dom` — UI framework
  - `react-router-dom` — Client-side routing
  - `react-hot-toast` — Toast notifications
  - `zustand` — State management
  - `buffer`, `crypto-browserify`, `process`, `stream-browserify` — Polyfills
- **DevDependencies:** Tailwind CSS, PostCSS, Autoprefixer, react-app-rewired

### `frontend/config-overrides.js` — Webpack Override
**Purpose:** Customizes Create React App webpack config for Solana compatibility
- Adds fallbacks for Node.js core modules: `crypto`, `stream`, `buffer`, `process`
- Provides `process` and `Buffer` globally via ProvidePlugin
- Ignores specific module warnings (process/browser, stream, crypto)

### `frontend/tailwind.config.js` — Tailwind CSS Configuration
**Purpose:** Configures Tailwind CSS for styling
- Content: `./src/**/*.{js,jsx}`
- No custom theme extensions

### `frontend/postcss.config.js` — PostCSS Configuration
**Purpose:** Processes CSS with Tailwind and Autoprefixer

### `frontend/Dockerfile` — Containerization
**Purpose:** Docker image for frontend deployment
- Uses `node:18-alpine`
- Runs `npm install`, copies source
- Exposes port 3000
- Starts with `npm start`

### `frontend/public/` — Static Assets
- `index.html` — Main HTML template
- `manifest.json` — PWA manifest

### `frontend/build/` — Production Build
**Purpose:** Compiled static files for deployment
- `asset-manifest.json` — Asset manifest
- `index.html` — Production HTML
- `manifest.json` — PWA manifest
- `static/css/` — Compiled CSS
- `static/js/` — Compiled JavaScript bundles

---

## Source Code Structure

### `frontend/src/index.js` — Entry Point
**Purpose:** Renders the React application
- Polyfills: Injects `Buffer` and `process` into `window` (Solana compatibility)
- Renders `<App />` with React StrictMode

### `frontend/src/index.css` — Global Styles
**Purpose:** Tailwind CSS imports and global base styles

---

## Core Application

### `frontend/src/App.jsx` — Root Component
**Purpose:** Sets up wallet connection, routing, and global state
- **Wallet Provider:** Solana ConnectionProvider → WalletProvider → WalletModalProvider
- **Network:** Mainnet (Phantom wallet)
- **Routes:** `/` (Home), `/slots`, `/crash`, `/coinflip`
- **Global components:** Particles background, HotStreak indicator, Toaster notifications
- **Modals:** DepositModal, Profile (controlled by state)
- **User fetch:** On wallet connection, calls `api.getUser()` to fetch balance and user data
- **Fallback:** If API fails, sets balance to 5 SOL for testing

---

## State Management (`frontend/src/store/`)

### `useCasinoStore.js` — Zustand Store
**Purpose:** Centralized state for casino app
- **State:** `balance`, `bets` (last 50), `history` (last 100), `isConnected`, `publicKey`
- **Actions:**
  - `setWallet(publicKey)` — Updates wallet and connection status
  - `setBalance(balance)` — Updates balance
  - `addBet(game, amount, multiplier)` — Creates a simulated bet
    - 55% win rate (random)
    - Computes profit/loss
    - Updates balance, bets, history
  - `reset()` — Clears all state

---

## Services (`frontend/src/services/`)

### `api.js` — Backend API Client
**Purpose:** Axios wrapper for all backend HTTP calls
- **Base URL:** `REACT_APP_API_URL` env (default: `http://localhost:5000/api`)
- **User endpoints:** `getUser()`, `updateBalance()`
- **Bet endpoints:** `placeBet()`, `getHistory()`, `getLeaderboard()`
- **Game endpoints:** `crashResult()`, `slotsResult()`, `cashout()`
- **Utility endpoints:** `getJackpot()`, `getBonusStatus()`

### `contract.js` — Smart Contract Interaction
**Purpose:** Connects to Ethereum-compatible smart contract (Ethers.js)
- Requires MetaMask/Phantom with Ethereum support
- Loads ABI from `LucidDropABI.json`
- Returns contract instance with signer
- **Note:** Currently unused (Solana-focused)

---

## Pages (`frontend/src/pages/`)

### `Home.jsx` — Landing Page
**Purpose:** Main dashboard with game thumbnails, live feed, and leaderboard
- Displays game cards (Crash, Slots, Coin Flip)
- Live betting feed
- Leaderboard (top players)
- Jackpot counter
- Hot bonus indicator

### `CrashPage.jsx` — Crash Game Page
**Purpose:** The main crash game interface
- **Features:**
  - Bet amount input with preset buttons
  - Auto-cashout toggle
  - Live multiplier display
  - Crash history chart
  - "Provably Fair" seed verification
  - Cashout animation
  - Screen shake on crash
- **State:** Current multiplier, round status, bet history

### `SlotsPage.jsx` — Slot Machine Page
**Purpose:** Slot machine game interface
- **Features:**
  - Bet amount input with presets
  - Spin button with animation
  - Reel display with symbols (🍒🍋🍊🍇💎7️⃣⭐🎰)
  - Win/loss animations
  - Jackpot confetti

### `CoinFlipPage.jsx` — Coin Flip Game Page
**Purpose:** Simple coin flip game
- **Features:**
  - Bet amount input with presets
  - Heads/Tails selection
  - Coin spin animation (`animate-spin`)
  - Win/loss result display

---

## Components (`frontend/src/components/`)

### Layout & Navigation
- `Layout.jsx` — Main layout wrapper with header, navigation, and footer
- `CustomWalletButton.jsx` — Phantom wallet connect/disconnect button

### Game Components
- `DegenCrash.jsx` — Core crash game logic and visualization
- `CasinoSlots.jsx` — Slot machine reels and logic
- `CoinFlip.jsx` — Coin flip game with animation

### UI Components
- `BettingControls.jsx` — Shared betting input controls (amount, presets)
- `BetHistory.jsx` — Displays user's recent bets
- `CrashHistory.jsx` — Shows historical crash points
- `Leaderboard.jsx` — Top player rankings
- `LiveBetting.jsx` — Real-time bet feed
- `LiveChat.jsx` — Chat interface with WebSocket
- `LiveFeed.jsx` — Activity feed

### Modal Components
- `DepositModal.jsx` — Deposit interface (shows deposit address, copy button)
- `Profile.jsx` — User profile with wallet address, balance, stats
- `ConfirmModal.jsx` — Confirmation dialog for actions

### Feedback & Animations
- `Confetti.jsx` — Celebration confetti effect
- `SolCoins.jsx` — Falling SOL coin animation
- `HotStreak.jsx` — Hot streak indicator
- `HotBonus.jsx` — Bonus timer display
- `JackpotCounter.jsx` — Animated jackpot counter
- `AirdropCounter.jsx` — Airdrop countdown

### Status & Feedback
- `ConnectionStatus.jsx` — Wallet connection status indicator
- `ErrorBoundary.jsx` — React error boundary for graceful failure handling
- `Loading.jsx` — Loading spinner
- `Skeleton.jsx` — Skeleton loading placeholder

### Visual Effects
- `Particles.jsx` — Particle background effect
- `ThemeToggle.jsx` — Dark/light theme switcher

### Utility Components
- `SeedVerify.jsx` — Provably fair seed verification UI
- `RakebackTracker.jsx` — Rakeback progress tracking
- `BigWinsFeed.jsx` — Highlights big wins
- `HeroSection.jsx` — Landing page hero

---

## Hooks (`frontend/src/hooks/`)

### `useKeyboardShortcuts.js`
**Purpose:** Global keyboard shortcuts for casino actions
- `Space` — Place bet / Spin
- `C` — Cash out (Crash game)
- `Esc` — Close modals

### `useMemoized.js`
**Purpose:** Custom hook for memoized values (performance optimization)

---

## Utilities (`frontend/src/utils/`)

### `analytics.js`
**Purpose:** Event tracking and analytics (Google Analytics/Plausible)

### `lazyLoad.js`
**Purpose:** Lazy loading utilities for components and routes

### `sound.js`
**Purpose:** Sound effects management
- Win/loss sounds
- Button click sounds
- Cashout celebration sounds
- Toggle mute/unmute

---

## Special Files

### `frontend/src/process/browser.js`
**Purpose:** Polyfill for `process` in browser environment
- Exports an empty object to satisfy `process` imports

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:5000/api` |
| `REACT_APP_WS_URL` | WebSocket URL | `ws://localhost:5000` |
| `REACT_APP_CONTRACT_ADDRESS` | Smart contract address | `0x...` |

---

## Key Dependencies Purpose

| Package | Purpose |
|---------|---------|
| `@solana/wallet-adapter-react` | React hooks for Phantom wallet |
| `@solana/wallet-adapter-react-ui` | Wallet connection UI components |
| `axios` | HTTP client for API calls |
| `react-router-dom` | Client-side routing |
| `react-hot-toast` | Toast notifications |
| `zustand` | Global state management |
| `tailwindcss` | Utility-first CSS framework |

---

## Data Flow Summary

1. **User connects wallet** → Phantom adapter → `App.jsx` detects `wallet.publicKey` → Calls `api.getUser()` → Updates store balance
2. **User places bet** → Game component calls `api.placeBet()` or game-specific endpoint → Backend processes → Store updated via response or WebSocket
3. **Real-time updates** → Socket.io client listens for `betUpdate`, `crashEvent`, `chat` → Updates UI components (LiveFeed, Leaderboard, Chat)
4. **Deposit** → User opens DepositModal → Copies casino wallet address → Sends SOL → (future: WebSocket listens for incoming transactions)
5. **Leaderboard** → Home page fetches `api.getLeaderboard()` on mount → Renders top 10

---

## UI/UX Features

- **Dark theme** with neon accents
- **Responsive design** (mobile, tablet, desktop)
- **Loading states** (skeletons, spinners)
- **Animations**: Confetti, SOL coins, screen shake, coin spin, fade/scale
- **Keyboard shortcuts** for power users
- **Sound effects** with toggle
- **Error boundaries** for graceful failure

---

*Documentation generated on 2026-07-01*