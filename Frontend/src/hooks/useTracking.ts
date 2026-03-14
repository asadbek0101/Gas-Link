import { useState, useEffect, useRef, useCallback } from "react";

const getWsUrl = () => {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws/tracking`;
};

const NO_SIGNAL_TIMEOUT_MS = 10_000;

export interface TrackedVehicle {
  id: string;
  plate: string;
  status: string;
  driver_name: string | null;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  fuel: number;
  last_seen_seconds: number;
}

interface TrackingMessage {
  type: string;
  vehicles: TrackedVehicle[];
  time: string;
}

export function useTracking() {
  const [vehicles, setVehicles] = useState<TrackedVehicle[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const noSignalTimer = useRef<ReturnType<typeof setTimeout>>();

  const resetNoSignalTimer = useCallback(() => {
    clearTimeout(noSignalTimer.current);
    noSignalTimer.current = setTimeout(() => {
      setVehicles(prev => prev.map(v => ({ ...v, status: "offline", speed: 0 })));
    }, NO_SIGNAL_TIMEOUT_MS);
  }, []);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(getWsUrl());

    ws.onopen = () => { setConnected(true); resetNoSignalTimer(); };
    ws.onmessage = (event) => {
      try {
        const data: TrackingMessage = JSON.parse(event.data);
        if (data.type === "vehicle_positions" && data.vehicles) {
          setVehicles(data.vehicles);
          resetNoSignalTimer();
        }
      } catch (e) { console.error("WS parse error:", e); }
    };
    ws.onclose = () => {
      setConnected(false);
      clearTimeout(noSignalTimer.current);
      setVehicles(prev => prev.map(v => ({ ...v, status: "offline", speed: 0 })));
      reconnectTimer.current = setTimeout(connect, 3000);
    };
    ws.onerror = () => ws.close();
    wsRef.current = ws;
  }, [resetNoSignalTimer]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearTimeout(noSignalTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { vehicles, connected };
}
