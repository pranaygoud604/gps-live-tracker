import { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { createSocket, disconnectSocket } from '@/services/socket';
import { SocketStatus, ConnectionQuality } from '@/types';
import { getConnectionQuality } from '@/lib/utils';

interface UseSocketOptions {
  token: string | null;
  role: 'driver' | 'admin';
  enabled?: boolean;
}

interface UseSocketReturn {
  socket: Socket | null;
  status: SocketStatus;
  connectionQuality: ConnectionQuality;
  emit: <T>(event: string, data?: T) => void;
}

export function useSocket({ token, role, enabled = true }: UseSocketOptions): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pingStartRef = useRef<number>(0);

  const [status, setStatus] = useState<SocketStatus>({
    isConnected: false,
    isConnecting: false,
    latency: null,
    transport: null,
    reconnectAttempts: 0,
  });

  const connectionQuality = getConnectionQuality(status.latency);

  const startPingInterval = useCallback((sock: Socket) => {
    if (pingTimerRef.current) clearInterval(pingTimerRef.current);
    pingTimerRef.current = setInterval(() => {
      pingStartRef.current = Date.now();
      sock.emit('heartbeat', { timestamp: pingStartRef.current });
    }, 10000);
  }, []);

  useEffect(() => {
    if (!token || !enabled) return;

    setStatus((s) => ({ ...s, isConnecting: true }));
    const sock = createSocket(token, role);
    socketRef.current = sock;

    sock.on('connect', () => {
      setStatus({
        isConnected: true,
        isConnecting: false,
        latency: null,
        transport: sock.io.engine.transport.name,
        reconnectAttempts: 0,
      });
      startPingInterval(sock);
    });

    sock.on('disconnect', (reason) => {
      setStatus((s) => ({
        ...s,
        isConnected: false,
        isConnecting: reason !== 'io client disconnect',
        transport: null,
      }));
      if (pingTimerRef.current) {
        clearInterval(pingTimerRef.current);
        pingTimerRef.current = null;
      }
    });

    sock.on('connect_error', () => {
      setStatus((s) => ({
        ...s,
        isConnecting: true,
        isConnected: false,
        reconnectAttempts: s.reconnectAttempts + 1,
      }));
    });

    sock.on('heartbeat_ack', () => {
      const latency = Date.now() - pingStartRef.current;
      setStatus((s) => ({ ...s, latency }));
    });

    sock.io.on('reconnect_attempt', (attempt: number) => {
      setStatus((s) => ({ ...s, reconnectAttempts: attempt, isConnecting: true }));
    });

    return () => {
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      disconnectSocket();
      socketRef.current = null;
    };
  }, [token, role, enabled, startPingInterval]);

  const emit = useCallback(<T>(event: string, data?: T) => {
    socketRef.current?.emit(event, data);
  }, []);

  return { socket: socketRef.current, status, connectionQuality, emit };
}
