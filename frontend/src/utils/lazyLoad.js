import { lazy } from 'react';

// Lazy load pages for faster initial load
export const LazySlotsPage = lazy(() => import('../pages/SlotsPage'));
export const LazyCrashPage = lazy(() => import('../pages/CrashPage'));
export const LazyCoinFlipPage = lazy(() => import('../pages/CoinFlipPage'));