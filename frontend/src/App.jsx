import React, { useMemo, useEffect, useState, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import toast, { Toaster } from 'react-hot-toast';
import bs58 from 'bs58';
import { io } from 'socket.io-client';

import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Particles } from './components/Particles';
import { HotStreak } from './components/HotStreak';
import { DepositModal } from './components/DepositModal';
import { Profile } from './components/Profile';
import { useCasinoStore } from './store/useCasinoStore';
import { api, AUTH_TOKEN_KEY, AUTH_WALLET_KEY } from './services/api';
import { useBalanceSync } from './hooks/useBalanceSync';

import '@solana/wallet-adapter-react-ui/styles.css';

const Home = lazy(() => import('./pages/Home').then((module) => ({ default: module.Home })));
const SlotsPage = lazy(() => import('./pages/SlotsPage').then((module) => ({ default: module.SlotsPage })));
const CrashPage = lazy(() => import('./pages/CrashPage').then((module) => ({ default: module.CrashPage })));
const CoinFlipPage = lazy(() => import('./pages/CoinFlipPage').then((module) => ({ default: module.CoinFlipPage })));

const getSocketUrl = () => {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL.replace(/^ws/, 'http');
  }
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  return apiUrl.replace(/\/api\/?$/, '');
};

function normalizeSignature(signResult) {
  if (signResult instanceof Uint8Array) {
    return signResult;
  }
  if (signResult?.signature instanceof Uint8Array) {
    return signResult.signature;
  }
  if (Array.isArray(signResult)) {
    return Uint8Array.from(signResult);
  }
  if (signResult?.signature && Array.isArray(signResult.signature)) {
    return Uint8Array.from(signResult.signature);
  }
  return null;
}

function AppContent() {
  const wallet = useWallet();
  const setWallet = useCasinoStore((state) => state.setWallet);
  const setAuth = useCasinoStore((state) => state.setAuth);
  const setBalance = useCasinoStore((state) => state.setBalance);
  const clearAuth = useCasinoStore((state) => state.clearAuth);
  const isAuthenticated = useCasinoStore((state) => state.isAuthenticated);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const authAttemptRef = useRef(false);
  const socketRef = useRef(null);

  useBalanceSync({ enabled: isAuthenticated });

  useEffect(() => {
    setWallet(wallet.publicKey ?? null);
    if (!wallet.publicKey) {
      clearAuth();
    }
  }, [wallet.publicKey, setWallet, clearAuth]);

  useEffect(() => {
    const socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('deposit', (payload) => {
      toast.success(`✅ Deposit of ${payload.amount} SOL received!`);
      api.getMe()
        .then((response) => {
          const user = response.data.user || response.data;
          if (user?.balance !== undefined) {
            setBalance(user.balance);
          }
        })
        .catch(() => {});
    });

    return () => {
      socket.disconnect();
    };
  }, [setBalance]);

  useEffect(() => {
    if (wallet.publicKey && socketRef.current?.connected) {
      socketRef.current.emit('join', wallet.publicKey.toString());
    }
  }, [wallet.publicKey, isAuthenticated]);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const savedWallet = localStorage.getItem(AUTH_WALLET_KEY);

      if (!token || !savedWallet || !wallet.publicKey) return;
      if (wallet.publicKey.toString() !== savedWallet) return;

      try {
        const response = await api.validateToken(token);
        if (response.data.valid) {
          setAuth({
            token,
            walletAddress: savedWallet,
            balance: response.data.balance,
            publicKey: wallet.publicKey,
          });
        }
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_WALLET_KEY);
      }
    };

    restoreSession();
  }, [wallet.publicKey, setAuth]);

  useEffect(() => {
    const authenticateWallet = async () => {
      if (!wallet.publicKey || !wallet.signMessage || isAuthenticating || authAttemptRef.current) {
        return;
      }

      const walletAddress = wallet.publicKey.toString();
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const savedWallet = localStorage.getItem(AUTH_WALLET_KEY);

      if (token && savedWallet === walletAddress && isAuthenticated) {
        try {
          const response = await api.getMe();
          const user = response.data.user || response.data;
          setAuth({
            token,
            walletAddress,
            balance: user.balance,
            publicKey: wallet.publicKey,
          });
        } catch {
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_WALLET_KEY);
        }
        return;
      }

      if (token && savedWallet === walletAddress) {
        return;
      }

      authAttemptRef.current = true;
      setIsAuthenticating(true);

      try {
        const challengeResponse = await api.getChallenge(walletAddress);
        const message = challengeResponse.data.message;
        const messageBytes = new TextEncoder().encode(message);
        const signResult = await wallet.signMessage(messageBytes);
        const signatureBytes = normalizeSignature(signResult);

        if (!signatureBytes) {
          throw new Error('Wallet did not return a signature');
        }

        const signatureBase58 = bs58.encode(signatureBytes);
        const loginResponse = await api.login(walletAddress, signatureBase58, message);

        if (loginResponse.data.success) {
          setAuth({
            token: loginResponse.data.token,
            walletAddress,
            balance: loginResponse.data.balance,
            publicKey: wallet.publicKey,
          });
          toast.success('✅ Authenticated successfully!');
          socketRef.current?.emit('join', walletAddress);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        const message =
          error.response?.data?.error ||
          error.message ||
          'Authentication failed. Please try again.';
        toast.error(message);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_WALLET_KEY);
      } finally {
        setIsAuthenticating(false);
        authAttemptRef.current = false;
      }
    };

    if (wallet.connected && wallet.publicKey && wallet.signMessage) {
      authenticateWallet();
    }
  }, [
    wallet.connected,
    wallet.publicKey,
    wallet.signMessage,
    isAuthenticating,
    isAuthenticated,
    setAuth,
  ]);

  return (
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <Particles />
      <HotStreak />

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#0d0d14',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
          },
        }}
      />

      <button data-deposit onClick={() => setShowDeposit(true)} className="hidden" />
      <button data-profile onClick={() => setShowProfile(true)} className="hidden" />

      <DepositModal isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
      <Profile isOpen={showProfile} onClose={() => setShowProfile(false)} />

      <ErrorBoundary>
        <Suspense
          fallback={
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="text-[#00ff88] text-xl font-mono animate-pulse">Loading...</div>
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="slots" element={<SlotsPage />} />
              <Route path="crash" element={<CrashPage />} />
              <Route path="coinflip" element={<CoinFlipPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default function App() {
  const network =
    process.env.REACT_APP_SOLANA_NETWORK === 'mainnet-beta'
      ? WalletAdapterNetwork.Mainnet
      : WalletAdapterNetwork.Devnet;
  const endpoint = useMemo(
    () => process.env.REACT_APP_SOLANA_RPC || clusterApiUrl(network),
    [network],
  );
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <AppContent />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
