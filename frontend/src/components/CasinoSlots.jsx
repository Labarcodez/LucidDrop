import React, { useState } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import { sound } from '../utils/sound';
import { Confetti } from './Confetti';
import { useLoading } from '../hooks/useLoading';

const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐', '🎰'];

export const CasinoSlots = React.memo(() => {
  const [reels, setReels] = useState(['🎰', '🎰', '🎰']);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState('');
  const [winAmount, setWinAmount] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [betAmount, setBetAmount] = useState(0);   // ← default 0
  
  const balance = useCasinoStore((state) => state.balance);
  const walletAddress = useCasinoStore((state) => state.publicKey);
  const addBet = useCasinoStore((state) => state.addBet);

  const spin = useCallback(async () => {
    if (spinning) return;
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

    setSpinning(true);
    setResult('');
    setWinAmount(0);
    sound.play('spin');

    // Animate reels spinning
    let count = 0;
    const spinInterval = setInterval(() => {
      const newReels = reels.map(() => symbols[Math.floor(Math.random() * symbols.length)]);
      setReels(newReels);
      count++;
      if (count > 12) {
        clearInterval(spinInterval);
        handleSpinResult();
      }
    }, 60);
    
    const handleSpinResult = async () => {
      try {
        const response = await api.slotsResult(walletAddress.toString(), betAmount);
        const data = response.data;
        
        setReels(data.reels);
        setSpinning(false);
        
        if (data.win) {
          const multiplier = data.multiplier;
          const winAmount = data.winAmount;
          setWinAmount(winAmount);
          
          if (multiplier >= 10) {
            setResult(`🎉 JACKPOT! ${multiplier}x`);
            addBet('Slots', betAmount, multiplier);
            sound.play('jackpot');
            toast.success(`🎉 Won ${winAmount.toFixed(2)} SOL!`);
            setShowConfetti(true);
            setTimeout(() => setShowConfetti(false), 3000);
          } else {
            setResult(`✨ WIN! ${multiplier}x`);
            addBet('Slots', betAmount, multiplier);
            sound.play('win');
            toast.success(`✨ Won ${winAmount.toFixed(2)} SOL!`);
          }
          // Update balance from response
          useCasinoStore.setState({ balance: data.newBalance });
        } else {
          setWinAmount(0);
          setResult('💀 LOSE');
          addBet('Slots', betAmount, 0);
          sound.play('loss');
          toast.error('💀 You lost!');
          // Update balance from response
          useCasinoStore.setState({ balance: data.newBalance });
        }
      } catch (error) {
        setSpinning(false);
        toast.error('Failed to process spin. Please try again.');
        console.error('Slots error:', error);
      }
    };
  }, [spinning, walletAddress, betAmount, balance, reels, addBet]);

  return (
    <div className="bg-[#0d0d14] rounded-2xl border border-[#00ff88]/20 p-6 shadow-[0_0_60px_rgba(0,255,136,0.03)]">
      <Confetti active={showConfetti} onComplete={() => setShowConfetti(false)} />

      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-mono text-[#00ff88]/60 tracking-widest">🎰 SLOTS</h3>
      </div>

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
                  ? 'bg-[#00ff88] text-black border-[#00ff88]'
                  : 'bg-transparent text-gray-400 border-gray-700 hover:border-[#00ff88]/30'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-4 py-4 bg-black/40 rounded-xl border border-[#00ff88]/5">
        {reels.map((symbol, i) => (
          <div
            key={i}
            className={`w-20 h-20 bg-black/60 border rounded-xl flex items-center justify-center text-5xl transition-all duration-100 ${
              spinning ? 'border-[#00ff88]/30 shadow-[0_0_30px_rgba(0,255,136,0.05)]' : 'border-gray-700'
            }`}
          >
            {symbol}
          </div>
        ))}
      </div>

      {result && (
        <div
          className={`text-center text-xl font-bold mb-4 py-2 rounded-lg ${
            result.includes('JACKPOT')
              ? 'text-[#ff00cc] drop-shadow-[0_0_20px_rgba(255,0,204,0.3)]'
              : result.includes('WIN')
              ? 'text-[#00ff88] drop-shadow-[0_0_20px_rgba(0,255,136,0.2)]'
              : 'text-red-500'
          }`}
        >
          {result}
          {winAmount > 0 && (
            <span className="block text-sm font-mono text-gray-400">+{winAmount.toFixed(2)} SOL</span>
          )}
        </div>
      )}

      <button
        onClick={spin}
        disabled={spinning}
        className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 ${
          spinning
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 text-[#00ff88] hover:scale-[1.02]'
        }`}
      >
        {spinning ? '🌀 SPINNING...' : '🔄 SPIN'}
      </button>
    </div>
  );
});