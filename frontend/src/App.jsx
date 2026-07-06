import React, { useMemo, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import toast, { Toaster } from 'react-hot-toast';
import * as bs58 from 'bs58';

import { Layout } from './components/Layout';
import { lazy, Suspense } from 'react';

const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const SlotsPage = lazy(() => import('./pages/SlotsPage').then(module => ({ default: module.SlotsPage })));
const CrashPage = lazy(() => import('./pages/CrashPage').then(module => ({ default: module.CrashPage })));
const CoinFlipPage = lazy(() => import('./pages/CoinFlipPage').then(module => ({ default: module.CoinFlipPage })));
import { ErrorBoundary } from './components/ErrorBoundary';
import { Particles } from './components/Particles';
import { HotStreak } from './components/HotStreak';
import { DepositModal } from './components/DepositModal';
import { Profile } from './components/Profile';
import { useCasinoStore } from './store/useCasinoStore';
import { api } from './services/api';
import { useWebSocket } from './hooks/useWebSocket';
import { useBalanceSync } from './hooks/useBalanceSync';

import '@solana/wallet-adapter-react-ui/styles.css';

// Auth helper functions
const AUTH_TOKEN_KEY = 'luciddrop_auth_token';
const AUTH_WALLET_KEY = 'luciddrop_auth_wallet';

function AppContent() {
  const wallet = useWallet();
  const setWallet = useCasinoStore((state) => state.setWallet);
  const setBalance = useCasinoStore((state) => state.setBalance);
  const [showDeposit, setShowDeposit] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const { send, messages } = useWebSocket();
  
  // Enable periodic balance synchronization
  const { forceSync } = useBalanceSync({ enabled: true });

  // Auto-connect with stored token
  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedWallet = localStorage.getItem(AUTH_WALLET_KEY);
    
    if (token && savedWallet && wallet.publicKey) {
      const walletAddress = wallet.publicKey.toString();
      if (walletAddress === savedWallet) {
        // Token exists, validate with backend
        api.validateToken(token).then((response) => {
          if (response.data.valid) {
            setWallet(wallet.publicKey);
            setBalance(response.data.balance);
            toast.success('✅ Auto-connected');
          }
        }).catch(() => {
          // Token invalid, clear it
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_WALLET_KEY);
        });
      }
    }
  }, [wallet.publicKey, setWallet, setBalance]);

  // Handle wallet connection with sign message
  useEffect(() => {
    const handleWalletAuth = async () => {
      if (!wallet.publicKey || !wallet.signMessage || isAuthenticating) return;
      
      // Check if already authenticated for this wallet
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const savedWallet = localStorage.getItem(AUTH_WALLET_KEY);
      if (token && savedWallet === wallet.publicKey.toString()) {
        // Already have a token, just set the wallet
        setWallet(wallet.publicKey);
        try {
          const response = await api.getUser(wallet.publicKey.toString());
          setBalance(response.data.balance);
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
        return;
      }

      // Get challenge from backend
      setIsAuthenticating(true);
      try {
        const challengeResponse = await api.getChallenge(wallet.publicKey.toString());
        const message = challengeResponse.data.message;
        
        // Sign the message with wallet
        const encodedMessage = new TextEncoder().encode(message);
        const signature = await wallet.signMessage(encodedMessage);
        
        // Convert signature to base58
        const signatureBase58 = bs58.default.encode(signature);
        
        // Send to backend for verification
        const loginResponse = await api.login(wallet.publicKey.toString(), signatureBase58, message);
        
        if (loginResponse.data.success) {
          // Store token and wallet address
          localStorage.setItem(AUTH_TOKEN_KEY, loginResponse.data.token);
          localStorage.setItem(AUTH_WALLET_KEY, wallet.publicKey.toString());
          
          setWallet(wallet.publicKey);
          setBalance(loginResponse.data.balance);
          toast.success('✅ Authenticated successfully!');
        }
      } catch (error) {
        console.error('Authentication error:', error);
        toast.error(error.response?.data?.error || 'Authentication failed. Please try again.');
        // Clear any invalid auth state
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_WALLET_KEY);
      } finally {
        setIsAuthenticating(false);
      }
    };

    // Only trigger auth if wallet is connected and we're not already authenticating
    if (wallet.publicKey && wallet.signMessage) {
      // Check if we need to authenticate
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const savedWallet = localStorage.getItem(AUTH_WALLET_KEY);
      if (!token || savedWallet !== wallet.publicKey.toString()) {
        handleWalletAuth();
      }
    }
  }, [wallet.publicKey, wallet.signMessage, setWallet, setBalance]);

  // Fetch user data when wallet connects (fallback if token auth fails)
  useEffect(() => {
    const fetchUserData = async () => {
      if (wallet.publicKey) {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (!token) {
          // If no token, try to get user data without auth (legacy mode)
          try {
            const response = await api.getUser(wallet.publicKey.toString());
            setBalance(response.data.balance);
          } catch (error) {
            console.error('Failed to fetch user data:', error);
            setBalance(5.0);
          }
        }
      }
    };
    fetchUserData();
  }, [wallet.publicKey, setBalance]);

  // Join WebSocket room for this wallet
  useEffect(() => {
    if (wallet.publicKey) {
      send({ type: 'join', walletAddress: wallet.publicKey.toString() });
    }
  }, [wallet.publicKey, send]);

  // Listen for deposit messages from WebSocket
  useEffect(() => {
    const depositMsg = messages.find(m => m.type === 'deposit');
    if (depositMsg) {
      toast.success(`✅ Deposit of ${depositMsg.amount} SOL received!`);
      // Refetch user balance
      const refetch = async () => {
        try {
          const response = await api.getUser(wallet.publicKey.toString());
          setBalance(response.data.balance);
        } catch (e) { console.error(e); }
      };
      refetch();
    }
  }, [messages, wallet.publicKey, setBalance]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_WALLET_KEY);
    setWallet(null);
    setBalance(0);
    toast.success('Logged out');
  };

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
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-[#00ff88] text-xl font-mono animate-pulse">Loading...</div>
          </div>
        }>
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
  const network = WalletAdapterNetwork.Mainnet;
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);
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