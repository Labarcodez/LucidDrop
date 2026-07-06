import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

export const CustomWalletButton = () => {
  const { connected, publicKey, disconnect, connecting, select, wallets } = useWallet();
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

  useEffect(() => {
    // Check if Phantom is installed
    const checkPhantom = () => {
      const isInstalled = window.solana && window.solana.isPhantom;
      setIsPhantomInstalled(!!isInstalled);
    };
    checkPhantom();
    window.addEventListener('load', checkPhantom);
    return () => window.removeEventListener('load', checkPhantom);
  }, []);

  const handleConnect = () => {
    if (!isPhantomInstalled) {
      window.open('https://phantom.app/', '_blank');
      return;
    }
    // Find and select Phantom wallet
    const phantomWallet = wallets.find(w => w.name === 'Phantom');
    if (phantomWallet) {
      select(phantomWallet.name);
      // Trigger the connection
      const button = document.querySelector('.wallet-adapter-button');
      if (button) button.click();
    }
  };

  const truncate = (str) => {
    if (!str) return '';
    return str.slice(0, 4) + '...' + str.slice(-4);
  };

  if (connected && publicKey) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#00ff88] font-mono border border-[#00ff88]/30 px-3 py-1 rounded-full">
          ● {truncate(publicKey.toString())}
        </span>
        <button
          onClick={disconnect}
          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm font-bold transition"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleConnect}
      disabled={connecting}
      className="px-6 py-3 bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black font-bold rounded-xl hover:scale-105 transition-all duration-200 shadow-[0_0_30px_rgba(0,255,136,0.2)] disabled:opacity-50 flex items-center gap-2"
    >
      {connecting ? '🔄 Connecting...' : isPhantomInstalled ? '🔗 Connect Phantom' : '⬇️ Install Phantom'}
    </button>
  );
};