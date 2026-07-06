import React, { useState } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';
import ConfirmModal from './ConfirmModal';

const WithdrawModal = ({ isOpen, onClose }) => {
  const { publicKey, balance, setBalance } = useCasinoStore();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [txHash, setTxHash] = useState(null);

  if (!isOpen) return null;

  const walletStr = typeof publicKey === 'string' ? publicKey : publicKey?.toString?.();
  const withdrawAmount = parseFloat(amount) || 0;

  const handleWithdraw = () => {
    if (!walletStr) {
      toast.error('Please connect your wallet first');
      return;
    }
    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (withdrawAmount > balance) {
      toast.error('Insufficient balance');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmWithdraw = async () => {
    setLoading(true);
    setShowConfirm(false);

    try {
      const response = await api.withdraw(walletStr, withdrawAmount);

      if (response.data.success) {
        setIsSuccess(true);
        setTxHash(response.data.txHash || null);
        setBalance(response.data.newBalance);
        setAmount('');
        toast.success('Withdrawal sent!');
        setTimeout(() => {
          setIsSuccess(false);
          setTxHash(null);
          onClose();
        }, 5000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Withdrawal failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (value) => {
    setAmount(Math.min(value, balance).toString());
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
        <div className="glass-card neon-border-purple p-6 max-w-md w-full animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black text-white">💸 Withdraw SOL</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">
              ✕
            </button>
          </div>

          <div className="bg-black/50 p-4 rounded-xl border border-[#ff00cc]/20 mb-4">
            <div className="text-xs text-gray-500 uppercase tracking-widest">Available balance</div>
            <div className="text-2xl font-black text-neon-green multiplier-display mt-1">
              {balance.toFixed(4)} SOL
            </div>
          </div>

          <div className="mb-4">
            <label className="text-xs text-gray-500 font-mono uppercase tracking-wider block mb-2">
              Amount (SOL)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.001"
              step="0.001"
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:border-[#ff00cc]/50 focus:outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap mb-5">
            {[0.1, 0.5, 1, 2, 5].map((value) => (
              <button
                key={value}
                onClick={() => handlePreset(value)}
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-gray-300 hover:border-[#ff00cc]/40 transition"
              >
                {value} SOL
              </button>
            ))}
            <button
              onClick={() => handlePreset(balance)}
              className="px-3 py-1.5 neon-btn-pink rounded-lg text-xs"
            >
              Max
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={loading || !amount || withdrawAmount <= 0}
              className="flex-1 py-3 neon-btn-pink rounded-xl font-bold disabled:opacity-40"
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmWithdraw}
        title="Confirm Withdrawal"
        message={`Withdraw ${withdrawAmount.toFixed(4)} SOL to your wallet?`}
        details={`To: ${walletStr?.slice(0, 10)}...${walletStr?.slice(-8)}`}
        confirmText="Confirm Withdrawal"
        cancelText="Cancel"
        isLoading={loading}
        isSuccess={isSuccess}
        txHash={txHash}
      />
    </>
  );
};

export default WithdrawModal;
