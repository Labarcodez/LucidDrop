const express = require('express');
const router = express.Router();
const { verifyWalletSignature, generateToken } = require('../middleware/auth');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * GET /api/auth/challenge
 * Generate a challenge message for wallet authentication
 * Query param: walletAddress
 */
router.get('/challenge', async (req, res) => {
  const { walletAddress } = req.query;
  
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }
  
  // Generate a unique challenge with timestamp
  const timestamp = Date.now();
  const nonce = Math.floor(Math.random() * 1000000);
  const message = `Sign in to LUCID.drop at ${new Date(timestamp).toISOString()}\nNonce: ${nonce}\nWallet: ${walletAddress}`;
  
  // Store challenge temporarily (in memory for now, could use Redis for production)
  // In production, consider storing in a session or Redis with TTL
  if (!global.challenges) global.challenges = {};
  global.challenges[walletAddress] = { message, timestamp: Date.now() };
  
  res.json({ message });
});

/**
 * POST /api/auth/login
 * Authenticate a wallet via signature verification
 * Body: { walletAddress, signature, message }
 */
router.post('/login', async (req, res) => {
  const { walletAddress, signature, message } = req.body;

  // Validate input
  if (!walletAddress) {
    return res.status(400).json({ error: 'Wallet address is required' });
  }
  if (!signature) {
    return res.status(400).json({ error: 'Signature is required' });
  }
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    // Verify the signature
    const isValid = verifyWalletSignature(message, signature, walletAddress);
    if (!isValid) {
      logger.warn(`Invalid signature attempt for wallet: ${walletAddress}`);
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Find or create user
    let user = await User.findOne({ walletAddress });
    if (!user) {
      user = new User({ walletAddress, balance: 0 });
      await user.save();
      logger.info(`New user created: ${walletAddress}`);
    }

    user.lastActive = new Date();
    await user.save();

    // Generate JWT token
    const token = generateToken(walletAddress);

    // Clear challenge
    if (global.challenges && global.challenges[walletAddress]) {
      delete global.challenges[walletAddress];
    }

    logger.info(`User authenticated: ${walletAddress}`);
    res.json({
      success: true,
      token,
      walletAddress,
      balance: user.balance,
    });
  } catch (error) {
    logger.error(`Error authenticating user: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/validate
 * Validate a JWT token
 * Header: Authorization: Bearer <token>
 */
router.get('/validate', async (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ valid: false, error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ walletAddress: decoded.walletAddress });
    
    if (!user) {
      return res.status(401).json({ valid: false, error: 'User not found' });
    }

    res.json({
      valid: true,
      walletAddress: decoded.walletAddress,
      balance: user.balance,
    });
  } catch (error) {
    res.status(401).json({ valid: false, error: 'Invalid token' });
  }
});

module.exports = router;
