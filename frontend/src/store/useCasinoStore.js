import { create } from 'zustand';
import { api } from '../services/api';

export const useCasinoStore = create((set, get) => ({
  balance: 0,
  bets: [],
  history: [],
  isConnected: false,
  publicKey: null,
  isLoading: false,
  error: null,

  setWallet: (publicKey) => set({ publicKey, isConnected: !!publicKey }),
  setBalance: (balance) => set({ balance }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Place a bet via backend API
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
        balance: betData.result === 'win' 
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

  // Fetch user data from backend
  fetchUserData: async (walletAddress) => {
    const { setLoading, setError } = get();
    setLoading(true);
    setError(null);

    try {
      const response = await api.getUser(walletAddress);
      set({ balance: response.data.balance });
      setLoading(false);
      return response.data;
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to fetch user data');
      setLoading(false);
      throw error;
    }
  },

  // Add a bet result from WebSocket
  addBetResult: (bet) => {
    set((state) => ({
      bets: [bet, ...state.bets].slice(0, 50),
      history: [bet, ...state.history].slice(0, 100),
      balance: bet.result === 'win' 
        ? state.balance + bet.profit 
        : state.balance - bet.amount,
    }));
    return bet;
  },

  reset: () => set({ balance: 0, bets: [], history: [], isConnected: false, publicKey: null, isLoading: false, error: null }),
}));