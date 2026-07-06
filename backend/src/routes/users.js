const express = require('express');
const router = express.Router();
const User = require('../models/User');
const solana = require('../services/solana');
const { verifyWalletSignature, generateToken, authenticate } = require('../middleware/auth');

// ========================================
// WALLET SIGN-IN (Signature Verification)
// ========================================
router.post('/signin', async (req, res) => {
  try {
    const { walletAddress, message, signature } = req.body;

    if (!walletAddress || !message || !signature) {
      return res.status(400).json({ error: 'Missing required fields: walletAddress, message, signature' });
    }

    // Verify the signature
    const isValid = verifyWalletSignature(message, signature, walletAddress);
    if (!isValid) return res.status(401).json({ error: 'Invalid signature' });

    // Generate JWT token
    const token = generateToken(walletAddress);

    // Get or create user
    let user = await User.findOne({ walletAddress });
    if (!user) {
      user = new User({ walletAddress, balance: 0 });
      await user.save();
    }

    // Sync real balance from blockchain
    try {
      const realBalance = await solana.getBalance(walletAddress);
      user.balance = realBalance;
      await user.save();
    } catch (err) {
      // If chain call fails, log but continue with DB balance
      console.warn('Failed to sync chain balance for', walletAddress, err?.message || err);
    }

    return res.json({
      success: true,
      token,
      user: { walletAddress: user.walletAddress, balance: user.balance },
    });
  } catch (err) {
    console.error('Signin error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// Get current authenticated user
// ========================================
router.get('/me', authenticate, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) return res.status(401).json({ error: 'Invalid token payload' });

    let user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Optionally refresh balance
    try {
      user.balance = await solana.getBalance(walletAddress);
      await user.save();
    } catch (err) {
      console.warn('Failed to refresh balance for', walletAddress);
    }

    return res.json({ success: true, user: { walletAddress: user.walletAddress, balance: user.balance } });
  } catch (err) {
    console.error('Get /me error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// Get user statistics
// ========================================
router.get('/stats', authenticate, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) return res.status(401).json({ error: 'Invalid token payload' });

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: 'User not found' });

    return res.json({
      success: true,
      stats: {
        totalWagered: user.totalWagered || 0,
        totalWon: user.totalWon || 0,
        totalProfitLoss: user.totalProfitLoss || 0,
        winRate: user.winRate || 0,
        gamesPlayed: user.gamesPlayed || 0,
        gamesWon: user.gamesWon || 0,
        longestWinStreak: user.longestWinStreak || 0,
        currentWinStreak: user.currentWinStreak || 0,
        longestLossStreak: user.longestLossStreak || 0,
        currentLossStreak: user.currentLossStreak || 0,
        stats: user.stats || { crash: { played: 0, won: 0 }, slots: { played: 0, won: 0 }, coinflip: { played: 0, won: 0 } }
      }
    });
  } catch (err) {
    console.error('Get /stats error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// Get gambling limits for current user
// ========================================
router.get('/limits', authenticate, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) return res.status(401).json({ error: 'Invalid token payload' });

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Reset daily loss if it's a new day
    if (user.dailyLossDate !== today) {
      user.dailyLoss = 0;
      user.dailyLossDate = today;
      await user.save();
    }

    const limits = {
      maxBet: user.gamblingLimits?.maxBet || null,
      dailyLossLimit: user.gamblingLimits?.dailyLossLimit || null,
      dailyLoss: user.dailyLoss || 0,
      selfExclusion: {
        enabled: user.gamblingLimits?.selfExclusion?.enabled || false,
        until: user.gamblingLimits?.selfExclusion?.until || null,
        reason: user.gamblingLimits?.selfExclusion?.reason || '',
      },
    };

    // Check if self-exclusion is active
    if (limits.selfExclusion.enabled && limits.selfExclusion.until) {
      const until = new Date(limits.selfExclusion.until);
      if (until > now) {
        limits.selfExclusion.active = true;
        limits.selfExclusion.remaining = Math.ceil((until - now) / (1000 * 60 * 60)); // hours remaining
      } else {
        // Auto-disable expired exclusion
        user.gamblingLimits.selfExclusion.enabled = false;
        user.gamblingLimits.selfExclusion.until = null;
        await user.save();
        limits.selfExclusion.active = false;
        limits.selfExclusion.remaining = 0;
      }
    } else {
      limits.selfExclusion.active = false;
      limits.selfExclusion.remaining = 0;
    }

    return res.json({ success: true, limits });
  } catch (err) {
    console.error('Get /limits error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// Update gambling limits
// ========================================
router.put('/limits', authenticate, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) return res.status(401).json({ error: 'Invalid token payload' });

    const { maxBet, dailyLossLimit, selfExclusion } = req.body;

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Initialize gamblingLimits if not exists
    if (!user.gamblingLimits) {
      user.gamblingLimits = { maxBet: null, dailyLossLimit: null, selfExclusion: { enabled: false, until: null, reason: '' } };
    }

    // Update per-bet limit
    if (maxBet !== undefined) {
      if (maxBet === null || maxBet === '') {
        user.gamblingLimits.maxBet = null;
      } else {
        const numMaxBet = parseFloat(maxBet);
        if (isNaN(numMaxBet) || numMaxBet < 0) {
          return res.status(400).json({ error: 'maxBet must be a positive number' });
        }
        user.gamblingLimits.maxBet = numMaxBet;
      }
    }

    // Update daily loss limit
    if (dailyLossLimit !== undefined) {
      if (dailyLossLimit === null || dailyLossLimit === '') {
        user.gamblingLimits.dailyLossLimit = null;
      } else {
        const numDailyLossLimit = parseFloat(dailyLossLimit);
        if (isNaN(numDailyLossLimit) || numDailyLossLimit < 0) {
          return res.status(400).json({ error: 'dailyLossLimit must be a positive number' });
        }
        user.gamblingLimits.dailyLossLimit = numDailyLossLimit;
      }
    }

    // Update self-exclusion
    if (selfExclusion !== undefined) {
      const { enabled, hours, reason } = selfExclusion;
      if (enabled) {
        const hoursNum = parseInt(hours) || 24;
        const until = new Date();
        until.setHours(until.getHours() + hoursNum);
        user.gamblingLimits.selfExclusion = {
          enabled: true,
          until: until,
          reason: reason || 'Self-exclusion requested',
        };
      } else {
        user.gamblingLimits.selfExclusion = {
          enabled: false,
          until: null,
          reason: '',
        };
      }
    }

    await user.save();

    return res.json({
      success: true,
      limits: {
        maxBet: user.gamblingLimits.maxBet,
        dailyLossLimit: user.gamblingLimits.dailyLossLimit,
        selfExclusion: user.gamblingLimits.selfExclusion,
      }
    });
  } catch (err) {
    console.error('PUT /limits error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// Check if betting is allowed (middleware/helper)
// ========================================
router.get('/can-bet', authenticate, async (req, res) => {
  try {
    const walletAddress = req.user?.walletAddress;
    if (!walletAddress) return res.status(401).json({ error: 'Invalid token payload' });

    const { amount, gameType } = req.query;
    const betAmount = parseFloat(amount) || 0;

    const user = await User.findOne({ walletAddress });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Reset daily loss if it's a new day
    if (user.dailyLossDate !== today) {
      user.dailyLoss = 0;
      user.dailyLossDate = today;
      await user.save();
    }

    const checks = {
      allowed: true,
      reasons: [],
    };

    // Check self-exclusion
    if (user.gamblingLimits?.selfExclusion?.enabled) {
      const until = new Date(user.gamblingLimits.selfExclusion.until);
      if (until > now) {
        checks.allowed = false;
        checks.reasons.push('Self-exclusion is active');
        const remaining = Math.ceil((until - now) / (1000 * 60 * 60));
        checks.selfExclusionRemaining = remaining;
      }
    }

    // Check per-bet limit
    if (checks.allowed && user.gamblingLimits?.maxBet !== null && user.gamblingLimits?.maxBet !== undefined) {
      if (betAmount > user.gamblingLimits.maxBet) {
        checks.allowed = false;
        checks.reasons.push(`Bet exceeds max limit of ${user.gamblingLimits.maxBet} SOL`);
        checks.maxBet = user.gamblingLimits.maxBet;
      }
    }

    // Check daily loss limit
    if (checks.allowed && user.gamblingLimits?.dailyLossLimit !== null && user.gamblingLimits?.dailyLossLimit !== undefined) {
      const currentDailyLoss = user.dailyLoss || 0;
      if (currentDailyLoss + betAmount > user.gamblingLimits.dailyLossLimit) {
        checks.allowed = false;
        checks.reasons.push(`Daily loss limit of ${user.gamblingLimits.dailyLossLimit} SOL would be exceeded`);
        checks.dailyLoss = currentDailyLoss;
        checks.dailyLossLimit = user.gamblingLimits.dailyLossLimit;
      }
    }

    return res.json({ success: true, ...checks });
  } catch (err) {
    console.error('GET /can-bet error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;












