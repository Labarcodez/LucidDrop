import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useWallet } from '@solana/wallet-adapter-react';

const emojis = ['🔥', '🚀', '💎', '🎰', '💰', '🤑', '😱', '🎉', '👑', '⚡'];

const getSocketUrl = () => {
  if (process.env.REACT_APP_WS_URL) {
    return process.env.REACT_APP_WS_URL.replace(/^ws/, 'http');
  }
  const api = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  return api.replace(/\/api\/?$/, '');
};

export const LiveChat = () => {
  const wallet = useWallet();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [reactions, setReactions] = useState([]);
  const chatEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(getSocketUrl(), { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('chat:history', (history) => {
      setMessages(history.map((m) => formatMessage(m)));
    });

    socket.on('chat:message', (msg) => {
      setMessages((prev) => [formatMessage(msg), ...prev].slice(0, 50));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatMessage = (msg) => {
    if (msg.type === 'system') return `✨ ${msg.text}`;
    const prefix = msg.wallet ? `[${msg.wallet}]` : '';
    return `${prefix} ${msg.text}`.trim();
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || !socketRef.current?.connected) return;

    socketRef.current.emit('chat:message', {
      text,
      wallet: wallet.publicKey?.toString() || null,
    });
    setInput('');
  };

  const sendReaction = (emoji) => {
    if (!socketRef.current?.connected) return;
    socketRef.current.emit('chat:message', {
      text: emoji,
      wallet: wallet.publicKey?.toString() || null,
    });
    setReactions((prev) => [...prev, emoji].slice(-5));
    setTimeout(() => setReactions((prev) => prev.filter((r) => r !== emoji)), 3000);
  };

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-[#00ff88]/10 border border-[#00ff88]/40 text-[#00ff88] text-2xl neon-btn shadow-[0_0_30px_rgba(0,255,136,0.15)] hover:scale-105 transition-all duration-200 flex items-center justify-center relative"
      >
        {isOpen ? '✕' : '💬'}
        <span
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${connected ? 'bg-[#00ff88]' : 'bg-red-500'}`}
        />
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 glass-card neon-border-purple overflow-hidden animate-fade-in">
          <div className="p-3 border-b border-white/10 flex justify-between items-center bg-black/40">
            <span className="text-xs font-mono text-[#00ff88] tracking-widest font-bold">
              💬 LIVE CHAT
            </span>
            <span className="text-[10px] text-gray-500">
              {connected ? '🟢 live' : '🔴 offline'}
            </span>
          </div>

          <div className="max-h-60 overflow-y-auto p-3 space-y-1 bg-black/30">
            {[...messages].reverse().slice(-20).map((msg, i) => {
              const isEmoji = /^[\p{Emoji}\s]+$/u.test(msg.replace(/^\[[^\]]+\]\s*/, '').replace(/^✨\s*/, ''));
              return (
                <div
                  key={i}
                  className={`text-sm py-1.5 px-2 rounded-lg ${
                    isEmoji
                      ? 'text-center text-2xl'
                      : 'text-gray-300 border-b border-white/5 font-mono text-xs'
                  }`}
                >
                  {msg}
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-1 px-3 py-2 border-t border-white/10 bg-black/40 flex-wrap">
            {emojis.slice(0, 6).map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => sendReaction(e)}
                className="text-lg hover:scale-125 transition-transform min-h-[36px] min-w-[36px]"
              >
                {e}
              </button>
            ))}
          </div>

          <div className="flex gap-2 p-3 border-t border-white/10 bg-black/40">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={connected ? 'Say something...' : 'Connecting...'}
              disabled={!connected}
              maxLength={200}
              className="flex-1 px-3 py-2 bg-black/60 border border-white/10 rounded-xl text-white text-sm focus:border-[#00ff88]/50 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!connected || !input.trim()}
              className="px-4 py-2 neon-btn-green rounded-xl text-sm font-bold disabled:opacity-40"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
