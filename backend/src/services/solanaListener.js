const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

class SolanaListener {
  constructor() {
    this.connection = new Connection(process.env.SOLANA_RPC, 'confirmed');
    this.casinoPublicKey = new PublicKey(process.env.CASINO_WALLET_PUBLIC_KEY);
    this.subscriptionId = null;
  }

  async start() {
    this.subscriptionId = this.connection.onLogs(
      this.casinoPublicKey,
      async (logs, context) => {
        if (context.slot) {
          await this.processLogs(logs, context);
        }
      },
      'confirmed'
    );
    logger.info(`🔍 Listening for deposits to ${this.casinoPublicKey.toString()}`);
  }

  async processLogs(logs, context) {
    const tx = await this.connection.getParsedTransaction(logs.signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || !tx.meta) return;

    const transfer = this.findTransferToCasino(tx);
    if (transfer) {
      const { sender, amount } = transfer;
      await this.handleDeposit(sender, amount, logs.signature);
    }
  }

  findTransferToCasino(tx) {
    const instructions = tx.transaction.message.instructions;
    for (const instr of instructions) {
      if (instr.program === 'system' && instr.parsed?.type === 'transfer') {
        const info = instr.parsed.info;
        if (info.destination === this.casinoPublicKey.toString()) {
          return {
            sender: info.source,
            amount: info.lamports / LAMPORTS_PER_SOL,
          };
        }
      }
    }
    return null;
  }

  async handleDeposit(sender, amount, signature) {
    logger.info(`💰 Deposit detected: ${amount} SOL from ${sender} tx: ${signature}`);

    let user = await User.findOne({ walletAddress: sender });
    if (!user) {
      user = new User({ walletAddress: sender, balance: 0 });
      await user.save();
    }

    user.balance += amount;
    await user.save();

    const txRecord = new Transaction({
      walletAddress: sender,
      type: 'deposit',
      amount,
      txHash: signature,
      status: 'completed',
      timestamp: new Date(),
    });
    await txRecord.save();

    const io = require('../index').io;
    if (io) {
      io.to(sender).emit('deposit', { amount, txHash: signature });
    }

    logger.info(`✅ User ${sender} balance updated to ${user.balance} SOL`);
  }

  stop() {
    if (this.subscriptionId) {
      this.connection.removeOnLogsListener(this.subscriptionId);
      logger.info('🛑 Deposit listener stopped');
    }
  }
}

module.exports = SolanaListener;