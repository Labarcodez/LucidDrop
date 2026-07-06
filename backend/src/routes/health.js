const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

router.get('/', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  const status = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbState === 1 ? 'connected' : 'disconnected',
    version: process.env.npm_package_version || '1.0.0',
  };
  res.json(status);
});

module.exports = router;