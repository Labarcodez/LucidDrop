const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true },
  token: { type: String, required: true },
  expiresAt: { type: Date, default: () => Date.now() + 7 * 24 * 60 * 60 * 1000 },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Session', SessionSchema);