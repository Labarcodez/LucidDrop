import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { api } from '../services/api';

export const BetHistory = () => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);
  const walletAddress = useCasinoStore((state) => state.publicKey);

  useEffect(() => {
    if (!walletAddress) {
      setLoading(false);
      return;
    }
    const fetchHistory = async () => {
      try {
        const response = await api.getHistory(walletAddress.toString());
        setBets(response.data);
      } catch (error) {
        console.error('Failed to fetch bet history:', error.message);
        setBets([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [walletAddress]);

  if (loading) {
    return (
      <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-4">
        <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-3">📊 BET HISTORY</div>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-4 max-h-48 overflow-y-auto">
      <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-3">📊 BET HISTORY</div>
      {bets.length === 0 ? (
        <div className="text-gray-500 text-sm">No bets yet</div>
      ) : (
        bets.slice(0, 10).map((bet, i) => (
          <div key={i} className="flex justify-between text-xs border-b border-white/5 py-1.5">
            <span className="text-gray-400">{bet.game}</span>
            <span className="text-gray-400">{bet.amount.toFixed(2)} SOL</span>
            <span className={bet.result === 'win' ? 'text-[#00ff88]' : 'text-red-500'}>
              {bet.result === 'win' ? `+${bet.profit.toFixed(2)}` : `-${bet.amount.toFixed(2)}`}
            </span>
          </div>
        ))
      )}
    </div>
  );
};