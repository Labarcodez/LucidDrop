const { Connection, Keypair, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const bs58 = require('bs58');

/**
 * Transfer SOL from the casino wallet to a user's wallet
 * @param {number} amountInSol - Amount of SOL to transfer
 * @param {string} targetAddress - User's Solana wallet address
 * @returns {Promise<string>} Transaction signature
 */
async function transferToWallet(amountInSol, targetAddress) {
  // Validate inputs
  if (!amountInSol || amountInSol <= 0) {
    throw new Error('Invalid amount. Must be greater than 0.');
  }
  if (!targetAddress) {
    throw new Error('Target address is required.');
  }

  // Validate RPC endpoint
  const rpcUrl = process.env.SOLANA_RPC;
  if (!rpcUrl) {
    throw new Error('SOLANA_RPC environment variable is not set.');
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  const targetPubkey = new PublicKey(targetAddress);
  
  // Load actual casino wallet from environment
  const privateKeyBase58 = process.env.CASINO_PRIVATE_KEY;
  if (!privateKeyBase58) {
    throw new Error('CASINO_PRIVATE_KEY environment variable is not set.');
  }
  
  let casinoKeypair;
  try {
    const privateKeyBuffer = bs58.decode(privateKeyBase58);
    casinoKeypair = Keypair.fromSecretKey(privateKeyBuffer);
  } catch (error) {
    throw new Error('Invalid CASINO_PRIVATE_KEY. Must be a valid base58 encoded secret key.');
  }
  
  // Check balance before sending
  const balance = await connection.getBalance(casinoKeypair.publicKey);
  const requiredLamports = amountInSol * LAMPORTS_PER_SOL;
  if (balance < requiredLamports) {
    throw new Error(`Insufficient balance. Required: ${amountInSol} SOL, Available: ${balance / LAMPORTS_PER_SOL} SOL`);
  }
  
  // Get latest blockhash for transaction
  const { blockhash } = await connection.getLatestBlockhash('confirmed');
  const blockHeight = await connection.getBlockHeight();
  
  const transaction = new Transaction({
    feePayer: casinoKeypair.publicKey,
    blockhash,
    lastValidBlockHeight: blockHeight + 150,
  }).add(
    SystemProgram.transfer({
      fromPubkey: casinoKeypair.publicKey,
      toPubkey: targetPubkey,
      lamports: requiredLamports,
    })
  );
  
  // Send and confirm with retry logic
  let signature;
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      signature = await connection.sendTransaction(transaction, [casinoKeypair]);
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      if (confirmation.value.err) {
        throw new Error(`Transaction failed: ${confirmation.value.err.toString()}`);
      }
      return signature;
    } catch (error) {
      lastError = error;
      // Wait before retry with exponential backoff
      if (attempt < 2) {
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
      }
    }
  }
  
  throw new Error(`Failed to send transaction after 3 attempts: ${lastError?.message || 'Unknown error'}`);
}

module.exports = { transferToWallet };