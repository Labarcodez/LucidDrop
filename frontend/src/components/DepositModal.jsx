import React, { useState, useEffect } from 'react';
import ConfirmModal from './ConfirmModal';

export const DepositModal = ({ isOpen, onClose }) => {
  const [depositAddress, setDepositAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetch('/api/deposit/address')
        .then(res => res.json())
        .then(data => setDepositAddress(data.address))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const copyAddress = () => {
    navigator.clipboard?.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 max-w-sm w-full animate-scale-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white">💰 Deposit SOL</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl transition-colors">✕</button>
        </div>
        
        <p className="text-sm text-gray-400 mb-4">
          Send SOL to this address:
        </p>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="bg-black/60 p-3 rounded-lg border border-gray-700 flex justify-between items-center gap-2">
              <span className="font-mono text-sm text-[#00ff88] break-all">{depositAddress}</span>
              <button
                onClick={copyAddress}
                className={`px-3 py-1 rounded-lg text-xs whitespace-nowrap transition ${
                  copied 
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400' 
                    : 'bg-[#00ff88]/10 border border-[#00ff88]/30 text-[#00ff88] hover:bg-[#00ff88]/20'
                }`}
              >
                {copied ? '✅ Copied!' : 'Copy'}
              </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
              <span>⚠️</span> Funds will appear in your balance after 1 confirmation.
            </p>
            
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span>⏱️</span> Estimated network time: ~3-5 seconds
            </p>
          </>
        )}
        
        <button
          onClick={onClose}
          className="w-full mt-4 py-2 bg-gray-700 rounded-lg text-white font-bold hover:bg-gray-600 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};