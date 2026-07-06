import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const LiveFeed = () => {
  const [bets, setBets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBets = async () => {
      try {
        const response = await api.getLeaderboard();
        const feedData = response.data.slice(0, 5).map((p) => ({
          wallet: p.walletAddress,
          amount: p.totalWon || 0,
        }));
        setBets(feedData);
      } catch (error) {
        console.error('Failed to fetch feed:', error.message);
        // Fallback mock data
        setBets([
          { wallet: '🐋 Whale', amount: 3.5 },
          { wallet: '🦊 Foxy', amount: 2.1 },
          { wallet: '💎 Diamond', amount: 1.8 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchBets();
    const interval = setInterval(fetchBets, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-4">
        <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-2">📡 LIVE ACTIVITY</div>
        <div className="text-gray-500 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-4 max-h-48 overflow-y-auto">
      <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-2">📡 LIVE ACTIVITY</div>
      {bets.length === 0 ? (
        <div className="text-gray-500 text-sm">Waiting for bets...</div>
      ) : (
        bets.map((p, i) => (
          <div key={i} className="flex justify-between text-sm border-b border-white/5 py-1.5">
            <span className="text-gray-300 font-mono text-xs">{p.wallet}</span>
            <span className="text-[#00ff88] font-mono">+{p.amount.toFixed(2)} SOL</span>
          </div>
        ))
      )}
    </div>
  );
};