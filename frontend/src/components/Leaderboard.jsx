import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.getLeaderboard();
        setLeaders(response.data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error.message);
        setLeaders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
    const interval = setInterval(fetchLeaderboard, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-4">
        <div className="text-[10px] font-mono text-gray-500 tracking-widest">🏆 LEADERBOARD</div>
        <div className="text-gray-500 text-sm mt-2">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-4">
      <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-3 flex items-center gap-2">
        🏆 LEADERBOARD <span className="text-[8px] text-[#00ff88]/40 animate-pulse">● LIVE</span>
      </div>
      {leaders.length === 0 ? (
        <div className="text-gray-500 text-sm">No players yet</div>
      ) : (
        leaders.map((p, i) => (
          <div key={i} className="flex justify-between items-center border-b border-white/5 py-2 text-sm">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-bold w-4 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-gray-600'}`}>
                {i + 1}
              </span>
              <span className="text-gray-300 font-mono text-xs">
                {p.walletAddress ? `${p.walletAddress.slice(0, 4)}...${p.walletAddress.slice(-4)}` : 'Unknown'}
              </span>
            </div>
            <span className="text-[#00ff88] font-mono text-xs">+{(p.totalWon || 0).toFixed(2)} SOL</span>
          </div>
        ))
      )}
    </div>
  );
};