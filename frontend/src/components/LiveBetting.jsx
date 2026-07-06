import React, { useState, useEffect } from 'react';

const fakeBets = [
  { user: '🐋 Whale', amount: 2.5, multiplier: 1.8 },
  { user: '🦊 Foxy', amount: 0.5, multiplier: 3.2 },
  { user: '💎 Diamond', amount: 1.0, multiplier: 2.1 },
];

export const LiveBetting = () => {
  const [bets, setBets] = useState(fakeBets);

  useEffect(() => {
    const interval = setInterval(() => {
      const newBet = {
        user: ['🐋 Whale', '🦊 Foxy', '💎 Diamond', '🚀 Moon', '👑 King'][Math.floor(Math.random() * 5)],
        amount: (Math.random() * 3 + 0.1).toFixed(1),
        multiplier: (Math.random() * 4 + 1).toFixed(2),
      };
      setBets(prev => [newBet, ...prev].slice(0, 8));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-4 max-h-48 overflow-y-auto">
      <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-2">🎯 LIVE BETS</div>
      {bets.map((bet, i) => (
        <div key={i} className="flex justify-between text-xs border-b border-white/5 py-1.5">
          <span className="text-gray-300">{bet.user}</span>
          <span className="text-[#ff8800]">{bet.amount} SOL</span>
          <span className="text-[#00ccff]">{bet.multiplier}x</span>
        </div>
      ))}
    </div>
  );
};