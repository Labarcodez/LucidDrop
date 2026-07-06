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
        const jackpotRes = await api.getJackpot();
        setStats({
          activePlayers: 234,
          jackpot: jackpotRes.data?.value || 42.7,
          totalBets: 26045160,
        });
      } catch (e) {
        console.error('Failed to fetch stats');
      }
    };
    fetchStats();
  }, []);

  const games = [
    { path: '/crash', icon: '📈', name: 'Crash', desc: 'Cash out before it crashes', glow: 'neon-border-purple glow-pulse-pink', accent: 'text-[#ff00cc]' },
    { path: '/slots', icon: '🎰', name: 'Slots', desc: 'Spin to win big', glow: 'neon-border-purple glow-pulse-green', accent: 'text-[#00ff88]' },
    { path: '/coinflip', icon: '🪙', name: 'Coin Flip', desc: '50/50 double or nothing', glow: 'neon-border-purple glow-blue', accent: 'text-[#00ccff]' },
  ];

  return (
    <div className="space-y-6">
      <HeroSection stats={stats} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {games.map((game) => (
          <Link
            key={game.path}
            to={game.path}
            className={`glass-card ${game.glow} p-5 text-center transition-all duration-300 hover:scale-[1.03] group`}
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform">{game.icon}</div>
            <h3 className={`text-sm font-black uppercase tracking-wider ${game.accent}`}>{game.name}</h3>
            <p className="text-[10px] text-gray-500 mt-1">{game.desc}</p>
            <div className="mt-4 text-[10px] font-mono text-[#00ff88]/60 bet-pulse inline-block px-3 py-1 rounded-full border border-[#00ff88]/20">
              ▶ PLAY NOW
            </div>
          </Link>
        ))}
        <div className="glass-card neon-border-purple p-5 text-center opacity-40">
          <div className="text-5xl mb-3">🎯</div>
          <h3 className="text-sm font-semibold text-gray-400">Coming Soon</h3>
          <p className="text-[10px] text-gray-600 mt-1">New games weekly</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-4">
          <JackpotCounter value={stats.jackpot} />
          <HotBonus />
          <BetHistory />
          <RakebackTracker />
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