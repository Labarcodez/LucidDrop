const mongoose = require('mongoose');

const BetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  walletAddress: { type: String, required: true },
  game: { type: String, enum: ['crash', 'slots', 'coinflip'], required: true },
  amount: { type: Number, required: true },
  multiplier: { type: Number, default: 1 },
  result: { type: String, enum: ['win', 'loss'], required: true },
  profit: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  // Provably Fair fields
  serverSeed: { type: String },
  serverSeedHash: { type: String },
  clientSeed: { type: String, default: '' },
  nonce: { type: Number, default: 0 },
  revealed: { type: Boolean, default: false },
  outcome: { type: String, enum: ['HEADS', 'TAILS'] },
});

module.exports = mongoose.model('Bet', BetSchema);