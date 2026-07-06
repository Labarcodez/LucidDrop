# LucidDrop — Local setup (manual steps only)

Everything else (dependencies, `.env` files, casino wallet keys, devnet RPC URLs) is configured in the repo workspace. Complete these steps only if something still fails or you are on a fresh machine.

## 1. MongoDB Atlas password

If `backend/.env` contains `REPLACE_WITH_PASSWORD`, replace it with your Atlas database user password:

```
mongodb+srv://labarcodez_db_user:YOUR_PASSWORD_HERE@cluster0.hm33tux.mongodb.net/luciddrop?retryWrites=true&w=majority&appName=Cluster0
```

Set `MONGODB_URI` in `backend/.env` to that full string.

## 2. MongoDB Atlas network access

If the backend logs `MongoDB error` or health shows `"database":"disconnected"`:

1. Open [MongoDB Atlas](https://cloud.mongodb.com/) → your project → **Network Access**.
2. **Add IP Address** → **Allow Access from Anywhere** (`0.0.0.0/0`) for local development, or add your current public IP.
3. Save and wait ~1 minute, then restart the backend.

## 3. Fund wallets on Solana Devnet

Casino wallet (deposits / payouts) — fund this address:

```
6ZUNyd2N55CMWbb1gKSvazGNPSSsXkpCMXb4jrs6ds87
```

1. Open https://faucet.solana.com
2. Choose **Devnet**, paste the address above, request SOL (repeat if needed for testing).

Your **Phantom** wallet (for playing):

1. In Phantom: **Settings → Developer Settings → Testnet mode** (or switch network to **Devnet**).
2. Copy your wallet address and request Devnet SOL from the same faucet.

## 4. Phantom on Devnet

- Phantom must use **Devnet**, matching `SOLANA_RPC=https://api.devnet.solana.com` in `backend/.env` and `REACT_APP_SOLANA_RPC` in `frontend/.env`.

## 5. Run the app

Two terminals:

**Backend** (`LucidDrop/backend`):

```powershell
npm run dev
```

**Frontend** (`LucidDrop/frontend`):

```powershell
npm start
```

- App UI: http://localhost:3000  
- API health: http://localhost:5000/api/health  

## 6. Security reminders

- Never commit `backend/.env`, `frontend/.env`, or `backend/casino-wallet.json`.
- Do not share casino private keys or JWT secrets.
