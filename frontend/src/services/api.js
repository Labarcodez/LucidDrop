import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
export const AUTH_TOKEN_KEY = 'luciddrop_auth_token';
export const AUTH_WALLET_KEY = 'luciddrop_auth_wallet';

const client = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getAuthToken = () => localStorage.getItem(AUTH_TOKEN_KEY);

export const api = {
  get: (url, config) => client.get(url, config),
  post: (url, data, config) => client.post(url, data, config),
  put: (url, data, config) => client.put(url, data, config),

  getMe: () => client.get('/users/me'),
  getUser: () => client.get('/users/me'),

  updateBalance: (wallet, balance) =>
    client.post(`/users/${wallet}/balance`, { balance }),

  withdraw: (walletAddress, amount) =>
    client.post('/withdraw', { walletAddress, amount }),

  placeBet: (betData) => client.post('/bets', betData),
  getHistory: (wallet) => client.get(`/bets/${wallet}`),
  getLeaderboard: () => client.get('/bets/leaderboard/top'),

  crashResult: (betAmount, autoCashout, clientSeed) =>
    client.post('/games/crash/result', { betAmount, autoCashout, clientSeed }),

  slotsResult: (betAmount, clientSeed) =>
    client.post('/games/slots/result', { betAmount, clientSeed }),

  cashout: (betAmount, multiplier) =>
    client.post('/games/crash/cashout', { betAmount, multiplier }),

  coinFlipResult: (betAmount, choice, clientSeed) =>
    client.post('/games/coinflip/result', { betAmount, choice, clientSeed }),

  getJackpot: () => client.get('/games/jackpot'),
  getBonusStatus: () => client.get('/games/bonus/status'),
  verifyBet: (betId) => client.get(`/games/verify/${betId}`),

  getTransactions: (wallet, page, limit, type) =>
    client.get(`/transactions/${wallet}`, { params: { page, limit, type } }),

  getChallenge: (walletAddress) =>
    client.get('/auth/challenge', { params: { walletAddress } }),

  login: (walletAddress, signature, message) =>
    client.post('/auth/login', { walletAddress, signature, message }),

  validateToken: (token) =>
    client.get('/auth/validate', {
      headers: { Authorization: `Bearer ${token}` },
    }),

  getDepositAddress: () => client.get('/deposit/address'),
};

export default api;
