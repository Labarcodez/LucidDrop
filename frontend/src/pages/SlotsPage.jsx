import React from 'react';
import { CasinoSlots } from '../components/CasinoSlots';
import { JackpotCounter } from '../components/JackpotCounter';
import { HotBonus } from '../components/HotBonus';

export const SlotsPage = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <div className="lg:col-span-2">
      <CasinoSlots />
    </div>
    <div className="space-y-6">
      <JackpotCounter value={42.7} />
      <HotBonus />
    </div>
  </div>
);