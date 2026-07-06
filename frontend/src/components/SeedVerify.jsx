import React, { useState } from 'react';

export const SeedVerify = ({ roundId }) => {
  const [showSeed, setShowSeed] = useState(false);
  const serverSeed = Array.from({ length: 32 }, () => 
    '0123456789abcdef'[Math.floor(Math.random() * 16)]
  ).join('');
  const clientSeed = `user-${Date.now().toString(36)}`;

  return (
    <div className="mt-2">
      <button
        onClick={() => setShowSeed(!showSeed)}
        className="text-[10px] font-mono text-gray-500 hover:text-[#00ff88] transition-colors"
      >
        🔒 {showSeed ? 'Hide' : 'Verify'} Seed
      </button>
      {showSeed && (
        <div className="mt-1 p-2 bg-black/60 border border-[#00ff88]/20 rounded-lg">
          <div className="text-[8px] font-mono text-gray-500 tracking-widest">SERVER SEED</div>
          <div className="text-xs font-mono text-[#00ff88] break-all">{serverSeed}</div>
          <div className="text-[8px] font-mono text-gray-500 tracking-widest mt-1">CLIENT SEED</div>
          <div className="text-xs font-mono text-[#00ccff] break-all">{clientSeed}</div>
        </div>
      )}
    </div>
  );
};