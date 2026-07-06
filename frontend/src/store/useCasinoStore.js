import { create } from 'zustand';
import { api, AUTH_TOKEN_KEY, AUTH_WALLET_KEY } from '../services/api';

export const useCasinoStore = create((set, get) => ({
  balance: 0,
  bets: [],
  history: [],
  isConnected: false,
  isAuthenticated: false,
  publicKey: null,
  token: null,
  isLoading: false,
  error: null,

  setWallet: (publicKey) =>
    set({
      publicKey,
      isConnected: !!publicKey,
    }),

  setAuth: ({ token, walletAddress, balance, publicKey }) => {
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    if (walletAddress) localStorage.setItem(AUTH_WALLET_KEY, walletAddress);
    set({
      token: token || get().token,
      publicKey: publicKey ?? get().publicKey,
      balance: balance ?? get().balance,
      isConnected: true,
      isAuthenticated: true,
    });
  },

  setBalance: (balance) => set({ balance }),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  clearAuth: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_WALLET_KEY);
    set({
      balance: 0,
      bets: [],
      history: [],
      isConnected: false,
      isAuthenticated: false,
      publicKey: null,
      token: null,
      isLoading: false,
      error: null,
    });
  },

  addBet: (game, amount, multiplier) => {
    const profit = multiplier > 0 ? amount * multiplier - amount : -amount;
    const entry = {
      game,
      amount,
      multiplier,
      result: multiplier > 0 ? 'win' : 'loss',
      profit,
      timestamp: new Date().toISOString(),
    };
    set((state) => ({
      bets: [entry, ...state.bets].slice(0, 50),
      history: [entry, ...state.history].slice(0, 100),
    }));
    return entry;
  },

  placeBet: async (game, amount, multiplier, walletAddress) => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);

    try {
      const response = await api.placeBet({
        game,
        amount,
        multiplier,
        walletAddress,
      });

      const betData = response.data;
      set((state) => ({
        bets: [betData, ...state.bets].slice(0, 50),
        history: [betData, ...state.history].slice(0, 100),
        balance:
          betData.result === 'win'
            ? state.balance + betData.profit
            : state.balance - betData.amount,
      }));

      setLoading(false);
      return betData;
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to place bet');
      setLoading(false);
      throw error;
    }
  },

  fetchUserData: async () => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);

    try {
      const response = await api.getMe();
      const user = response.data.user || response.data;
      set({
        balance: user.balance ?? 0,
        isAuthenticated: true,
      });
      setLoading(false);
      return user;
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch user data');
      setLoading(false);
      throw error;
    }
  },

  addBetResult: (bet) => {
    set((state) => ({
      bets: [bet, ...state.bets].slice(0, 50),
      history: [bet, ...state.history].slice(0, 100),
      balance:
        bet.result === 'win'
          ? state.balance + bet.profit
          : state.balance - bet.amount,
    }));
    return bet;
  },

  reset: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_WALLET_KEY);
    set({
      balance: 0,
      bets: [],
      history: [],
      isConnected: false,
      isAuthenticated: false,
      publicKey: null,
      token: null,
      isLoading: false,
      error: null,
    });
  },
}));
