import React, { useState, useEffect } from 'react';

const mockWins = [
  { wallet: '🐋 Whale', amount: 12.5, game: 'Crash' },
  { wallet: '🦊 Foxy', amount: 8.2, game: 'Slots' },
  { wallet: '💎 Diamond', amount: 5.7, game: 'Coin Flip' },
  { wallet: '🚀 Moon', amount: 15.3, game: 'Crash' },
  { wallet: '👑 King', amount: 22.1, game: 'Slots' },
];

export const BigWinsFeed = () => {
  const [wins, setWins] = useState(mockWins);

  useEffect(() => {
    const interval = setInterval(() => {
      const newWin = {
        wallet: ['🐋 Whale', '🦊 Foxy', '💎 Diamond', '🚀 Moon', '👑 King'][Math.floor(Math.random() * 5)],
        amount: (Math.random() * 20 + 2).toFixed(1),
        game: ['Crash', 'Slots', 'Coin Flip'][Math.floor(Math.random() * 3)],
      };
      setWins(prev => [newWin, ...prev].slice(0, 8));
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-[#0d0d14] border border-white/5 rounded-xl p-3 overflow-hidden">
      <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-2">🐋 RECENT BIG WINS</div>
      <div className="flex flex-col gap-1.5">
        {wins.slice(0, 5).map((win, i) => (
          <div
            key={i}
            className="flex justify-between items-center text-sm border-b border-white/5 py-1.5 animate-fade-in"
          >
            <span className="text-gray-300">{win.wallet}</span>
            <span className="text-[#00ff88] font-mono">+{win.amount} SOL</span>
            <span className="text-[10px] text-gray-500">{win.game}</span>
          </div>
        ))}
      </div>
    </div>
  );
};