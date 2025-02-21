import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

interface WebSocketContextType {
  sendMessage: (type: string, data: any) => void;
  lastMessage: any;
  connected: boolean;
}

const WebSocketContext = createContext<WebSocketContextType | null>(null);

export function useWebSocket() {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!token || reconnectAttempts.current >= maxReconnectAttempts) return;

    // Clean up existing connection
    if (ws.current) {
      ws.current.close();
    }

    // Connect to WebSocket server
    ws.current = new WebSocket('ws://localhost:5000/ws');

    ws.current.onopen = () => {
      console.log('WebSocket Connected');
      setConnected(true);
      reconnectAttempts.current = 0;

      // Send authentication message
      if (ws.current && token) {
        ws.current.send(JSON.stringify({
          type: 'auth',
          token
        }));
      }
    };

    ws.current.onclose = () => {
      console.log('WebSocket Disconnected');
      setConnected(false);

      // Attempt to reconnect
      if (reconnectAttempts.current < maxReconnectAttempts) {
        const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
        reconnectTimeout.current = setTimeout(() => {
          reconnectAttempts.current++;
          connect();
        }, timeout);
      }
    };

    ws.current.onerror = (error) => {
      console.error('WebSocket Error:', error);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        setLastMessage(message);

        switch (message.type) {
          case 'auth':
            if (message.status === 'success') {
              console.log('WebSocket authenticated successfully');
              reconnectAttempts.current = 0;
            } else {
              console.error('WebSocket authentication failed:', message.message);
              // Try to reauthenticate with current token
              if (ws.current && token) {
                ws.current.send(JSON.stringify({
                  type: 'auth',
                  token
                }));
              }
            }
            break;
          case 'error':
            console.error('WebSocket Error:', message.message);
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
  }, [token]);

  // Connect/reconnect when token changes
  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [connect]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    if (!connected) {
      console.error('WebSocket is not authenticated');
      return;
    }

    try {
      ws.current.send(JSON.stringify({ type, data }));
    } catch (error) {
      console.error('Error sending WebSocket message:', error);
    }
  }, [connected]);

  return (
    <WebSocketContext.Provider value={{ sendMessage, lastMessage, connected }}>
      {children}
    </WebSocketContext.Provider>
  );
}
