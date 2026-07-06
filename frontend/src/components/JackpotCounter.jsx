import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const JackpotCounter = ({ value }) => {
  const [jackpot, setJackpot] = useState(value || 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJackpot = async () => {
      try {
        const response = await api.getJackpot();
        setJackpot(response.data.value);
      } catch (e) {
        console.error('Failed to fetch jackpot');
      } finally {
        setLoading(false);
      }
    };
    fetchJackpot();
    const interval = setInterval(fetchJackpot, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-[#0d0d14] rounded-xl border border-[#ff00cc]/20 p-4">
        <div className="text-[10px] font-mono text-[#ff00cc]/40 tracking-widest">JACKPOT</div>
        <div className="h-8 w-24 bg-white/5 animate-pulse rounded" />
      </div>
    );
  }

  return (
    <div className="bg-[#0d0d14] rounded-xl border border-[#ff00cc]/20 p-4 glow-pulse-pink">
      <div className="text-[10px] font-mono text-[#ff00cc]/40 tracking-widest">JACKPOT</div>
      <div className="text-3xl font-bold text-[#ff00cc]">{jackpot.toFixed(1)} SOL</div>
    </div>
  );
};