import { useEffect, useRef, useCallback } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '../services/api';

const SYNC_INTERVAL = 30000;
const MIN_SYNC_INTERVAL = 5000;

export const useBalanceSync = ({ enabled = true, interval = SYNC_INTERVAL } = {}) => {
  const isAuthenticated = useCasinoStore((state) => state.isAuthenticated);
  const setBalance = useCasinoStore((state) => state.setBalance);
  const { connected } = useWallet();
  const intervalRef = useRef(null);
  const lastSyncRef = useRef(0);
  const isSyncingRef = useRef(false);

  const syncBalance = useCallback(
    async (force = false) => {
      if (isSyncingRef.current || !isAuthenticated || !connected) return;

      if (!force) {
        const now = Date.now();
        if (now - lastSyncRef.current < MIN_SYNC_INTERVAL) return;
        lastSyncRef.current = now;
      }

      isSyncingRef.current = true;

      try {
        const response = await api.getMe();
        const user = response.data.user || response.data;
        if (user?.balance !== undefined) {
          setBalance(user.balance);
        }
      } catch (error) {
        console.error('Balance sync failed:', error);
      } finally {
        isSyncingRef.current = false;
      }
    },
    [isAuthenticated, connected, setBalance],
  );

  const forceSync = useCallback(() => {
    if (isAuthenticated && connected) {
      return syncBalance(true);
    }
    return Promise.resolve();
  }, [isAuthenticated, connected, syncBalance]);

  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!enabled || !isAuthenticated || !connected) return;

    syncBalance(true);
    intervalRef.current = setInterval(() => syncBalance(), interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, isAuthenticated, connected, interval, syncBalance]);

  return { syncBalance, forceSync };
};
