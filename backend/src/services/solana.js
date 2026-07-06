const { Connection, PublicKey, LAMPORTS_PER_SOL } = require('@solana/web3.js');

const connection = new Connection(process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com');

exports.getBalance = async (walletAddress) => {
  try {
    const pubkey = new PublicKey(walletAddress);
    const balance = await connection.getBalance(pubkey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Solana balance error:', error);
    return 0;
  }
};

exports.validateWallet = (walletAddress) => {
  try {
    new PublicKey(walletAddress);
    return true;
  } catch {
    return false;
  }
};