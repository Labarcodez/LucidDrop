const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true, unique: true },
  balance: { type: Number, default: 0 },
  totalWagered: { type: Number, default: 0 },
  totalWon: { type: Number, default: 0 },
  totalProfitLoss: { type: Number, default: 0 },
  winRate: { type: Number, default: 0 },
  gamesPlayed: { type: Number, default: 0 },
  gamesWon: { type: Number, default: 0 },
  longestWinStreak: { type: Number, default: 0 },
  currentWinStreak: { type: Number, default: 0 },
  longestLossStreak: { type: Number, default: 0 },
  currentLossStreak: { type: Number, default: 0 },
  stats: {
    crash: { played: { type: Number, default: 0 }, won: { type: Number, default: 0 } },
    slots: { played: { type: Number, default: 0 }, won: { type: Number, default: 0 } },
    coinflip: { played: { type: Number, default: 0 }, won: { type: Number, default: 0 } },
  },
  // Responsible gambling limits
  gamblingLimits: {
    maxBet: { type: Number, default: null }, // Per-bet limit in SOL
    dailyLossLimit: { type: Number, default: null }, // Daily loss limit in SOL
    selfExclusion: {
      enabled: { type: Boolean, default: false },
      until: { type: Date, default: null },
      reason: { type: String, default: '' },
    },
  },
  // Track today's losses for daily limit checking
  dailyLoss: { type: Number, default: 0 },
  dailyLossDate: { type: String, default: null }, // Store as 'YYYY-MM-DD'
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', UserSchema);