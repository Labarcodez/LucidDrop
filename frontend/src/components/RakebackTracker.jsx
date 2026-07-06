import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import toast from 'react-hot-toast';

export const RakebackTracker = () => {
  const [progress, setProgress] = useState(0);
  const [bonusReady, setBonusReady] = useState(false);
  const bets = useCasinoStore((state) => state.bets);

  useEffect(() => {
    const totalWagered = bets.reduce((sum, b) => sum + b.amount, 0);
    const newProgress = Math.min((totalWagered % 1) * 100, 100);
    setProgress(newProgress);
    
    if (newProgress >= 100 && !bonusReady) {
      setBonusReady(true);
      toast.success('🎁 Rakeback bonus ready! Claim now!');
    }
  }, [bets, bonusReady]);

  const claimBonus = () => {
    if (bonusReady) {
      setBonusReady(false);
      setProgress(0);
      toast.success('✅ Claimed 0.05 SOL rakeback!');
    }
  };

  return (
    <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-[10px] font-mono text-gray-500 tracking-widest">💰 RAKEBACK</span>
        <span className="text-[10px] font-mono text-[#00ff88]">{progress.toFixed(0)}%</span>
      </div>
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-[#00ff88] to-[#00ccff] rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      {bonusReady && (
        <button
          onClick={claimBonus}
          className="w-full mt-2 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg text-[#00ff88] text-xs font-bold hover:bg-[#00ff88]/20 transition"
        >
          🎁 Claim Bonus
        </button>
      )}
    </div>
  );
};