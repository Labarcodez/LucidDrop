const jwt = require('jsonwebtoken');
const { PublicKey } = require('@solana/web3.js');
const nacl = require('tweetnacl');
const bs58 = require('bs58');

/**
 * Verify a wallet signature for authentication
 * @param {string} message - The message that was signed
 * @param {string} signature - Base58 encoded signature
 * @param {string} publicKey - Base58 encoded public key
 * @returns {boolean} True if signature is valid
 */
function verifyWalletSignature(message, signature, publicKey) {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = new PublicKey(publicKey).toBytes();
    return nacl.sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch {
    return false;
  }
}

/**
 * Generate a JWT token for an authenticated wallet
 * @param {string} walletAddress - The wallet address
 * @returns {string} JWT token
 */
function generateToken(walletAddress) {
  return jwt.sign(
    { walletAddress, timestamp: Date.now() },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Authentication middleware - verifies JWT token
 */
const authenticate = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = {
  authenticate,
  verifyWalletSignature,
  generateToken,
};