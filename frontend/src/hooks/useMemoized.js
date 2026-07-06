import { useMemo, useCallback } from 'react';

export const useMemoizedValue = (factory, deps) => {
  return useMemo(factory, deps);
};

export const useCallbackStable = (callback, deps) => {
  return useCallback(callback, deps);
};