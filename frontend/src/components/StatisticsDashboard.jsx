import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { api } from '../services/api';

const StatCard = ({ label, value, icon, color }) => (
  <div className={`bg-black/40 p-3 rounded-lg border border-${color}/20`}>
    <div className="flex items-center gap-2 text-gray-400 text-xs mb-1">
      <span>{icon}</span>
      <span>{label}</span>
    </div>
    <div className={`text-lg font-bold text-${color}`}>
      {value !== undefined && value !== null ? value : '-'}
    </div>
  </div>
);

const GameStatRow = ({ name, played, won }) => {
  const winRate = played > 0 ? Math.round((won / played) * 100) : 0;
  return (
    <div className="flex items-center justify-between text-sm border-b border-white/5 py-2">
      <span className="text-gray-300 capitalize">{name}</span>
      <div className="flex gap-4 text-xs">
        <span className="text-gray-400">{played} played</span>
        <span className="text-green-400">{won} won</span>
        <span className={winRate >= 50 ? 'text-green-400' : 'text-red-400'}>
          {winRate}%
        </span>
      </div>
    </div>
  );
};

export const StatisticsDashboard = () => {
  const { publicKey, token } = useCasinoStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!publicKey || !token) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await api.get('/users/stats', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setStats(response.data.stats);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
        setError('Could not load statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [publicKey, token]);

  if (!publicKey) {
    return (
      <div className="text-center text-gray-500 py-4 text-sm">
        Connect wallet to view stats
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="w-6 h-6 border-2 border-[#00ff88] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-400 py-4 text-sm">{error}</div>;
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500 py-4 text-sm">
        No stats available yet
      </div>
    );
  }

  const {
    totalWagered = 0,
    totalWon = 0,
    totalProfitLoss = 0,
    winRate = 0,
    gamesPlayed = 0,
    gamesWon = 0,
    longestWinStreak = 0,
    currentWinStreak = 0,
    longestLossStreak = 0,
    currentLossStreak = 0,
    stats: gameStats = { crash: { played: 0, won: 0 }, slots: { played: 0, won: 0 }, coinflip: { played: 0, won: 0 } }
  } = stats;

  return (
    <div className="space-y-3">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Total Wagered"
          value={`${totalWagered.toFixed(2)} SOL`}
          icon="📊"
          color="blue-400"
        />
        <StatCard
          label="Total Won"
          value={`${totalWon.toFixed(2)} SOL`}
          icon="🏆"
          color="green-400"
        />
        <StatCard
          label="Profit / Loss"
          value={`${totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toFixed(2)} SOL`}
          icon="📈"
          color={totalProfitLoss >= 0 ? 'green-400' : 'red-400'}
        />
        <StatCard
          label="Win Rate"
          value={`${winRate.toFixed(1)}%`}
          icon="🎯"
          color={winRate >= 50 ? 'green-400' : 'yellow-400'}
        />
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard
          label="Longest Win Streak"
          value={longestWinStreak}
          icon="🔥"
          color="orange-400"
        />
        <StatCard
          label="Current Win Streak"
          value={currentWinStreak}
          icon="⚡"
          color={currentWinStreak > 0 ? 'green-400' : 'gray-400'}
        />
        <StatCard
          label="Longest Loss Streak"
          value={longestLossStreak}
          icon="💀"
          color="red-400"
        />
        <StatCard
          label="Current Loss Streak"
          value={currentLossStreak}
          icon="😵"
          color={currentLossStreak > 0 ? 'red-400' : 'gray-400'}
        />
      </div>

      {/* Game Breakdown */}
      <div className="bg-black/30 p-3 rounded-lg border border-white/5">
        <div className="text-xs text-gray-400 mb-2">Game Breakdown</div>
        {Object.entries(gameStats).map(([game, data]) => (
          <GameStatRow
            key={game}
            name={game}
            played={data.played || 0}
            won={data.won || 0}
          />
        ))}
        <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-white/5 mt-1">
          <span>Total Games: {gamesPlayed}</span>
          <span>Total Wins: {gamesWon}</span>
        </div>
      </div>
    </div>
  );
};
