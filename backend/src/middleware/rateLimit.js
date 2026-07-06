const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

// In-memory store for per-wallet rate limits (resets on server restart)
const walletRequestCounts = new Map();

// Allow skipping rate limits for local development/testing
const skipRateLimit = process.env.SKIP_RATE_LIMIT === 'true' || process.env.NODE_ENV === 'development';

if (skipRateLimit) {
  // No-op middleware for development to avoid accidental blocking during tests
  const noop = (req, res, next) => next();
  exports.limiter = noop;
  exports.betLimiter = noop;
  exports.walletLimiter = noop;
  exports.getWalletLimitStatus = () => ({ enabled: false });
} else {
  // Per-IP limiter for general requests
  exports.limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`⚠️ Rate limit exceeded for IP ${req.ip}`);
      res.status(429).json({ error: 'Too many requests, please try again later.' });
    },
  });

  // Per-IP limiter for betting endpoints
  exports.betLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 bets per minute
    message: { error: 'Slow down, gambler! 10 bets per minute max.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`⚠️ Bet rate limit exceeded for IP ${req.ip}`);
      res.status(429).json({ error: 'Slow down, gambler! 10 bets per minute max.' });
    },
  });

  // Per-wallet limiter — track bets by wallet address
  const walletLimiter = async (req, res, next) => {
    const walletAddress = req.user?.walletAddress || req.body?.walletAddress;
    
    if (!walletAddress) {
      // Fallback to IP-based limiting if no wallet address
      return next();
    }

    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxBets = 10; // 10 bets per minute per wallet

    // Get or create wallet entry
    if (!walletRequestCounts.has(walletAddress)) {
      walletRequestCounts.set(walletAddress, []);
    }

    const timestamps = walletRequestCounts.get(walletAddress);
    
    // Remove timestamps older than the window
    while (timestamps.length > 0 && timestamps[0] < now - windowMs) {
      timestamps.shift();
    }

    if (timestamps.length >= maxBets) {
      // Calculate retry-after time
      const oldestTimestamp = timestamps[0];
      const retryAfter = Math.ceil((oldestTimestamp + windowMs - now) / 1000);
      logger.warn(`⚠️ Wallet rate limit exceeded for ${walletAddress} (${timestamps.length} bets in window)`);
      
      return res.status(429).json({
        error: `Slow down, gambler! ${maxBets} bets per minute max. Retry after ${retryAfter}s.`,
        retryAfter,
      });
    }

    // Add current timestamp
    timestamps.push(now);
    
    // Clean up old entries periodically (every 100 requests)
    if (Math.random() < 0.01) {
      for (const [key, value] of walletRequestCounts) {
        const cutoff = now - 10 * windowMs;
        const filtered = value.filter(t => t > cutoff);
        if (filtered.length === 0) {
          walletRequestCounts.delete(key);
        } else {
          walletRequestCounts.set(key, filtered);
        }
      }
    }

    next();
  };

  exports.walletLimiter = walletLimiter;

  // Get current limit status for a wallet
  exports.getWalletLimitStatus = (walletAddress) => {
    if (!walletAddress || !walletRequestCounts.has(walletAddress)) {
      return { count: 0, max: 10, remaining: 10 };
    }
    const now = Date.now();
    const windowMs = 60 * 1000;
    const timestamps = walletRequestCounts.get(walletAddress);
    const active = timestamps.filter(t => t > now - windowMs);
    return {
      count: active.length,
      max: 10,
      remaining: Math.max(0, 10 - active.length),
    };
  };
}