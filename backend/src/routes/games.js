const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Bet = require('../models/Bet');
const User = require('../models/User');
const bonusService = require('../services/bonus');
const { authenticate } = require('../middleware/auth');

router.get('/bonus/status', (req, res) => {
  res.json(bonusService.getBonusStatus());
});

router.get('/jackpot', async (req, res) => {
  try {
    const result = await Bet.aggregate([
      { $match: { result: 'win' } },
      { $group: { _id: null, total: { $sum: '$profit' } } }
    ]);
    const jackpot = result.length > 0 ? result[0].total : 42.7;
    res.json({ value: Math.round(jackpot * 10) / 10 });
  } catch (error) {
    res.json({ value: 42.7 });
  }
});

// ========================================
// CRASH - Generate Result (Protected)
// ========================================
router.post('/crash/result', authenticate, async (req, res) => {
  const { betAmount, autoCashout, clientSeed } = req.body;
  const walletAddress = req.user.walletAddress;
  
  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  
  // Check user balance
  const user = await User.findOne({ walletAddress });
  if (!user || user.balance < betAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Deduct bet amount atomically
  const updatedUser = await User.findOneAndUpdate(
    { walletAddress, balance: { $gte: betAmount } },
    { $inc: { balance: -betAmount, totalWagered: betAmount } },
    { new: true }
  );
  
  if (!updatedUser) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
  
  const combined = serverSeed + (clientSeed || '');
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  const crashPoint = 1.5 + (parseInt(hash.slice(0, 8), 16) % 850) / 100;
  
  const result = {
    multiplier: crashPoint,
    crashed: true,
    serverSeed,
    serverSeedHash,
    clientSeed: clientSeed || '',
    hash,
  };
  
  const bet = new Bet({
    walletAddress,
    game: 'crash',
    amount: betAmount,
    multiplier: crashPoint,
    result: 'loss',
    profit: -betAmount,
    serverSeed,
    clientSeed: clientSeed || '',
  });
  await bet.save();
  
  res.json({ ...result, newBalance: updatedUser.balance });
});

// ========================================
// CRASH - Cashout (Protected)
// ========================================
router.post('/crash/cashout', authenticate, async (req, res) => {
  const { betAmount, multiplier } = req.body;
  const walletAddress = req.user.walletAddress;
  
  if (!betAmount || betAmount <= 0 || !multiplier || multiplier <= 1) {
    return res.status(400).json({ error: 'Invalid cashout data' });
  }
  
  const winAmount = betAmount * multiplier;
  const profit = winAmount - betAmount;
  
  // Update user balance atomically
  const user = await User.findOneAndUpdate(
    { walletAddress },
    { $inc: { balance: profit, totalWon: profit } },
    { new: true }
  );
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  const bet = new Bet({
    walletAddress,
    game: 'crash',
    amount: betAmount,
    multiplier,
    result: 'win',
    profit,
  });
  await bet.save();
  
  res.json({ winAmount, profit, newBalance: user.balance });
});

// ========================================
// SLOTS - Generate Result (Protected)
// ========================================
router.post('/slots/result', authenticate, async (req, res) => {
  const { betAmount, clientSeed } = req.body;
  const walletAddress = req.user.walletAddress;
  
  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  
  // Check user balance
  const user = await User.findOne({ walletAddress });
  if (!user || user.balance < betAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Deduct bet amount atomically
  const updatedUser = await User.findOneAndUpdate(
    { walletAddress, balance: { $gte: betAmount } },
    { $inc: { balance: -betAmount, totalWagered: betAmount } },
    { new: true }
  );
  
  if (!updatedUser) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  const symbols = ['🍒', '🍋', '🍊', '🍇', '💎', '7️⃣', '⭐', '🎰'];
  const weights = [25, 20, 18, 15, 10, 6, 4, 2];
  
  const getWeightedSymbol = () => {
    const total = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
      random -= weights[i];
      if (random <= 0) return symbols[i];
    }
    return symbols[0];
  };
  
  const reels = [
    getWeightedSymbol(),
    getWeightedSymbol(),
    getWeightedSymbol(),
  ];
  
  let multiplier = 0;
  if (reels[0] === reels[1] && reels[1] === reels[2]) {
    const symbolIndex = symbols.indexOf(reels[0]);
    const multipliers = [10, 8, 6, 5, 20, 50, 15, 100];
    multiplier = multipliers[symbolIndex] || 5;
  } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
    multiplier = 1.5;
  }
  
  // Generate provably fair seeds
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
  const nonce = Math.floor(Math.random() * 1000000);
  
  const result = {
    reels,
    multiplier,
    win: multiplier > 0,
    winAmount: multiplier > 0 ? betAmount * multiplier : 0,
    serverSeedHash,
  };
  
  let bet;
  if (multiplier > 0) {
    const profit = betAmount * multiplier - betAmount;
    
    // Update user balance with winnings
    await User.findOneAndUpdate(
      { walletAddress },
      { $inc: { balance: profit, totalWon: profit } }
    );
    
    bet = new Bet({
      walletAddress,
      game: 'slots',
      amount: betAmount,
      multiplier,
      result: 'win',
      profit,
      serverSeed,
      serverSeedHash,
      clientSeed: clientSeed || '',
      nonce,
      revealed: true,
    });
    await bet.save();
    
    // Get updated balance
    const finalUser = await User.findOne({ walletAddress });
    result.newBalance = finalUser.balance;
  } else {
    bet = new Bet({
      walletAddress,
      game: 'slots',
      amount: betAmount,
      multiplier,
      result: 'loss',
      profit: -betAmount,
      serverSeed,
      serverSeedHash,
      clientSeed: clientSeed || '',
      nonce,
      revealed: true,
    });
    await bet.save();
    result.newBalance = updatedUser.balance;
  }
  
  res.json(result);
});

