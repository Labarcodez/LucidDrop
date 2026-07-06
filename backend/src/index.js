require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const SolanaListener = require('./services/solanaListener');
const { limiter, betLimiter, walletLimiter } = require('./middleware/rateLimit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, { cors: { origin: '*' } });

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// Rate limiting
app.use('/api', limiter);
app.use('/api/games', betLimiter);
app.use('/api/games', walletLimiter);

// Database
mongoose.connect(process.env.MONGODB_URI)
  .then(() => logger.info('✅ MongoDB connected'))
  .catch(err => logger.error('❌ MongoDB error:', err));

// Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/bets', require('./routes/bets'));
app.use('/api/games', require('./routes/games'));
app.use('/api/health', require('./routes/health'));
app.use('/api/deposit', require('./routes/deposit'));
app.use('/api/withdraw', require('./routes/withdraw'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));

// In-memory chat history (last 50 messages)
const chatHistory = [
  { id: 'welcome', type: 'system', text: '🎰 Welcome to LUCID.drop — connect your wallet and play!', at: Date.now() },
];

// WebSocket (Socket.IO)
io.on('connection', (socket) => {
  logger.info(`🟢 Client connected: ${socket.id}`);

  socket.emit('chat:history', chatHistory.slice(-50));

  socket.on('join', (walletAddress) => {
    if (walletAddress && typeof walletAddress === 'string') {
      socket.join(walletAddress);
      logger.info(`📢 User ${walletAddress} joined room`);
    }
  });

  socket.on('chat:message', (payload) => {
    const text = typeof payload?.text === 'string' ? payload.text.trim() : '';
    if (!text || text.length > 200) return;

    const wallet = typeof payload?.wallet === 'string'
      ? `${payload.wallet.slice(0, 4)}...${payload.wallet.slice(-4)}`
      : 'anon';

    const message = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: 'user',
      wallet,
      text,
      at: Date.now(),
    };

    chatHistory.push(message);
    if (chatHistory.length > 50) chatHistory.shift();

    io.emit('chat:message', message);
  });

  socket.on('disconnect', () => {
    logger.info(`🔴 Client disconnected: ${socket.id}`);
  });
});

// Raw WebSocket support (for frontend that uses native WebSocket)
const WebSocket = require('ws');
const wss = new WebSocket.Server({ server, path: '/' });

wss.on('connection', (ws) => {
  logger.info('🟢 Raw WebSocket client connected');

  // Send initial state when client connects
  const initialData = {
    type: 'init',
    data: {
      status: 'connected',
      timestamp: new Date().toISOString(),
      message: 'Welcome to LucidDrop Casino!'
    }
  };
  ws.send(JSON.stringify(initialData));
  logger.info('📤 Sent initial data to client');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      logger.info('📩 Raw WebSocket message received:', data);
      if (data.type === 'ping') {
        logger.info('🏓 Sending pong response');
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (e) {
      logger.warn('⚠️ Invalid WebSocket message:', message.toString());
    }
  });

  ws.on('close', () => {
    logger.info('🔴 Raw WebSocket client disconnected');
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('❌ Error:', err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Backend running on port ${PORT}`);
});

// Start deposit listener (optional until Solana env is configured)
let listener = null;
if (process.env.SOLANA_RPC && process.env.CASINO_WALLET_PUBLIC_KEY) {
  try {
    listener = new SolanaListener();
    listener.start().catch((err) => logger.error('❌ Deposit listener error:', err));
  } catch (err) {
    logger.warn('⚠️ Deposit listener disabled:', err.message);
  }
} else {
  logger.warn('⚠️ Deposit listener disabled — set SOLANA_RPC and CASINO_WALLET_PUBLIC_KEY');
}

module.exports = { io, listener };