const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  walletAddress: { type: String, required: true },
  type: { type: String, enum: ['deposit', 'withdraw', 'bet'], required: true },
  amount: { type: Number, required: true },
  txHash: { type: String },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Transaction', TransactionSchema);