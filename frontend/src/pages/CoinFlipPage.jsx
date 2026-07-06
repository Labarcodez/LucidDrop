import React from 'react';
import { CoinFlip } from '../components/CoinFlip';
import { LiveChat } from '../components/LiveChat';

export const CoinFlipPage = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <CoinFlip />
    </div>
    <div className="space-y-6">
      <LiveChat />
    </div>
  </div>
);