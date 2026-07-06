import React, { useState, useEffect } from 'react';
import { useConnection } from '@solana/wallet-adapter-react';
import { useWebSocket } from '../hooks/useWebSocket';

export const ConnectionStatus = () => {
  const { connection } = useConnection();
  const { connectionStatus, isConnected } = useWebSocket();
  const [rpcHealthy, setRpcHealthy] = useState(true);

  // Check RPC health
  useEffect(() => {
    const check = async () => {
      try {
        const slot = await connection.getSlot();
        setRpcHealthy(true);
      } catch {
        setRpcHealthy(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, [connection]);

  // Determine overall status
  const isHealthy = rpcHealthy && isConnected;
  const statusText = !rpcHealthy ? 'RPC Offline' : !isConnected ? 'WS Offline' : 'Online';

  return (
    <div className="flex items-center gap-1.5">
      <div 
        className={`w-2 h-2 rounded-full transition-colors duration-500 ${
          isHealthy ? 'bg-[#00ff88]' : 'bg-red-500'
        }`}
      />
      <span className="text-[10px] text-gray-500 font-mono">
        ● {statusText}
      </span>
    </div>
  );
};