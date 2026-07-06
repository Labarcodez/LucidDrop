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

  const withdrawAmount = parseFloat(amount) || 0;

  const handleWithdraw = async () => {
    if (!publicKey) {
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

    // Show confirmation modal
    setShowConfirm(true);
  };

  const handleConfirmWithdraw = async () => {
    setLoading(true);
    setShowConfirm(false);

    try {
      const token = localStorage.getItem('luciddrop_auth_token');
      const response = await api.withdraw(publicKey.toString(), withdrawAmount, token);
      
      if (response.data.success) {
        setIsSuccess(true);
        setTxHash(response.data.txHash || null);
        setBalance(response.data.newBalance);
        setAmount('');
        
        // Close after success confirmation
        setTimeout(() => {
          setIsSuccess(false);
          setTxHash(null);
          onClose();
        }, 5000);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Withdrawal failed. Please try again.');
      setShowConfirm(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePreset = (value) => {
    setAmount(value.toString());
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-[#0d0d14] border border-white/10 rounded-2xl p-6 max-w-sm w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">💸 Withdraw SOL</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">✕</button>
          </div>
          
          <div className="bg-black/40 p-3 rounded-lg border border-gray-700 mb-4">
            <div className="text-sm text-gray-400">Balance</div>
            <div className="text-xl font-mono text-[#00ff88]">{balance.toFixed(4)} SOL</div>
          </div>

          <div className="mb-4">
            <label className="text-sm text-gray-400 block mb-1">Amount (SOL)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              min="0.001"
              step="0.001"
              className="w-full bg-black/60 border border-gray-700 rounded-lg px-4 py-3 text-white font-mono focus:border-[#00ff88] focus:outline-none"
            />
          </div>

          <div className="flex gap-2 flex-wrap mb-4">
            {[0.1, 0.5, 1, 2, 5].map((value) => (
              <button
                key={value}
                onClick={() => handlePreset(value)}
                className="px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-gray-300 hover:border-gray-500 transition"
              >
                {value} SOL
              </button>
            ))}
            <button
              onClick={() => handlePreset(balance)}
              className="px-3 py-1.5 bg-[#00ff88]/10 border border-[#00ff88]/30 rounded-lg text-xs text-[#00ff88] hover:bg-[#00ff88]/20 transition"
            >
              Max
            </button>
          </div>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-700 rounded-lg text-white font-bold hover:bg-gray-600 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleWithdraw}
              disabled={loading || !amount || withdrawAmount <= 0}
              className="flex-1 py-2 bg-[#ff00cc]/20 border border-[#ff00cc]/30 rounded-lg text-[#ff00cc] font-bold hover:bg-[#ff00cc]/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Withdraw'}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmWithdraw}
        title="Confirm Withdrawal"
        message={`Are you sure you want to withdraw ${withdrawAmount.toFixed(4)} SOL?`}
        details={`To: ${publicKey?.toString().slice(0, 10)}...${publicKey?.toString().slice(-8)}`}
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
