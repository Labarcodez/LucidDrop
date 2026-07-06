import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

export const DepositModal = ({ isOpen, onClose }) => {
  const [depositAddress, setDepositAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .getDepositAddress()
        .then((res) => setDepositAddress(res.data.address))
        .catch(() => toast.error('Could not load deposit address'))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyAddress = () => {
    navigator.clipboard?.writeText(depositAddress);
    setCopied(true);
    toast.success('Address copied!');
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-card neon-border-purple p-6 max-w-md w-full animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-black text-white">💰 Deposit SOL</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors">
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Send SOL on <span className="text-[#00ccff] font-semibold">Devnet</span> to the casino wallet.
          Your in-game balance updates after 1 confirmation.
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-10 h-10 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-black/60 p-4 rounded-xl border border-[#00ff88]/20 flex flex-col gap-3">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                Casino deposit address
              </span>
              <span className="font-mono text-sm text-[#00ff88] break-all">{depositAddress}</span>
              <button onClick={copyAddress} className="w-full py-2.5 neon-btn-green rounded-xl text-sm font-bold">
                {copied ? '✅ Copied!' : 'Copy Address'}
              </button>
            </div>

            <div className="mt-4 space-y-1 text-xs text-gray-500">
              <p>⚠️ Use Phantom on Devnet only for test deposits.</p>
              <p>⏱️ Credits typically appear in ~3–5 seconds.</p>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};
