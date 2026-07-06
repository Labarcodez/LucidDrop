import React, { useState, useEffect } from 'react';

export const AirdropCounter = () => {
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [poolSize, setPoolSize] = useState(0.3);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 30 * 60));
      setPoolSize(prev => prev + (Math.random() * 0.01 - 0.005));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="bg-gradient-to-r from-[#ff8800]/10 to-[#ff00cc]/10 border border-[#ff8800]/20 rounded-2xl p-6 text-center glow-border">
      <div className="text-xs font-mono text-[#ff8800]/60 tracking-widest">🚀 AIRDROP INCOMING</div>
      <div className="text-4xl font-black font-['Orbitron'] text-[#ff8800]">
        {poolSize.toFixed(2)} SOL
      </div>
      <div className="text-2xl font-mono text-white mt-2">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div className="text-xs text-gray-500 mt-1">Next airdrop in</div>
    </div>
  );
};