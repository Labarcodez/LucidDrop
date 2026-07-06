import React from 'react';
import { Link } from 'react-router-dom';
import { CustomWalletButton } from './CustomWalletButton';

export const HeroSection = ({ stats }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl glass-card neon-border-purple p-8 md:p-14 text-center">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-[#00ff88]/10 rounded-full blur-3xl orb-float" />
        <div className="absolute -bottom-20 -right-20 w-72 h-72 bg-[#ff00cc]/10 rounded-full blur-3xl orb-float-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#00ccff]/5 rounded-full blur-3xl orb-float-delay-2" />
      </div>

      <div className="relative z-10">
        <p className="text-[10px] md:text-xs font-mono text-[#00ff88]/70 tracking-[0.3em] uppercase mb-3">
          Real SOL · Provably Fair · Instant Play
        </p>
        <h1 className="text-5xl md:text-7xl font-black tracking-tighter multiplier-display">
          <span className="bg-gradient-to-r from-[#00ff88] via-[#00ccff] to-[#ff00cc] bg-clip-text text-transparent">
            LUCID DROP
          </span>
        </h1>
        <p className="text-gray-400 mt-3 text-sm md:text-lg max-w-md mx-auto">
          The degen Solana casino — crash, slots, flip.{' '}
          <span className="text-[#00ff88] font-semibold">Deposit SOL. Win big.</span>
        </p>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          {[
            { label: 'Players Live', value: stats.activePlayers || 0, color: 'text-[#00ff88]' },
            { label: 'Jackpot Pool', value: `${stats.jackpot || 0} SOL`, color: 'text-[#ff00cc]' },
            { label: 'Total Bets', value: stats.totalBets || 0, color: 'text-[#00ccff]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="px-5 py-3 glass-card min-w-[100px] hover:scale-105 transition-transform">
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-[9px] text-gray-500 uppercase tracking-widest mt-1">{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <Link
            to="/crash"
            className="px-8 py-4 neon-btn-green rounded-2xl text-base font-black bet-pulse min-h-[52px] flex items-center"
          >
            🚀 PLAY CRASH
          </Link>
          <CustomWalletButton />
        </div>
      </div>
    </div>
  );
};
