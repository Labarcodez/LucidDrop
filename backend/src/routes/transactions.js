const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * GET /api/transactions/:wallet
 * Get transaction history for a wallet (Protected)
 * Query params: page, limit, type
 */
router.get('/:wallet', authenticate, async (req, res) => {
  const { wallet } = req.params;
  const { page = 1, limit = 20, type } = req.query;
  
  // Ensure the authenticated user is requesting their own transactions
  if (req.user.walletAddress !== wallet) {
    return res.status(403).json({ error: 'Unauthorized to view these transactions' });
  }
  
  try {
    const query = { walletAddress: wallet };
    if (type && ['deposit', 'withdraw', 'bet'].includes(type)) {
      query.type = type;
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query),
    ]);
    
    // Add Solscan links
    const transactionsWithLinks = transactions.map(tx => ({
      ...tx,
      solscanLink: tx.txHash ? `https://solscan.io/tx/${tx.txHash}` : null,
    }));
    
    res.json({
      transactions: transactionsWithLinks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error(`Transaction history error for ${wallet}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
});

/**
 * GET /api/transactions/:wallet/summary
 * Get transaction summary for a wallet (Protected)
 */
router.get('/:wallet/summary', authenticate, async (req, res) => {
  const { wallet } = req.params;
  
  // Ensure the authenticated user is requesting their own summary
  if (req.user.walletAddress !== wallet) {
    return res.status(403).json({ error: 'Unauthorized to view this summary' });
  }
  
  try {
    const [deposits, withdrawals, bets] = await Promise.all([
      Transaction.aggregate([
        { $match: { walletAddress: wallet, type: 'deposit', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { walletAddress: wallet, type: 'withdraw', status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Transaction.aggregate([
        { $match: { walletAddress: wallet, type: 'bet' } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
    ]);
    
    res.json({
      deposits: {
        total: deposits[0]?.total || 0,
        count: deposits[0]?.count || 0,
      },
      withdrawals: {
        total: withdrawals[0]?.total || 0,
        count: withdrawals[0]?.count || 0,
      },
      bets: {
        count: bets[0]?.count || 0,
      },
    });
  } catch (error) {
    logger.error(`Transaction summary error for ${wallet}: ${error.message}`);
    res.status(500).json({ error: 'Failed to fetch transaction summary' });
  }
});

module.exports = router;
