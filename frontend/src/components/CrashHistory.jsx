import React from 'react';

export const CrashHistory = ({ history }) => {
  const max = Math.max(...history.map(h => parseFloat(h)), 1);

  return (
    <div className="bg-[#0d0d14] rounded-xl border border-white/5 p-4">
      <div className="text-[10px] font-mono text-gray-500 tracking-widest mb-3 flex items-center gap-2">
        📊 CRASH HISTORY <span className="text-[8px] text-[#ff00cc]/40">LIVE</span>
      </div>
      <div className="flex items-end gap-1 h-12">
        {history.slice(0, 20).map((h, i) => {
          const val = parseFloat(h);
          const height = Math.max((val / max) * 100, 8);
          const isHigh = val > 5;
          const color = isHigh ? 'bg-[#ff00cc]' : val > 2 ? 'bg-[#ff8800]' : 'bg-[#00ff88]/40';
          return (
            <div
              key={i}
              className={`flex-1 rounded-sm transition-all duration-300 ${color}`}
              style={{ height: `${Math.min(height, 100)}%` }}
              title={`${h}`}
            />
          );
        })}
        {history.length === 0 && (
          <div className="text-xs text-gray-600 w-full text-center">Waiting for rounds...</div>
        )}
      </div>
    </div>
  );
};