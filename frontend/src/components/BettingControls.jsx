import React, { useState } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';

export const BettingControls = ({ game, onBet, disabled }) => {
  const [amount, setAmount] = useState(0.1);
  const balance = useCasinoStore((state) => state.balance);

  const presets = [0.1, 0.5, 1, 2, 5];

  const handleBet = () => {
    if (amount > balance) {
      alert('Insufficient balance!');
      return;
    }
    if (onBet) onBet(amount);
  };

  return (
    <div className="bg-[#111118] rounded-xl border border-[#00ff88]/10 p-4">
      <div className="flex gap-2 mb-3 flex-wrap">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setAmount(p)}
            className={`px-3 py-1 rounded-lg text-sm font-mono transition ${
              amount === p
                ? 'bg-[#00ff88] text-black'
                : 'bg-[#00ff88]/10 text-[#00ff88] hover:bg-[#00ff88]/20 border border-[#00ff88]/20'
            }`}
          >
            {p} SOL
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
          step="0.01"
          min="0"
          className="flex-1 px-4 py-2 bg-black/60 border border-[#00ff88]/20 rounded-lg text-white font-mono"
          disabled={disabled}
        />
        <button
          onClick={handleBet}
          disabled={disabled || amount > balance}
          className="px-6 py-2 bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black font-bold rounded-lg hover:scale-105 transition disabled:opacity-30"
        >
          BET
        </button>
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Balance: <span className="text-[#00ff88] font-mono">{balance.toFixed(4)} SOL</span>
      </div>
    </div>
  );
};