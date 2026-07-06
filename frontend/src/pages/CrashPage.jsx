import React from 'react';
import { DegenCrash } from '../components/DegenCrash';
import { AirdropCounter } from '../components/AirdropCounter';
import { LiveFeed } from '../components/LiveFeed';
import { Leaderboard } from '../components/Leaderboard';
import { LiveBetting } from '../components/LiveBetting'; // NEW

export const CrashPage = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2 space-y-6">
      <AirdropCounter />
      <DegenCrash />
    </div>
    <div className="space-y-6">
      <Leaderboard />
      <LiveBetting />   {/* ADDED */}
      <LiveFeed />
    </div>
  </div>
);