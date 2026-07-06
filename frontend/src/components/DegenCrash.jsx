import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';
import { sound } from '../utils/sound';
import { SolCoins } from './SolCoins';
import { SeedVerify } from './SeedVerify';
// import { useLoading } from '../hooks/useLoading';

export const DegenCrash = React.memo(() => {
  const [multiplier, setMultiplier] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [history, setHistory] = useState([]);
  const [betAmount, setBetAmount] = useState(0);          // ← default 0
  const [autoCashout, setAutoCashout] = useState(2);
  const [hasCashedOut, setHasCashedOut] = useState(false);
  const [gameTimer, setGameTimer] = useState(5);
  const [playerCount, setPlayerCount] = useState(23);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastWin, setLastWin] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingBet, setPendingBet] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isFlashing, setIsFlashing] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCoins, setShowCoins] = useState(false);
  
  const balance = useCasinoStore((state) => state.balance);
  const walletAddress = useCasinoStore((state) => state.publicKey);
  const addBet = useCasinoStore((state) => state.addBet);
  const containerRef = useRef(null);

  // Simulate player count
  useEffect(() => {
    const interval = setInterval(() => {
      const change = Math.floor(Math.random() * 6 - 2.5);
      setPlayerCount(prev => Math.max(8, Math.min(120, prev + change)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Countdown logic – NO AUTO-START
  useEffect(() => {
    if (!isPlaying && !crashed && gameTimer > 0) {
      const timer = setInterval(() => {
        setGameTimer(prev => {
          if (prev <= 1) setCountdown(3);
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
    // AUTO-START REMOVED – only starts via user click
  }, [gameTimer, isPlaying, crashed]);

  // Countdown animation
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 400);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const startRound = useCallback(() => {
    setMultiplier(1);
    setCrashed(false);
    setIsPlaying(true);
    setHasCashedOut(false);
    setGameTimer(0);
    sound.play('spin');
  }, []);

  // Crash multiplier logic - uses backend for actual result
  useEffect(() => {
    let interval;
    let crashPoint = 0;
    let roundActive = false;
    
    if (isPlaying && !crashed) {
      // Start a new round - fetch crash point from backend
      const startRound = async () => {
        try {
          const response = await api.crashResult(betAmount, autoCashout, '');
          const data = response.data;
          crashPoint = data.multiplier;
          
          // Update balance from response
          useCasinoStore.setState({ balance: data.newBalance });
          
          // Start the multiplier animation
          roundActive = true;
          interval = setInterval(() => {
            const increment = 0.02 + Math.random() * 0.04;
            const newMultiplier = multiplier + increment;
            
            if (autoCashout > 0 && newMultiplier >= autoCashout && !hasCashedOut) {
              handleCashOut(newMultiplier);
              roundActive = false;
              return;
            }

            if (newMultiplier >= crashPoint) {
              setIsShaking(true);
              setIsFlashing(true);
              setTimeout(() => {
                setIsShaking(false);
                setIsFlashing(false);
              }, 600);
              
              setCrashed(true);
              setIsPlaying(false);
              setHistory(prev => [multiplier.toFixed(2) + 'x', ...prev].slice(0, 20));
              if (betAmount > 0 && walletAddress) {
                addBet('Crash', betAmount, 0);
              }
              sound.play('loss');
              setMultiplier(1);
              setGameTimer(5);
              roundActive = false;
            } else {
              setMultiplier(newMultiplier);
            }
          }, 50);
        } catch (error) {
          console.error('Crash result error:', error);
          toast.error('Failed to start crash round. Please try again.');
          setIsPlaying(false);
          setMultiplier(1.00);
          setGameTimer(5);
        }
      };
      
      startRound();
    }
    return () => {
      if (interval) clearInterval(interval);
      roundActive = false;
    };
  }, [isPlaying, crashed, multiplier, autoCashout, hasCashedOut, betAmount, walletAddress, addBet]);

  const handleCashOut = useCallback(async (currentMultiplier) => {
    if (isPlaying && !crashed && !hasCashedOut && walletAddress) {
      setIsLoading(true);
      const winAmount = betAmount * currentMultiplier;
      setLastWin(winAmount);
      setHasCashedOut(true);
      setIsPlaying(false);
      
      try {
        await api.cashout(walletAddress.toString(), betAmount, currentMultiplier);
        addBet('Crash', betAmount, currentMultiplier);
        sound.play('cashout');
        toast.success(`🎉 Won ${winAmount.toFixed(2)} SOL!`);
        setShowCoins(true);
        setTimeout(() => setShowCoins(false), 2500);
      } catch (error) {
        console.error('Cashout failed:', error);
        toast.error('Cashout failed, please try again.');
      }
      
      setMultiplier(1.00);
      setGameTimer(5);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
      setIsLoading(false);
    }
  }, [isPlaying, crashed, hasCashedOut, walletAddress, betAmount, addBet]);

  const handlePlaceBet = useCallback(() => {
    if (betAmount <= 0) {
      toast.error('Please enter a bet amount!');
      return;
    }
    if (betAmount > balance) {
      toast.error('Insufficient balance!');
      return;
    }
    if (!walletAddress) {
      toast.error('Please connect your wallet first!');
      return;
    }
    setPendingBet(betAmount);
    setShowConfirm(true);
  }, [betAmount, balance, walletAddress]);

  const confirmBet = useCallback(() => {
    setShowConfirm(false);
    startRound();
  }, [startRound]);

  // Pulse effect when multiplier > 3
  const shouldPulse = useMemo(
    () => isPlaying && multiplier > 3 && !crashed && !hasCashedOut,
    [isPlaying, multiplier, crashed, hasCashedOut]
  );

  return (
    <div 
      ref={containerRef}
      className={`relative glass-card neon-border-purple p-6 ${isShaking ? 'shake' : ''} ${isFlashing ? 'crash-flash' : ''}`}
    >
      <SolCoins active={showCoins} onComplete={() => setShowCoins(false)} />

      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="text-7xl font-black text-[#00ff88] animate-pulse drop-shadow-[0_0_40px_rgba(0,255,136,0.5)] cashout-celebrate">
            🎉 +{lastWin.toFixed(2)} SOL 🎉
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirm}
        onConfirm={confirmBet}
        onCancel={() => setShowConfirm(false)}
        message={`Place bet of ${pendingBet} SOL?`}
      />

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-[#00ff88] rounded-full animate-pulse shadow-[0_0_10px_#00ff88]" />
          <span className="text-xs font-mono text-[#00ff88]/60 tracking-widest">LIVE</span>
          <span className="text-xs text-gray-600 font-mono">
            {gameTimer > 0 ? `NEXT ROUND IN ${gameTimer}s` : 'ROUND ACTIVE'}
          </span>
        </div>
        <div className="flex gap-1.5">
          {history.slice(0, 8).map((h, i) => (
            <span
              key={i}
              className={`text-xs font-mono px-2 py-0.5 rounded border ${
                parseFloat(h) > 5
                  ? 'text-[#ff00cc] border-[#ff00cc]/30 bg-[#ff00cc]/5'
                  : 'text-[#00ff88]/40 border-[#00ff88]/10'
              }`}
            >
              {h}
            </span>
          ))}
        </div>
      </div>

      {countdown > 0 && !isPlaying && !crashed && (
        <div className="text-center py-4">
          <div className="text-8xl font-black font-['Orbitron'] text-[#ff8800] animate-pulse">
            {countdown}
          </div>
          <div className="text-xs text-gray-500 font-mono tracking-widest">ROUND STARTING</div>
        </div>
      )}

      <div className="text-center py-8 relative">
        <div
          className={`text-9xl font-black multiplier-display tracking-tight transition-all duration-75 ${
            isPlaying ? 'text-[#00ff88] drop-shadow-[0_0_60px_rgba(0,255,136,0.3)] multiplier-pop' :
            crashed ? 'text-red-500 drop-shadow-[0_0_60px_rgba(255,0,0,0.3)]' :
            gameTimer > 0 || countdown > 0 ? 'text-gray-700' : 'text-gray-700'
          }`}
          key={multiplier}
        >
          {isPlaying ? multiplier.toFixed(2) : gameTimer > 0 || countdown > 0 ? '--' : '1.00'}
          <span className="text-4xl text-gray-500 font-bold ml-2">x</span>
        </div>
        {hasCashedOut && (
          <div className="text-[#00ff88] text-lg mt-2 font-bold tracking-wider cashout-celebrate">
            ✅ CASHED OUT @ {autoCashout.toFixed(2)}x
          </div>
        )}
        {crashed && (
          <div className="text-red-500 text-lg mt-2 font-bold animate-pulse tracking-wider">
            💥 CRASHED
          </div>
        )}
        {gameTimer > 0 && !isPlaying && !crashed && !countdown && (
          <div className="text-[#ff8800] text-sm mt-2 font-bold animate-pulse tracking-wider">
            ⏳ ROUND STARTING...
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-gray-500 font-mono tracking-wider">BET (SOL)</label>
          <input
            type="number"
            value={betAmount}
            onChange={(e) => setBetAmount(Number.parseFloat(e.target.value) || 0)}
            step="0.01"
            min="0"
            className="w-full mt-1 px-3 py-2 bg-black/60 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-[#00ff88]/50 focus:outline-none transition"
            placeholder="0.00"
          />
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {[0.1, 0.5, 1, 2, 5].map((p) => (
              <button
                key={p}
                onClick={() => setBetAmount(p)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition ${
                  betAmount === p
                    ? 'bg-[#00ff88] text-black border-[#00ff88] shadow-[0_0_20px_rgba(0,255,136,0.15)]'
                    : 'bg-transparent text-gray-400 border-gray-700 hover:border-[#00ff88]/30 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500 font-mono tracking-wider">AUTO</label>
          <div className="flex gap-1 mt-1 flex-wrap">
            {[1.5, 2, 3, 5].map((p) => (
              <button
                key={p}
                onClick={() => setAutoCashout(p)}
                className={`px-2.5 py-1 text-xs font-mono rounded border transition ${
                  autoCashout === p
                    ? 'bg-[#00ccff] text-black border-[#00ccff] shadow-[0_0_20px_rgba(0,204,255,0.15)]'
                    : 'bg-transparent text-gray-400 border-gray-700 hover:border-[#00ccff]/30 hover:text-white'
                }`}
              >
                {p}x
              </button>
            ))}
          </div>
          <input
            type="number"
            value={autoCashout}
            onChange={(e) => setAutoCashout(parseFloat(e.target.value) || 0)}
            step="0.1"
            className="w-full mt-1 px-2 py-1.5 bg-black/60 border border-gray-700 rounded-lg text-white font-mono text-sm focus:border-[#00ff88]/50 focus:outline-none transition"
          />
        </div>
      </div>

      <div className="flex gap-3 mb-4">
        <button
          onClick={handlePlaceBet}
          disabled={isPlaying || gameTimer === 0 || isLoading || countdown > 0}
          className={`flex-1 py-4 rounded-xl font-bold text-black text-lg transition-all duration-200 ${
            isPlaying || gameTimer === 0 || isLoading || countdown > 0
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'neon-btn-green bet-pulse text-lg py-4'
          }`}
          data-action="bet"
        >
          {isPlaying ? '🎯 IN PLAY' : countdown > 0 ? `⏳ ${countdown}` : gameTimer > 0 ? '⏳ WAIT' : '🚀 PLACE BET'}
        </button>
        <button
          onClick={() => handleCashOut(multiplier)}
          disabled={!isPlaying || crashed || hasCashedOut || isLoading}
          data-action="cashout"
          className={`flex-1 py-4 rounded-xl font-bold text-[#ff00cc] text-lg border transition-all duration-200 ${
            !isPlaying || crashed || hasCashedOut || isLoading
              ? 'opacity-30 cursor-not-allowed border-[#ff00cc]/10'
              : shouldPulse
              ? 'pulse-cashout border-[#ff00cc]/60 hover:bg-[#ff00cc]/10 hover:scale-[1.03] shadow-[0_0_40px_rgba(255,0,204,0.05)]'
              : 'border-[#ff00cc]/40 hover:bg-[#ff00cc]/10 hover:scale-[1.03] shadow-[0_0_40px_rgba(255,0,204,0.05)]'
          }`}
        >
          💰 CASH OUT
        </button>
      </div>

      <div className="flex justify-between items-center pt-3 border-t border-gray-800/50 text-xs">
        <span className="text-gray-500 font-mono">🔥 {playerCount} PLAYING</span>
        <span className="text-gray-500 font-mono">💰 {balance.toFixed(4)} SOL</span>
        <span className="text-gray-500 font-mono">⚡ {isPlaying ? 'LIVE' : 'IDLE'}</span>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-800/50">
        <div className="flex gap-1.5 overflow-x-auto pb-2">
          {history.slice(0, 15).map((h, i) => (
            <span
              key={i}
              className={`text-xs font-mono px-2 py-0.5 rounded whitespace-nowrap ${
                parseFloat(h) > 5
                  ? 'text-[#ff00cc] border border-[#ff00cc]/20 bg-[#ff00cc]/5'
                  : parseFloat(h) > 2
                  ? 'text-[#ff8800] border border-[#ff8800]/20 bg-[#ff8800]/5'
                  : 'text-gray-500 border border-gray-700'
              }`}
            >
              {h}
            </span>
          ))}
          {history.length === 0 && (
            <span className="text-xs text-gray-600">Waiting for rounds...</span>
          )}
        </div>
      </div>

      <SeedVerify roundId={Date.now()} />
    </div>
  );
});