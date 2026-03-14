import { Filter, Maximize2, Wifi, WifiOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LeafletMap } from "./LeafletMap";
import { useTranslation } from "../lib/i18n";
import { useTracking } from "../hooks/useTracking";

export function MapSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { vehicles, connected } = useTracking();

  const mapVehicles = vehicles
    .filter((v) => v.lat && v.lng)
    .map((v) => ({
      id: v.id,
      name: v.plate,
      lat: v.lat,
      lng: v.lng,
      status: (v.status === "active" ? "moving" : v.status === "maintenance" ? "idle" : "stopped") as "moving" | "idle" | "stopped",
      speed: v.speed,
      driver: v.driver_name || "—",
      heading: v.heading,
    }));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-[400px] mb-6">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <h3 className="font-bold text-gray-900">{t("transportMap")}</h3>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            connected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
            {connected ? <Wifi size={10} /> : <WifiOff size={10} />}
            {connected ? "LIVE" : "..."}
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
            <Filter size={14} />{t("allVehicles")}
          </button>
          <button onClick={() => navigate("/map")} className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors" title="Full screen">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 w-full relative z-0">
        <LeafletMap vehicles={mapVehicles} />
      </div>
    </div>
  );
}
