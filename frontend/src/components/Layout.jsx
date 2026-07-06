import React, { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { sound } from '../utils/sound';

const navItems = [
  { to: '/', icon: '⌂', label: 'Home' },
  { to: '/crash', icon: '📈', label: 'Crash', hot: true },
  { to: '/slots', icon: '🎰', label: 'Slots' },
  { to: '/coinflip', icon: '🪙', label: 'Flip' },
];

export const Layout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('luciddrop-sound-muted');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('luciddrop-sound-muted', String(isMuted));
    sound.setMuted(isMuted);
  }, [isMuted]);

  return (
    <div className="min-h-screen bg-[#050508] flex bg-grid">
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 text-white text-2xl glass-card p-2 rounded-xl neon-border-purple"
        aria-label="Menu"
      >
        ☰
      </button>

      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-20 bg-black/60 backdrop-blur-xl border-r border-white/10
          flex flex-col items-center py-6 gap-2
          h-screen transition-transform duration-300
          ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="text-2xl font-black text-neon-green mb-4">✦</div>
        <nav className="flex flex-col gap-2 w-full px-2">
          {navItems.map(({ to, icon, label, hot }) => (
            <Link
              key={to}
              to={to}
              title={label}
              onClick={() => setMobileMenuOpen(false)}
              className="group flex flex-col items-center py-3 rounded-xl text-gray-500 hover:text-[#00ff88] hover:bg-[#00ff88]/10 transition-all relative"
            >
              <span className="text-xl">{icon}</span>
              <span className="text-[8px] font-mono uppercase tracking-wider mt-0.5 opacity-0 group-hover:opacity-100 lg:opacity-60">
                {label}
              </span>
              {hot && (
                <span className="absolute top-1 right-2 w-1.5 h-1.5 bg-[#ff00cc] rounded-full animate-pulse" />
              )}
            </Link>
          ))}
        </nav>
        <div className="mt-auto text-[9px] text-gray-600 font-mono">SOL</div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
          role="presentation"
        />
      )}

      <div className="flex-1 min-w-0">
        <header className="border-b border-white/10 bg-black/50 backdrop-blur-xl px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-3 ml-10 lg:ml-0">
            <h1 className="text-lg md:text-xl font-black tracking-tight">
              <span className="text-white">LUCID</span>
              <span className="text-[#00ff88]">.</span>
              <span className="text-gray-400 font-light">drop</span>
            </h1>
            <span className="hidden sm:inline text-[9px] text-[#00ff88]/60 font-mono border border-[#00ff88]/20 px-2 py-0.5 rounded-full bg-[#00ff88]/5">
              SOLANA CASINO
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="px-3 py-2 glass-card rounded-xl text-gray-300 text-sm hover:border-[#00ff88]/30 transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? '🔇' : '🔊'}
            </button>

            <button
              onClick={() => document.querySelector('[data-profile]')?.click()}
              className="px-3 py-2 glass-card rounded-xl text-gray-300 text-sm hover:border-[#00ff88]/30 transition min-w-[44px] min-h-[44px]"
            >
              👤
            </button>

            <button
              onClick={() => document.querySelector('[data-deposit]')?.click()}
              className="px-4 py-2 neon-btn-green rounded-xl text-sm min-h-[44px] bet-pulse"
            >
              💰 Deposit
            </button>

            <WalletMultiButton className="!neon-btn-green !rounded-xl !font-bold !px-4 !py-2 !min-h-[44px]" />
          </div>
        </header>

        <main className="p-3 md:p-6 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