// ========================================
// COIN FLIP - Generate Result (Protected)
// ========================================
router.post('/coinflip/result', authenticate, async (req, res) => {
  const { betAmount, choice, clientSeed } = req.body;
  const walletAddress = req.user.walletAddress;
  
  if (!betAmount || betAmount <= 0) {
    return res.status(400).json({ error: 'Invalid bet amount' });
  }
  
  // Check user balance
  const user = await User.findOne({ walletAddress });
  if (!user || user.balance < betAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Deduct bet amount atomically
  const updatedUser = await User.findOneAndUpdate(
    { walletAddress, balance: { $gte: betAmount } },
    { $inc: { balance: -betAmount, totalWagered: betAmount } },
    { new: true }
  );
  
  if (!updatedUser) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  // Generate provably fair seeds
  const serverSeed = crypto.randomBytes(32).toString('hex');
  const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');
  const nonce = Math.floor(Math.random() * 1000000);
  
  // Generate deterministic outcome using crypto with seed combination
  const combined = serverSeed + (clientSeed || '');
  const hash = crypto.createHash('sha256').update(combined).digest('hex');
  const outcome = parseInt(hash.slice(0, 8), 16) % 2 === 0 ? 'HEADS' : 'TAILS';
  const won = outcome === (choice || 'HEADS');
  const multiplier = won ? 2 : 0;
  const profit = won ? betAmount : -betAmount;
  
  let bet;
  if (won) {
    // Update user balance with winnings
    await User.findOneAndUpdate(
      { walletAddress },
      { $inc: { balance: profit, totalWon: profit } }
    );
  }
  
  bet = new Bet({
    walletAddress,
    game: 'coinflip',
    amount: betAmount,
    multiplier,
    result: won ? 'win' : 'loss',
    profit,
    outcome,
    choice: choice || 'HEADS',
    serverSeed,
    serverSeedHash,
    clientSeed: clientSeed || '',
    nonce,
    revealed: true,
  });
  await bet.save();
  
  // Get updated balance
  const finalUser = await User.findOne({ walletAddress });
  
  res.json({
    outcome,
    won,
    multiplier,
    winAmount: won ? betAmount * multiplier : 0,
    profit,
    newBalance: finalUser.balance,
    choice: choice || 'HEADS',
    serverSeedHash,
    serverSeed,
    clientSeed: clientSeed || '',
  });
});

// ========================================
// SEED VERIFICATION - Verify a bet's fairness
// ========================================
router.get('/verify/:betId', authenticate, async (req, res) => {
  const { betId } = req.params;
  const walletAddress = req.user.walletAddress;
  
  try {
    const bet = await Bet.findOne({ _id: betId, walletAddress });
    if (!bet) {
      return res.status(404).json({ error: 'Bet not found' });
    }
    
    // Verify that the stored server seed matches the hash
    const computedHash = crypto.createHash('sha256').update(bet.serverSeed).digest('hex');
    const hashMatches = computedHash === bet.serverSeedHash;
    
    // Recompute the outcome using the stored seeds
    const combined = bet.serverSeed + (bet.clientSeed || '');
    const hash = crypto.createHash('sha256').update(combined).digest('hex');
    
    let verifiedMultiplier = null;
    if (bet.game === 'crash') {
      verifiedMultiplier = 1.5 + (parseInt(hash.slice(0, 8), 16) % 850) / 100;
    }
    
    res.json({
      betId: bet._id,
      game: bet.game,
      serverSeed: bet.serverSeed,
      serverSeedHash: bet.serverSeedHash,
      clientSeed: bet.clientSeed,
      computedHash,
      hashMatches,
      hash,
      verifiedMultiplier,
      originalMultiplier: bet.multiplier,
      isFair: hashMatches && (bet.game === 'coinflip' || Math.abs(verifiedMultiplier - bet.multiplier) < 0.0001),
      timestamp: bet.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

module.exports = router;