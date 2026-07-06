import React, { useState } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { useWallet } from '@solana/wallet-adapter-react';
import WithdrawModal from './WithdrawModal';
import { StatisticsDashboard } from './StatisticsDashboard';
import { GamblingLimits } from './GamblingLimits';

export const Profile = ({ isOpen, onClose }) => {
  const { balance } = useCasinoStore();
  const { publicKey, connected, disconnect } = useWallet();
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showLimits, setShowLimits] = useState(false);

  if (!isOpen) return null;

  const walletAddress = publicKey?.toString();
  const isConnected = connected && !!walletAddress;

  const copyAddress = () => {
    if (publicKey) {
      navigator.clipboard?.writeText(publicKey.toString());
      alert('✅ Address copied!');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-[#00ff88]/20 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <div className="text-sm font-mono text-[#00ff88]">
                {isConnected
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-6)}`
                  : 'Not connected'}
              </div>
              <div className="text-xs text-gray-400">
                {isConnected ? `Balance: ${balance.toFixed(4)} SOL` : 'Connect wallet to view balance'}
              </div>
            </div>
          </div>

          <div className="bg-black/60 p-3 rounded-lg border border-gray-700 flex justify-between items-center mb-4">
            <span className="font-mono text-xs text-gray-300 truncate">
              {walletAddress || 'No wallet connected'}
            </span>
            {isConnected && (
              <button
                onClick={copyAddress}
                className="px-3 py-1 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg text-[#00ff88] text-xs"
              >
                Copy
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                onClose();
                document.querySelector('[data-deposit]')?.click();
              }}
              className="flex-1 py-2 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg text-[#00ff88] text-sm font-bold hover:bg-[#00ff88]/20 transition"
            >
              💰 Deposit
            </button>
            <button
              onClick={() => setShowWithdraw(true)}
              className="flex-1 py-2 bg-[#ff00cc]/10 border border-[#ff00cc]/30 rounded-lg text-[#ff00cc] text-sm font-bold hover:bg-[#ff00cc]/20 transition"
            >
              💸 Withdraw
            </button>
          </div>

          <button
            onClick={() => setShowStats(!showStats)}
            className="w-full mt-2 py-2 bg-[#ffaa00]/10 border border-[#ffaa00]/30 rounded-lg text-[#ffaa00] text-sm font-bold hover:bg-[#ffaa00]/20 transition"
          >
            {showStats ? '📊 Hide Stats' : '📊 View Stats'}
          </button>

          {showStats && (
            <div className="mt-3 max-h-64 overflow-y-auto">
              <StatisticsDashboard />
            </div>
          )}

          <button
            onClick={() => setShowLimits(!showLimits)}
            className="w-full mt-2 py-2 bg-[#ff00cc]/10 border border-[#ff00cc]/30 rounded-lg text-[#ff00cc] text-sm font-bold hover:bg-[#ff00cc]/20 transition"
          >
            {showLimits ? '🔒 Hide Limits' : '🔒 Gambling Limits'}
          </button>

          {showLimits && (
            <div className="mt-3 max-h-64 overflow-y-auto">
              <GamblingLimits />
            </div>
          )}

          <button
            onClick={disconnect}
            className="w-full mt-2 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm font-bold hover:bg-red-500/20 transition"
          >
            Disconnect
          </button>

          <button
            onClick={onClose}
            className="w-full mt-2 py-2 bg-gray-700 rounded-lg text-white font-bold hover:bg-gray-600 transition"
          >
            Close
          </button>
        </div>
      </div>
      <WithdrawModal isOpen={showWithdraw} onClose={() => setShowWithdraw(false)} />
    </>
  );
};