const express = require('express');
const router = express.Router();

// Return the casino wallet public key
router.get('/address', (req, res) => {
  const address = process.env.CASINO_WALLET_PUBLIC_KEY;
  if (!address) {
    return res.status(500).json({ error: 'Casino wallet not configured' });
  }
  res.json({ address });
});

module.exports = router;