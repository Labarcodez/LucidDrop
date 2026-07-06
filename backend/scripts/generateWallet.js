const { Keypair } = require('@solana/web3.js');
const fs = require('fs');

// Generate a new keypair
const keypair = Keypair.generate();

// Get public key as string
const publicKey = keypair.publicKey.toString();

// Get private key as base64 (standard format for .env)
const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');

// Also save as JSON file for backup
fs.writeFileSync('casino-wallet.json', JSON.stringify(Array.from(keypair.secretKey)));

console.log('✅ New casino wallet generated!');
console.log('📌 Public Key:', publicKey);
console.log('🔑 Private Key (base64):', privateKeyBase64);
console.log('📁 Private key also saved to casino-wallet.json');
console.log('\nAdd these to your .env file:');
console.log(`CASINO_WALLET_PUBLIC_KEY=${publicKey}`);
console.log(`CASINO_WALLET_PRIVATE_KEY=${privateKeyBase64}`);