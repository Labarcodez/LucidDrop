import axios from 'axios';
import { withErrorHandling } from '../utils/errorHandler';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Helper to create an error-handled API call
const apiCall = (method, url, data) => {
  const call = () => axios({ method, url, data });
  return withErrorHandling(call);
};

export const api = {
  // Users
  getUser: (wallet) => axios.get(`${API_URL}/users/${wallet}`),
  updateBalance: (wallet, balance) => 
    axios.post(`${API_URL}/users/${wallet}/balance`, { balance }),
  
  // Withdraw
  withdraw: (walletAddress, amount, token) => 
    axios.post(`${API_URL}/withdraw`, { walletAddress, amount }, { headers: { Authorization: `Bearer ${token}` } }),
  
  // Bets
  placeBet: (betData) => axios.post(`${API_URL}/bets`, betData),
  getHistory: (wallet) => axios.get(`${API_URL}/bets/${wallet}`),
  getLeaderboard: () => axios.get(`${API_URL}/bets/leaderboard/top`),
  
  // Games
  crashResult: (betAmount, autoCashout, clientSeed) => 
    axios.post(`${API_URL}/games/crash/result`, { betAmount, autoCashout, clientSeed }),
  slotsResult: (walletAddress, betAmount) => 
    axios.post(`${API_URL}/games/slots/result`, { walletAddress, betAmount }),
  cashout: (walletAddress, betAmount, multiplier) =>
    axios.post(`${API_URL}/games/crash/cashout`, { walletAddress, betAmount, multiplier }),
  coinFlipResult: (walletAddress, betAmount, choice) =>
    axios.post(`${API_URL}/games/coinflip/result`, { walletAddress, betAmount, choice }),
  
  // Jackpot
  getJackpot: () => axios.get(`${API_URL}/games/jackpot`),
  
  // Bonus
  getBonusStatus: () => axios.get(`${API_URL}/games/bonus/status`),
  
  // Verification
  verifyBet: (betId) => axios.get(`${API_URL}/games/verify/${betId}`),
  
  // Transactions
  getTransactions: (wallet, page, limit, type) => 
    axios.get(`${API_URL}/transactions/${wallet}`, { params: { page, limit, type } }),
  
  // Authentication
  getChallenge: (walletAddress) => axios.get(`${API_URL}/auth/challenge`, { params: { walletAddress } }),
  login: (walletAddress, signature, message) => 
    axios.post(`${API_URL}/auth/login`, { walletAddress, signature, message }),
  validateToken: (token) => 
    axios.get(`${API_URL}/auth/validate`, { headers: { Authorization: `Bearer ${token}` } }),
};