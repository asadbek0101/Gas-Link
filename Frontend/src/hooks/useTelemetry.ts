import { useState, useEffect, useRef, useCallback } from "react";

const getWsUrl = () => {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/telemetry`;
};

const MAX_HISTORY = 50;

export interface DeviceTelemetry {
  deviceId: number;
  flow: number;
  pressure: number;
  lat: number;
  lon: number;
  time: string;
  temperature: number;
}

interface TelemetryMessage {
  type: string;
  data: DeviceTelemetry;
}

export function useTelemetry() {
  const [messages, setMessages] = useState<DeviceTelemetry[]>([]);
  const [deviceMap, setDeviceMap] = useState<Record<number, DeviceTelemetry>>({});
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(getWsUrl());

    ws.onopen = () => setConnected(true);
    ws.onmessage = (event) => {
      try {
        const msg: TelemetryMessage = JSON.parse(event.data);
        if (msg.type === "device_telemetry" && msg.data) {
          const d = msg.data;
          setDeviceMap(prev => ({ ...prev, [d.deviceId]: d }));
          setMessages(prev => [d, ...prev].slice(0, MAX_HISTORY));
        }
      } catch (e) { console.error("Telemetry WS parse error:", e); }
    };
    ws.onclose = () => {
      setConnected(false);
      reconnectTimer.current = setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { messages, devices: Object.values(deviceMap), connected };
}
