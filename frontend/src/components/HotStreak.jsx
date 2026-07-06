import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';

export const HotStreak = () => {
  const [streak, setStreak] = useState(0);
  const bets = useCasinoStore((state) => state.bets);

  useEffect(() => {
    let count = 0;
    for (let i = 0; i < bets.length; i++) {
      if (bets[i].result === 'win') {
        count++;
      } else {
        break;
      }
    }
    setStreak(count);
  }, [bets]);

  if (streak < 3) return null;

  return (
    <div className="fixed top-20 right-4 z-30 bg-[#0d0d14] border border-[#ff8800]/30 rounded-xl px-4 py-2 shadow-[0_0_40px_rgba(255,136,0,0.15)] flex items-center gap-2 animate-pulse">
      <span className="text-2xl">🔥</span>
      <div>
        <div className="text-xs font-mono text-[#ff8800] tracking-widest">HOT STREAK</div>
        <div className="text-lg font-bold text-white">{streak}x</div>
      </div>
    </div>
  );
};