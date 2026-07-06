import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { api } from '../services/api';
import toast from 'react-hot-toast';

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 });
  const [filter, setFilter] = useState('all');
  const walletAddress = useCasinoStore((state) => state.publicKey);

  const fetchTransactions = async (page = 1, type = filter) => {
    if (!walletAddress) return;
    
    setLoading(true);
    try {
      const typeParam = type === 'all' ? '' : type;
      const response = await api.getTransactions(walletAddress.toString(), page, 20, typeParam);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      toast.error('Failed to load transaction history');
      console.error('Transaction history error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletAddress) {
      fetchTransactions();
    }
  }, [walletAddress]);

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter);
    fetchTransactions(1, newFilter);
  };

  const handlePageChange = (newPage) => {
    fetchTransactions(newPage, filter);
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'deposit': return 'text-[#00ff88]';
      case 'withdraw': return 'text-[#ff00cc]';
      case 'bet': return 'text-[#00ccff]';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'deposit': return '📥';
      case 'withdraw': return '📤';
      case 'bet': return '🎲';
      default: return '📋';
    }
  };

  if (!walletAddress) {
    return (
      <div className="text-center py-8 text-gray-500 font-mono">
        Connect your wallet to view transaction history
      </div>
    );
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-2 py-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-black/40 rounded-lg animate-pulse border border-gray-800/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'deposit', 'withdraw', 'bet'].map((type) => (
          <button
            key={type}
            onClick={() => handleFilterChange(type)}
            className={`px-3 py-1.5 text-xs font-mono rounded-lg border transition ${
              filter === type
                ? 'bg-[#00ff88]/10 border-[#00ff88]/30 text-[#00ff88]'
                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Transactions list */}
      {transactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500 font-mono">
          No transactions found
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {transactions.map((tx) => (
            <div
              key={tx._id}
              className="flex items-center justify-between p-3 bg-black/40 rounded-lg border border-gray-800/50 hover:border-gray-700/50 transition"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{getTypeIcon(tx.type)}</span>
                <div>
                  <div className={`text-sm font-mono font-bold ${getTypeColor(tx.type)}`}>
                    {tx.type.toUpperCase()}
                  </div>
                  <div className="text-xs text-gray-500 font-mono">
                    {new Date(tx.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-sm font-mono font-bold ${tx.type === 'deposit' ? 'text-[#00ff88]' : tx.type === 'withdraw' ? 'text-[#ff00cc]' : 'text-[#00ccff]'}`}>
                  {tx.type === 'deposit' ? '+' : tx.type === 'withdraw' ? '-' : ''}
                  {tx.amount.toFixed(4)} SOL
                </div>
                {tx.txHash && (
                  <a
                    href={`https://solscan.io/tx/${tx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#00ff88]/40 hover:text-[#00ff88]/80 transition font-mono"
                  >
                    🔗 View on Solscan
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1}
            className="px-3 py-1 text-xs font-mono rounded border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-500 transition"
          >
            ←
          </button>
          <span className="text-xs font-mono text-gray-500 px-2 py-1">
            {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.pages}
            className="px-3 py-1 text-xs font-mono rounded border border-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:border-gray-500 transition"
          >
            →
          </button>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;
