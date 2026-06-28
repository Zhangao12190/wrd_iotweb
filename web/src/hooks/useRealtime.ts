import { useEffect, useRef, useState, useCallback } from 'react';

export interface TelemetryMessage {
  type: 'telemetry';
  deviceId: string;
  serial: string;
  deviceType: string;
  country: string;
  alarm: 'normal' | 'warning' | 'critical';
  ts: number;
  payload: Record<string, number>;
}

export interface StatusMessage {
  type: 'status';
  deviceId: string;
  status: 'online' | 'offline';
  alarm: string;
  last_seen: number;
}

export interface EventMessage {
  type: 'event';
  deviceId: string;
  ts: number;
  level: string;
  code: string;
  message: string;
}

type WsMessage = TelemetryMessage | StatusMessage | EventMessage | { type: 'hello' };

// Subscribe to the realtime websocket feed. The server already filters messages
// by the authenticated user's access scope, so the client just consumes them.
export function useRealtime(onMessage: (msg: WsMessage) => void) {
  const [connected, setConnected] = useState(false);
  const cbRef = useRef(onMessage);
  cbRef.current = onMessage;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const url = `${proto}://${location.host}/ws?token=${encodeURIComponent(token)}`;
    let ws: WebSocket | null = null;
    let retry: ReturnType<typeof setTimeout>;
    let closed = false;

    function connect() {
      ws = new WebSocket(url);
      ws.onopen = () => setConnected(true);
      ws.onclose = () => {
        setConnected(false);
        if (!closed) retry = setTimeout(connect, 3000);
      };
      ws.onerror = () => ws?.close();
      ws.onmessage = (ev) => {
        try {
          cbRef.current(JSON.parse(ev.data));
        } catch {
          /* ignore */
        }
      };
    }
    connect();

    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, []);

  return { connected };
}
