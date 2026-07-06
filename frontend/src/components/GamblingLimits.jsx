import React, { useState, useEffect } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { api } from '../services/api';

export const GamblingLimits = () => {
  const { publicKey, isAuthenticated } = useCasinoStore();
  const [limits, setLimits] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form states
  const [maxBet, setMaxBet] = useState('');
  const [dailyLossLimit, setDailyLossLimit] = useState('');
  const [selfExcludeEnabled, setSelfExcludeEnabled] = useState(false);
  const [selfExcludeHours, setSelfExcludeHours] = useState(24);
  const [selfExcludeReason, setSelfExcludeReason] = useState('');

  const fetchLimits = async () => {
    if (!publicKey || !isAuthenticated) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get('/users/limits');
      if (response.data.success) {
        const data = response.data.limits;
        setLimits(data);
        setMaxBet(data.maxBet !== null ? data.maxBet.toString() : '');
        setDailyLossLimit(data.dailyLossLimit !== null ? data.dailyLossLimit.toString() : '');
        setSelfExcludeEnabled(data.selfExclusion?.enabled || false);
        setSelfExcludeReason(data.selfExclusion?.reason || '');
      }
    } catch (err) {
      console.error('Failed to fetch limits:', err);
      setError('Could not load gambling limits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLimits();
  }, [publicKey, isAuthenticated]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const payload = {
        maxBet: maxBet === '' ? null : parseFloat(maxBet),
        dailyLossLimit: dailyLossLimit === '' ? null : parseFloat(dailyLossLimit),
      };

      if (selfExcludeEnabled) {
        payload.selfExclusion = {
          enabled: true,
          hours: selfExcludeHours,
          reason: selfExcludeReason || 'Self-exclusion requested',
        };
      } else {
        payload.selfExclusion = {
          enabled: false,
        };
      }

      const response = await api.put('/users/limits', payload);

      if (response.data.success) {
        setSuccess(true);
        await fetchLimits();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save limits:', err);
      setError('Failed to save limits. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center text-gray-500 py-4 text-sm">
        Connect wallet to manage gambling limits
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

  const isSelfExcluded = limits?.selfExclusion?.active || false;
  const remainingHours = limits?.selfExclusion?.remaining || 0;

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-green-400 text-sm">
          ✅ Limits saved successfully!
        </div>
      )}

      {/* Per-bet limit */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Max Bet (SOL) — Leave empty for no limit
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={maxBet}
          onChange={(e) => setMaxBet(e.target.value)}
          placeholder="No limit"
          className="w-full bg-black/60 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00ff88] focus:outline-none"
        />
      </div>

      {/* Daily loss limit */}
      <div>
        <label className="block text-xs text-gray-400 mb-1">
          Daily Loss Limit (SOL) — Leave empty for no limit
        </label>
        <input
          type="number"
          step="0.01"
          min="0"
          value={dailyLossLimit}
          onChange={(e) => setDailyLossLimit(e.target.value)}
          placeholder="No limit"
          className="w-full bg-black/60 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00ff88] focus:outline-none"
        />
        {limits?.dailyLoss !== undefined && limits.dailyLoss > 0 && (
          <div className="text-xs text-gray-500 mt-1">
            Today's loss: {limits.dailyLoss.toFixed(4)} SOL
          </div>
        )}
      </div>

      {/* Self-exclusion */}
      <div className="border-t border-white/10 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-300">Self-Exclusion</span>
          {isSelfExcluded && (
            <span className="text-xs text-red-400 bg-red-500/20 px-2 py-1 rounded">
              Active — {remainingHours}h remaining
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={selfExcludeEnabled}
              onChange={(e) => setSelfExcludeEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-700 peer-focus:ring-2 peer-focus:ring-[#00ff88]/30 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00ff88]"></div>
          </label>
          <span className="text-xs text-gray-400">
            {selfExcludeEnabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {selfExcludeEnabled && (
          <div className="mt-3 space-y-2">
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Duration (hours)
              </label>
              <select
                value={selfExcludeHours}
                onChange={(e) => setSelfExcludeHours(parseInt(e.target.value))}
                className="w-full bg-black/60 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#00ff88] focus:outline-none"
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>72 hours</option>
                <option value={168}>7 days</option>
                <option value={336}>14 days</option>
                <option value={720}>30 days</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                Reason (optional)
              </label>
              <input
                type="text"
                value={selfExcludeReason}
                onChange={(e) => setSelfExcludeReason(e.target.value)}
                placeholder="Why are you taking a break?"
                className="w-full bg-black/60 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:border-[#ff00cc] focus:outline-none"
              />
            </div>
          </div>
        )}

        {isSelfExcluded && (
          <div className="mt-2 text-xs text-red-400 bg-red-500/10 p-2 rounded border border-red-500/20">
            ⚠️ You are currently self-excluded. You cannot place bets until the exclusion period ends.
          </div>
        )}
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-2 bg-[#00ff88]/20 border border-[#00ff88]/30 rounded-lg text-[#00ff88] text-sm font-bold hover:bg-[#00ff88]/30 transition disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Limits'}
      </button>
    </div>
  );
};
