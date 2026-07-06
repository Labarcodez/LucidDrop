import { useEffect, useRef, useState, useCallback } from 'react';

// Configuration constants
const MAX_RECONNECT_ATTEMPTS = 10;
const BASE_RECONNECT_DELAY = 1000; // 1 second
const MAX_RECONNECT_DELAY = 30000; // 30 seconds
const HEARTBEAT_INTERVAL = 15000; // 15 seconds
const HEARTBEAT_TIMEOUT = 5000; // 5 seconds
const MESSAGE_QUEUE_MAX = 100;

export const useWebSocket = () => {
  const [messages, setMessages] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connecting' | 'connected' | 'disconnected'
  const socketRef = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);
  const heartbeatInterval = useRef(null);
  const heartbeatTimeout = useRef(null);
  const messageQueue = useRef([]);
  const isReconnecting = useRef(false);

  const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:5000';

  // Calculate exponential backoff delay
  const getReconnectDelay = useCallback((attempt) => {
    const delay = Math.min(BASE_RECONNECT_DELAY * Math.pow(1.5, attempt), MAX_RECONNECT_DELAY);
    // Add jitter to prevent thundering herd
    return delay * (0.8 + Math.random() * 0.4);
  }, []);

  // Process queued messages
  const processQueue = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      let queued = messageQueue.current;
      messageQueue.current = [];
      for (const msg of queued) {
        try {
          socketRef.current.send(JSON.stringify(msg));
        } catch (e) {
          console.error('Failed to send queued message:', e);
        }
      }
    }
  }, []);

  // Send heartbeat
  const sendHeartbeat = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify({ type: 'ping' }));
      } catch (e) {
        console.error('Heartbeat send failed:', e);
      }
    }
  }, []);

  // Set up heartbeat
  const setupHeartbeat = useCallback(() => {
    // Clear existing intervals
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
    if (heartbeatTimeout.current) {
      clearTimeout(heartbeatTimeout.current);
      heartbeatTimeout.current = null;
    }

    heartbeatInterval.current = setInterval(() => {
      sendHeartbeat();
      // Set timeout for heartbeat response
      if (heartbeatTimeout.current) {
        clearTimeout(heartbeatTimeout.current);
      }
      heartbeatTimeout.current = setTimeout(() => {
        console.warn('Heartbeat timeout, reconnecting...');
        socketRef.current?.close();
      }, HEARTBEAT_TIMEOUT);
    }, HEARTBEAT_INTERVAL);
  }, [sendHeartbeat]);

  // Connect to WebSocket
  const connect = useCallback(() => {
    if (isReconnecting.current) return;
    isReconnecting.current = true;
    setConnectionStatus('connecting');

    try {
      socketRef.current = new WebSocket(wsUrl);

      socketRef.current.onopen = () => {
        console.log('🔗 WebSocket connected');
        setConnectionStatus('connected');
        isReconnecting.current = false;
        reconnectAttempts.current = 0;
        clearTimeout(reconnectTimeout.current);
        
        // Clear heartbeat timeout on successful connection
        if (heartbeatTimeout.current) {
          clearTimeout(heartbeatTimeout.current);
          heartbeatTimeout.current = null;
        }
        
        setupHeartbeat();
        processQueue();
      };

      socketRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // Handle heartbeat response
          if (data.type === 'pong') {
            if (heartbeatTimeout.current) {
              clearTimeout(heartbeatTimeout.current);
              heartbeatTimeout.current = null;
            }
            return;
          }
          
          setMessages(prev => [data, ...prev].slice(0, 50));
        } catch (e) {
          console.error('WebSocket parse error:', e);
        }
      };

      socketRef.current.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        setConnectionStatus('disconnected');
        isReconnecting.current = false;
        
        // Clear heartbeat
        if (heartbeatInterval.current) {
          clearInterval(heartbeatInterval.current);
          heartbeatInterval.current = null;
        }
        if (heartbeatTimeout.current) {
          clearTimeout(heartbeatTimeout.current);
          heartbeatTimeout.current = null;
        }

        // Attempt reconnect with exponential backoff
        if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = getReconnectDelay(reconnectAttempts.current);
          reconnectAttempts.current += 1;
          console.log(`🔄 Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts.current})`);
          
          clearTimeout(reconnectTimeout.current);
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          console.error('❌ Max reconnection attempts reached');
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Close the connection to trigger onclose and reconnection
        socketRef.current?.close();
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setConnectionStatus('disconnected');
      isReconnecting.current = false;
      
      // Attempt reconnect
      const delay = getReconnectDelay(reconnectAttempts.current);
      reconnectAttempts.current += 1;
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = setTimeout(() => {
        connect();
      }, delay);
    }
  }, [wsUrl, setupHeartbeat, processQueue, getReconnectDelay]);

  // Send message with queueing
  const send = useCallback((data) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      try {
        socketRef.current.send(JSON.stringify(data));
      } catch (e) {
        console.error('Failed to send message, queueing:', e);
        if (messageQueue.current.length < MESSAGE_QUEUE_MAX) {
          messageQueue.current.push(data);
        }
      }
    } else {
      // Queue message for later
      if (messageQueue.current.length < MESSAGE_QUEUE_MAX) {
        messageQueue.current.push(data);
      } else {
        console.warn('Message queue full, dropping message');
      }
    }
  }, []);

  // Manual reconnect
  const reconnect = useCallback(() => {
    clearTimeout(reconnectTimeout.current);
    reconnectAttempts.current = 0;
    isReconnecting.current = false;
    socketRef.current?.close();
    setTimeout(() => connect(), 100);
  }, [connect]);

  // Connect on mount, cleanup on unmount
  useEffect(() => {
    connect();

    return () => {
      clearTimeout(reconnectTimeout.current);
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      if (heartbeatTimeout.current) {
        clearTimeout(heartbeatTimeout.current);
      }
      socketRef.current?.close();
    };
  }, [connect]);

  return { 
    messages, 
    send, 
    connectionStatus,
    reconnect,
    isConnected: connectionStatus === 'connected',
  };
};