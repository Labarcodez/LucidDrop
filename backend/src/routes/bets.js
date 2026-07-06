const express = require('express');
const router = express.Router();
const Bet = require('../models/Bet');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

// ========================================
// PLACE A BET (Protected)
// ========================================
router.post('/', authenticate, async (req, res) => {
  try {
    const { walletAddress, game, amount, multiplier, result, profit } = req.body;
    
    const bet = new Bet({
      walletAddress,
      game,
      amount,
      multiplier,
      result,
      profit,
    });
    await bet.save();
    
    const user = await User.findOne({ walletAddress });
    if (user) {
      user.totalWagered += amount;
      if (result === 'win') user.totalWon += profit;
      user.balance += profit;
      await user.save();
    }
    
    res.json(bet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// GET USER BET HISTORY (Protected)
// ========================================
router.get('/:wallet', authenticate, async (req, res) => {
  try {
    if (req.params.wallet !== req.user.walletAddress) {
      return res.status(403).json({ error: 'Unauthorized to view these bets' });
    }
    const bets = await Bet.find({ walletAddress: req.params.wallet })
      .sort({ timestamp: -1 })
      .limit(50);
    res.json(bets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========================================
// GET LEADERBOARD
// ========================================
router.get('/leaderboard/top', async (req, res) => {
  try {
    const topUsers = await User.find()
      .sort({ totalWon: -1 })
      .limit(10)
      .select('walletAddress totalWon balance');
    res.json(topUsers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;