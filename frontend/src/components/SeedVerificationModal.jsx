import React, { useState } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const SeedVerificationModal = ({ isOpen, onClose, betId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const walletAddress = useCasinoStore((state) => state.publicKey);

  const handleVerify = async () => {
    if (!betId) {
      toast.error('No bet ID provided');
      return;
    }
    if (!walletAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.verifyBet(betId);
      setVerificationResult(response.data);
      toast.success('✅ Verification complete');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0d0d14] border border-[#00ff88]/20 rounded-2xl p-6 max-w-2xl w-full mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-mono text-[#00ff88]/80 tracking-widest">
            🔐 PROVABLY FAIR VERIFICATION
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Bet ID */}
        <div className="mb-4 p-3 bg-black/40 rounded-lg border border-gray-800/50">
          <div className="text-xs text-gray-500 font-mono">Bet ID</div>
          <div className="text-sm font-mono text-gray-300 break-all">{betId || '—'}</div>
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerify}
          disabled={isLoading}
          className={`w-full py-3 rounded-xl font-bold transition-all duration-200 ${
            isLoading
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#00ff88] to-[#00ccff] text-black hover:scale-[1.02] shadow-[0_0_40px_rgba(0,255,136,0.15)]'
          }`}
        >
          {isLoading ? '⏳ VERIFYING...' : '🔍 VERIFY FAIRNESS'}
        </button>

        {/* Results */}
        {verificationResult && (
          <div className="mt-4 p-4 bg-black/40 rounded-lg border border-gray-800/50">
            <div className="space-y-2 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-gray-500">Game</span>
                <span className="text-gray-300">{verificationResult.game}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Client Seed</span>
                <span className="text-gray-300 text-xs break-all">{verificationResult.clientSeed || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Server Seed Hash</span>
                <span className="text-gray-300 text-xs break-all">{verificationResult.serverSeedHash || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Server Seed (revealed)</span>
                <span className="text-gray-300 text-xs break-all">{verificationResult.serverSeed || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Original Multiplier</span>
                <span className="text-gray-300">{verificationResult.originalMultiplier || '—'}</span>
              </div>
              {verificationResult.verifiedMultiplier && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Verified Multiplier</span>
                  <span className="text-gray-300">{verificationResult.verifiedMultiplier}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-gray-800/50">
                <span className="text-gray-500">Hash Match</span>
                <span className={verificationResult.hashMatches ? 'text-[#00ff88]' : 'text-red-500'}>
                  {verificationResult.hashMatches ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Fair</span>
                <span className={verificationResult.isFair ? 'text-[#00ff88]' : 'text-red-500'}>
                  {verificationResult.isFair ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>Timestamp</span>
                <span>{new Date(verificationResult.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Close button */}
        <button
          onClick={onClose}
          className="w-full mt-3 py-2 rounded-lg text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default SeedVerificationModal;
