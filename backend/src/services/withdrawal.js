const { transferToWallet } = require('./solanaStealth');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const logger = require('../utils/logger');

/**
 * Process a withdrawal request with atomic balance operations
 * Implements two-phase commit pattern:
 *   Phase 1: Deduct balance (pending)
 *   Phase 2: Attempt blockchain transfer with retry
 *   Phase 3: Mark transaction completed or rollback balance
 * 
 * @param {string} walletAddress - User's wallet address
 * @param {number} amountInSol - Amount in SOL to withdraw
 * @returns {Promise<{txHash: string, newBalance: number}>}
 */
async function processWithdrawal(walletAddress, amountInSol) {
  // Validate inputs
  if (!walletAddress) {
    throw new Error('Wallet address is required');
  }
  if (!amountInSol || amountInSol <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  logger.info(`📤 Withdrawal initiated for ${walletAddress}: ${amountInSol} SOL`);

  // Phase 1: Atomic balance deduction (pending state)
  const user = await User.findOne({ walletAddress });
  if (!user) {
    throw new Error('User not found');
  }

  if (user.balance < amountInSol) {
    throw new Error(`Insufficient balance. Available: ${user.balance} SOL, Requested: ${amountInSol} SOL`);
  }

  // Create pending transaction record
  const transaction = new Transaction({
    walletAddress,
    type: 'withdraw',
    amount: amountInSol,
    status: 'pending',
    timestamp: new Date(),
  });
  await transaction.save();

  // Atomic balance deduction using findOneAndUpdate to prevent race conditions
  const updatedUser = await User.findOneAndUpdate(
    { 
      walletAddress: walletAddress,
      balance: { $gte: amountInSol }
    },
    {
      $inc: { balance: -amountInSol },
      $set: { lastActive: new Date() }
    },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    // Race condition: balance changed between check and update
    transaction.status = 'failed';
    transaction.metadata = { reason: 'Balance changed during withdrawal processing' };
    await transaction.save();
    throw new Error('Insufficient balance. Please try again.');
  }

  logger.info(`💰 Balance deducted for ${walletAddress}: ${amountInSol} SOL, new balance: ${updatedUser.balance}`);

  // Phase 2: Attempt blockchain transfer with retry logic
  let txHash = null;
  let lastError = null;
  const maxRetries = 3;
  const retryDelay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`🔄 Blockchain transfer attempt ${attempt}/${maxRetries} for ${walletAddress}`);
      txHash = await transferToWallet(amountInSol, walletAddress);
      logger.info(`✅ Blockchain transfer successful for ${walletAddress}: tx ${txHash}`);
      break;
    } catch (error) {
      lastError = error;
      logger.warn(`⚠️ Blockchain transfer attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        const delay = retryDelay * Math.pow(2, attempt - 1);
        logger.info(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Phase 3: Complete or rollback based on blockchain result
  if (txHash) {
    // Success: Mark transaction as completed
    transaction.txHash = txHash;
    transaction.status = 'completed';
    await transaction.save();

    logger.info(`✅ Withdrawal completed for ${walletAddress}: ${amountInSol} SOL, tx: ${txHash}`);

    return {
      txHash,
      newBalance: updatedUser.balance,
      transaction: transaction,
    };
  } else {
    // Failure: Rollback the balance
    logger.error(`❌ Blockchain transfer failed after ${maxRetries} attempts for ${walletAddress}: ${lastError?.message || 'Unknown error'}`);

    const rollbackUser = await User.findOneAndUpdate(
      { walletAddress: walletAddress },
      { $inc: { balance: amountInSol } },
      { new: true, runValidators: true }
    );

    if (rollbackUser) {
      logger.info(`🔁 Balance rolled back for ${walletAddress}: restored ${amountInSol} SOL, new balance: ${rollbackUser.balance}`);
    } else {
      // Critical: Manual intervention required
      logger.error(`🚨 CRITICAL: Balance rollback failed for ${walletAddress}! Manual intervention required.`);
    }

    transaction.status = 'failed';
    transaction.metadata = { 
      error: lastError?.message || 'Blockchain transfer failed',
      retries: maxRetries,
      rollbackAttempted: true
    };
    await transaction.save();

    // Re-throw the error with context
    const errorMessage = `Withdrawal failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`;
    logger.error(`❌ Withdrawal failed for ${walletAddress}: ${errorMessage}`);
    throw new Error(errorMessage);
  }
}

module.exports = { processWithdrawal };
