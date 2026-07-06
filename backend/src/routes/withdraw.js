const express = require('express');
const router = express.Router();
const { processWithdrawal } = require('../services/withdrawal');
const { authenticate } = require('../middleware/auth');
const logger = require('../utils/logger');

/**
 * POST /api/withdraw
 * Process a withdrawal request (Protected)
 * Body: { walletAddress, amount }
 */
router.post('/', authenticate, async (req, res) => {
  const { walletAddress, amount } = req.body;

  // Validate input
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be greater than 0' });
  }

  try {
    const result = await processWithdrawal(walletAddress, amount);
    res.json({
      success: true,
      txHash: result.txHash,
      newBalance: result.newBalance,
      transaction: result.transaction,
      solscanLink: `https://solscan.io/tx/${result.txHash}`,
    });
  } catch (error) {
    logger.error(`Withdrawal error for ${walletAddress}: ${error.message}`);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
