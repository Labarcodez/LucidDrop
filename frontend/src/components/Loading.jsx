import React from 'react';

export const Loading = () => (
  <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#00ff88]/20 border-t-[#00ff88] rounded-full animate-spin mx-auto" />
      <p className="text-gray-400 mt-4">Loading LucidDrop...</p>
    </div>
  </div>
);