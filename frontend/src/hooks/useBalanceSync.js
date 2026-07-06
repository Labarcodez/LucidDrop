import { useEffect, useRef, useCallback } from 'react';
import { useCasinoStore } from '../store/useCasinoStore';
import { useWallet } from '@solana/wallet-adapter-react';
import { api } from '../services/api';

// Configuration
const SYNC_INTERVAL = 30000; // 30 seconds
const MIN_SYNC_INTERVAL = 5000; // 5 seconds

export const useBalanceSync = ({ enabled = true, interval = SYNC_INTERVAL } = {}) => {
  const { publicKey, setBalance, setLoading, setError } = useCasinoStore();
  const { connected } = useWallet();
  const intervalRef = useRef(null);
  const syncTimeoutRef = useRef(null);
  const lastSyncRef = useRef(0);
  const isSyncingRef = useRef(false);

  // Sync balance from backend
  const syncBalance = useCallback(async (force = false) => {
    // Prevent concurrent syncs
    if (isSyncingRef.current) return;
    
    // Rate limit if not forced
    if (!force) {
      const now = Date.now();
      if (now - lastSyncRef.current < MIN_SYNC_INTERVAL) {
        return;
      }
      lastSyncRef.current = now;
    }

    if (!publicKey || !connected) {
      return;
    }

    isSyncingRef.current = true;

    try {
      // Get fresh balance from backend (which fetches from blockchain)
      const token = localStorage.getItem('luciddrop_auth_token');
      const response = await api.get(`/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.data.success) {
        const newBalance = response.data.user?.balance;
        if (newBalance !== undefined) {
          setBalance(newBalance);
        }
      }
    } catch (error) {
      console.error('Balance sync failed:', error);
      // Don't set error state for background sync to avoid UI disruption
    } finally {
      isSyncingRef.current = false;
    }
  }, [publicKey, connected, setBalance]);

  // Force sync (exposed for manual triggers)
  const forceSync = useCallback(() => {
    if (publicKey && connected) {
      return syncBalance(true);
    }
    return Promise.resolve();
  }, [publicKey, connected, syncBalance]);

  // Set up periodic sync
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!enabled || !publicKey || !connected) {
      return;
    }

    // Initial sync
    syncBalance();

    // Set up periodic sync
    intervalRef.current = setInterval(() => {
      syncBalance();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
    };
  }, [enabled, publicKey, connected, interval, syncBalance]);

  // Sync after wallet connection changes
  useEffect(() => {
    if (connected && publicKey) {
      // Sync immediately on connection
      syncBalance(true);
    }
  }, [connected, publicKey, syncBalance]);

  return { syncBalance, forceSync };
};
