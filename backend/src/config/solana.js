const { Connection } = require('@solana/web3.js');

/**
 * Shared Solana connection instance
 * Use this singleton to avoid duplicate connections across services
 */
const rpcUrl = process.env.SOLANA_RPC || 'https://api.mainnet-beta.solana.com';
const connection = new Connection(rpcUrl, 'confirmed');

module.exports = { connection, rpcUrl };
