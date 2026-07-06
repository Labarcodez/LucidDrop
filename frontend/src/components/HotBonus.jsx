import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export const HotBonus = () => {
  const [timeLeft, setTimeLeft] = useState(300);
  const [bonusActive, setBonusActive] = useState(true);

  useEffect(() => {
    const fetchBonus = async () => {
      try {
        const response = await api.getBonusStatus();
        setTimeLeft(response.data.timeLeft);
        setBonusActive(response.data.active);
      } catch (e) {}
    };
    fetchBonus();
    const interval = setInterval(fetchBonus, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;

  return (
    <div className="bg-[#0d0d14] rounded-xl border border-[#ff8800]/20 p-4">
      <div className="text-[10px] font-mono text-[#ff8800]/40 tracking-widest">
        {bonusActive ? '🔥 BONUS ACTIVE' : '⏳ BONUS ENDED'}
      </div>
      <div className="text-2xl font-bold text-[#ff8800]">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </div>
      <div className="text-[10px] text-gray-500 mt-0.5">
        {bonusActive ? '+15% EXTRA SOL' : 'Next bonus soon'}
      </div>
    </div>
  );
};