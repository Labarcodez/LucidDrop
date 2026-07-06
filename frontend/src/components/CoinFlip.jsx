import React, { useState } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { sound } from '../utils/sound';
// import { useLoading } from '../hooks/useLoading';

export const CoinFlip = React.memo(() => {
  const [result, setResult] = useState(null);
  const [flipping, setFlipping] = useState(false);
  const [betAmount, setBetAmount] = useState(0);   // ← default 0
  const balance = useCasinoStore((state) => state.balance);
  const walletAddress = useCasinoStore((state) => state.publicKey);
  const addBet = useCasinoStore((state) => state.addBet);

  const flip = useCallback(async () => {
    if (flipping) return;
    if (!walletAddress) {
      toast.error('Please connect your wallet first!');
      return;
    }
    if (betAmount <= 0) {
      toast.error('Please enter a bet amount!');
      return;
    }
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }

    setFlipping(true);
    sound.play('spin');
    
    try {
      const response = await api.coinFlipResult(walletAddress.toString(), betAmount, 'HEADS');
      const data = response.data;
      
      setTimeout(() => {
        setResult(data.outcome);
        setFlipping(false);
        if (data.won) {
          addBet('CoinFlip', betAmount, data.multiplier);
          sound.play('win');
          toast.success(`🎉 Won ${(data.winAmount).toFixed(2)} SOL!`);
          // Update balance from response
          useCasinoStore.setState({ balance: data.newBalance });
        } else {
          addBet('CoinFlip', betAmount, 0);
          sound.play('loss');
          toast.error('💀 You lost!');
          // Update balance from response
          useCasinoStore.setState({ balance: data.newBalance });
        }
      }, 900);
    } catch (error) {
      setFlipping(false);
      toast.error('Failed to process flip. Please try again.');
      console.error('Coin flip error:', error);
    }
  }, [flipping, walletAddress, betAmount, balance, addBet]);

  return (
    <div className="bg-[#0d0d14] rounded-2xl border border-[#00ff88]/20 p-6 shadow-[0_0_60px_rgba(0,255,136,0.03)]">
      <h3 className="text-xs font-mono text-[#00ff88]/60 tracking-widest mb-4">🪙 COIN FLIP</h3>
      
      <div className="flex items-center gap-2 mb-4">
        <label className="text-xs text-gray-500 font-mono">BET (SOL):</label>
        <input
          type="number"
          value={betAmount}
          onChange={(e) => setBetAmount(parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          className="px-3 py-1.5 bg-black/60 border border-gray-700 rounded-lg text-white text-sm w-24 font-mono focus:border-[#00ff88]/50 focus:outline-none"
          placeholder="0.00"
        />
        <div className="flex gap-1">
          {[0.1, 0.5, 1, 2].map((p) => (
            <button
              key={p}
              onClick={() => setBetAmount(p)}
              className={`px-2 py-1 text-xs font-mono rounded border ${
                betAmount === p
                  ? 'bg-[#00ccff] text-black border-[#00ccff]'
                  : 'bg-transparent text-gray-400 border-gray-700 hover:border-[#00ccff]/30'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center py-6">
        <div className={`text-7xl mb-3 transition-all duration-200 ${flipping ? 'animate-spin' : ''}`}>
          {flipping ? '🪙' : result ? (result === 'HEADS' ? '👑' : '🦅') : '❓'}
        </div>
        <div className="text-sm font-mono text-gray-400">
          {result || 'Click to flip'}
        </div>
        {result && (
          <div className={`text-xs font-mono mt-1 ${result === 'HEADS' ? 'text-[#00ff88]' : 'text-red-500'}`}>
            {result === 'HEADS' ? '🏆 WIN' : '💀 LOSE'}
          </div>
        )}
      </div>
      <button
        onClick={flip}
        disabled={flipping}
        className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 ${
          flipping
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-[#00ccff]/10 hover:bg-[#00ccff]/20 border border-[#00ccff]/30 text-[#00ccff] hover:scale-[1.02]'
        }`}
      >
        {flipping ? 'FLIPPING...' : '🪙 FLIP'}
      </button>
    </div>
  );
});