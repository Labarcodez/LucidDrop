import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useCasinoStore } from '../store/useCasinoStore';
import { useWallet } from '@solana/wallet-adapter-react';
import WithdrawModal from './WithdrawModal';
import { StatisticsDashboard } from './StatisticsDashboard';
import { GamblingLimits } from './GamblingLimits';

export const Profile = ({ isOpen, onClose }) => {
  const { balance, publicKey, isAuthenticated, clearAuth } = useCasinoStore();
  const { disconnect } = useWallet();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLimits, setShowLimits] = useState(false);

  if (!isOpen) return null;

  const walletAddress =
    typeof publicKey === 'string' ? publicKey : publicKey?.toString?.() || null;
  const isConnected = isAuthenticated && !!walletAddress;

  const copyAddress = () => {
    if (walletAddress) {
      navigator.clipboard?.writeText(walletAddress);
      toast.success('Address copied!');
    }
  };

  const handleDisconnect = async () => {
    clearAuth();
    await disconnect();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="glass-card neon-border-purple p-6 max-w-md w-full animate-fade-in">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-white tracking-tight">👤 Profile</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors">
              ✕
            </button>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#00ff88]/20 to-[#00ccff]/10 flex items-center justify-center text-2xl border border-[#00ff88]/20">
              {isConnected ? '✅' : '🔌'}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-mono text-[#00ff88] truncate">
                {isConnected
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`
                  : 'Not connected'}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {isConnected ? 'Authenticated · Devnet' : 'Connect wallet & sign in'}
              </div>
              <div className="text-xl font-black text-neon-green mt-2 multiplier-display">
                {isConnected ? `${balance.toFixed(4)} SOL` : '—'}
              </div>
            </div>
          </div>

          <div className="bg-black/50 p-3 rounded-xl border border-white/10 flex justify-between items-center gap-2 mb-4">
            <span className="font-mono text-[10px] text-gray-400 truncate">
              {walletAddress || 'No wallet connected'}
            </span>
            {isConnected && (
              <button onClick={copyAddress} className="px-3 py-1 neon-btn-green rounded-lg text-xs shrink-0">
                Copy
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => {
                onClose();
                document.querySelector('[data-deposit]')?.click();
              }}
              disabled={!isConnected}
              className="py-3 neon-btn-green rounded-xl text-sm font-bold disabled:opacity-40"
            >
              💰 Deposit
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              disabled={!isConnected}
              className="py-3 neon-btn-pink rounded-xl text-sm font-bold disabled:opacity-40"
            >
              💸 Withdraw
            </button>
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            disabled={!isConnected}
            className="w-full mt-2 py-2.5 bg-[#ffaa00]/10 border border-[#ffaa00]/30 rounded-xl text-[#ffaa00] text-sm font-bold hover:bg-[#ffaa00]/20 transition disabled:opacity-40"
          >
            {showStats ? '📊 Hide Stats' : '📊 View Stats'}
          </button>

          {showStats && (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-white/5 p-2">
              <StatisticsDashboard />
            </div>
          )}

          <button
            onClick={() => setShowLimits(!showLimits)}
            disabled={!isConnected}
            className="w-full mt-2 py-2.5 bg-[#ff00cc]/10 border border-[#ff00cc]/30 rounded-xl text-[#ff00cc] text-sm font-bold hover:bg-[#ff00cc]/20 transition disabled:opacity-40"
          >
            {showLimits ? '🔒 Hide Limits' : '🔒 Gambling Limits'}
          </button>

          {showLimits && (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-white/5 p-2">
              <GamblingLimits />
            </div>
          )}

          <button
            onClick={handleDisconnect}
            className="w-full mt-3 py-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-bold hover:bg-red-500/20 transition"
          >
            Disconnect
          </button>
        </div>
      </div>
      <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} />
    </>
  );
};
