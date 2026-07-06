import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HeroSection } from '../components/HeroSection';
import { JackpotCounter } from '../components/JackpotCounter';
import { HotBonus } from '../components/HotBonus';
import { LiveFeed } from '../components/LiveFeed';
import { LiveChat } from '../components/LiveChat';
import { Leaderboard } from '../components/Leaderboard';
import { BetHistory } from '../components/BetHistory';
import { BigWinsFeed } from '../components/BigWinsFeed';
import { RakebackTracker } from '../components/RakebackTracker';
import { api } from '../services/api';

export const Home = () => {
  const [stats, setStats] = useState({ activePlayers: 0, jackpot: 0, totalBets: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const leaderboard = await api.getLeaderboard();
        const jackpot = await api.getJackpot();
        setStats({
          activePlayers: 234,
          jackpot: jackpot.data?.value || 42.7,
          totalBets: 26045160,
        });
      } catch (e) {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
  }, []);

  const games = [
    { path: '/slots', icon: '🎰', name: 'Slots', desc: 'Spin to win big', color: 'hover:border-[#00ff88]/40' },
    { path: '/crash', icon: '📈', name: 'Crash', desc: 'Cash out before it crashes', color: 'hover:border-[#ff00cc]/40' },
    { path: '/coinflip', icon: '🪙', name: 'Coin Flip', desc: '50/50 chance to double up', color: 'hover:border-[#00ccff]/40' },
  ];

  return (
    <div className="space-y-6">
      <HeroSection stats={stats} />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {games.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            className={`bg-[#0d0d14] rounded-xl border border-white/5 p-5 text-center transition-all duration-300 ${game.color} hover:scale-[1.02] hover:shadow-[0_0_40px_rgba(0,255,136,0.03)]`}
          >
            <div className="text-4xl mb-2">{game.icon}</div>
            <h3 className="text-sm font-semibold text-white">{game.name}</h3>
            <p className="text-[10px] text-gray-500 mt-0.5">{game.desc}</p>
            <div className="mt-3 text-[9px] text-[#00ff88]/40 font-mono">▶ Play Now</div>
          </Link>
        ))}
        <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-5 text-center opacity-40">
          <div className="text-4xl mb-2">🎯</div>
          <h3 className="text-sm font-semibold text-gray-400">Coming Soon</h3>
          <p className="text-[10px] text-gray-600 mt-0.5">New games weekly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <JackpotCounter value={stats.jackpot} />
          <HotBonus />
          <BetHistory />
          <RakebackTracker />  {/* ← ADDED HERE */}
        </div>
        <div className="space-y-4">
          <Leaderboard />
          <BigWinsFeed />
          <LiveFeed />
          <LiveChat />
        </div>
      </div>
    </div>
  );
};