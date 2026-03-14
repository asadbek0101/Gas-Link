import { motion } from "framer-motion";
import { Loader2, Wifi, WifiOff, Thermometer, Gauge, Droplets, Radio } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { useTracking } from "../hooks/useTracking";
import { useTelemetry } from "../hooks/useTelemetry";
import { LeafletMap } from "../components/LeafletMap";

export function MapPage() {
  const { t } = useTranslation();
  const { vehicles, connected } = useTracking();
  const { devices: telDevices, connected: telConnected, messages } = useTelemetry();

  // Map tracker status → map status
  const mapVehicles = vehicles.map((v) => ({
    id: v.id,
    name: v.plate,
    lat: v.lat,
    lng: v.lng,
    status: (
      v.status === "active"  ? "moving"  :
      v.status === "stopped" ? "idle"    :
                               "stopped"   // offline → red stopped marker
    ) as "moving" | "idle" | "stopped",
    connectionStatus: v.status as "active" | "stopped" | "offline",
    speed:  v.speed,
    driver: v.driver_name || t("noDriver"),
    heading: v.heading,
    lastSeenSeconds: v.last_seen_seconds,
  }));

  const activeCount  = vehicles.filter(v => v.status === "active").length;
  const stoppedCount = vehicles.filter(v => v.status === "stopped").length;
  const offlineCount = vehicles.filter(v => v.status === "offline").length;

  const latest = messages[0];

  const formatLastSeen = (seconds: number) => {
    if (seconds < 60)  return `${seconds}s oldin`;
    if (seconds < 3600) return `${Math.floor(seconds/60)}daq oldin`;
    return `${Math.floor(seconds/3600)}soat oldin`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-8rem)] w-full flex flex-col gap-3">

      {/* ── Top bar ── */}
      <div className="flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t("onlineMonitoring")}</h1>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? "LIVE" : "Offline"}
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${telConnected ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500"}`}>
            <Radio size={12} />
            MQTT {telConnected ? "aktiv" : "ulanmagan"}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Harakatda: {activeCount}
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 text-sm">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            To'xtagan: {stoppedCount}
          </div>
          <div className="flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-gray-200 text-sm">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            Aloqa yo'q: {offlineCount}
          </div>
        </div>
      </div>

      {/* ── MQTT Telemetry bar ── */}
      {(telDevices.length > 0 || latest) && (
        <div className="flex-shrink-0 space-y-2">
          {telDevices.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {telDevices.map((d) => (
                <div key={d.deviceId} className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-4 shadow-sm">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-xs font-semibold text-gray-600">Device #{d.deviceId}</span>
                  </div>
                  <div className="flex gap-3 text-xs">
                    <span className="flex items-center gap-1 text-blue-600 font-medium"><Droplets size={12} />{d.flow.toFixed(1)} m³/h</span>
                    <span className="flex items-center gap-1 text-orange-600 font-medium"><Gauge size={12} />{d.pressure.toFixed(1)} bar</span>
                    <span className="flex items-center gap-1 text-red-500 font-medium"><Thermometer size={12} />{d.temperature.toFixed(1)}°C</span>
                  </div>
                </div>
              ))}
            </div>
          )}
          {latest && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-lg px-4 py-2 flex items-center gap-3 text-xs text-gray-600 overflow-x-auto">
              <span className="font-semibold text-purple-700 flex-shrink-0">↳ Oxirgi MQTT:</span>
              <span className="flex-shrink-0">Device <strong>#{latest.deviceId}</strong></span>
              <span className="text-blue-600 flex-shrink-0">Flow: <strong>{latest.flow.toFixed(2)}</strong> m³/h</span>
              <span className="text-orange-600 flex-shrink-0">Pressure: <strong>{latest.pressure.toFixed(2)}</strong> bar</span>
              <span className="text-red-500 flex-shrink-0">Temp: <strong>{latest.temperature.toFixed(1)}</strong>°C</span>
              <span className="text-gray-500 flex-shrink-0">{new Date(latest.time).toLocaleTimeString("uz-UZ")}</span>
            </div>
          )}
        </div>
      )}

      {/* ── Map ── */}
      <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
        {vehicles.length === 0 && !connected ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
            <Loader2 className="animate-spin" size={32} />
            <span className="text-sm">Tracker serverga ulanilmoqda...</span>
          </div>
        ) : (
          <LeafletMap
            vehicles={mapVehicles}
            center={[41.2858, 69.2042]}
            zoom={13}
            showRoutePlanner={true}
          />
        )}

        {/* Offline warning banner */}
        {connected && offlineCount > 0 && offlineCount === vehicles.length && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[400] bg-gray-800 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse" />
            Barcha qurilmalar bilan aloqa yo'q
          </div>
        )}
      </div>

      {/* ── Vehicle status list (mini) ── */}
      {vehicles.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 flex-shrink-0">
          {vehicles.map(v => (
            <div
              key={v.id}
              className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                v.status === "active"  ? "bg-green-50 border-green-200 text-green-700" :
                v.status === "stopped" ? "bg-amber-50 border-amber-200 text-amber-700" :
                                         "bg-gray-50 border-gray-200 text-gray-500"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                v.status === "active"  ? "bg-green-500 animate-pulse" :
                v.status === "stopped" ? "bg-amber-400" :
                                         "bg-gray-400"
              }`} />
              <span>{v.plate}</span>
              <span className="opacity-60">
                {v.status === "active"  ? `${v.speed} km/s` :
                 v.status === "stopped" ? `${formatLastSeen(v.last_seen_seconds)}` :
                                          "aloqa yo'q"}
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
