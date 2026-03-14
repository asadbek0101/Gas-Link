import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapContainer, TileLayer, Marker, Popup, Polyline,
  useMap, useMapEvents,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Search, Route, Trash2, X, MapPin, Loader2, Navigation } from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";
import { useTranslation } from "../lib/i18n";

// ── Fix default Leaflet icons ─────────────────────────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// ── Icons ─────────────────────────────────────────────────────────────────────
const createVehicleIcon = (color: string, heading: number) => {
  const html = renderToStaticMarkup(
    <div style={{
      width: 32, height: 32, borderRadius: "50%", backgroundColor: color,
      border: "2px solid white", boxShadow: "0 2px 6px rgba(0,0,0,.4)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transform: `rotate(${heading}deg)`,
    }}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="3 11 22 2 13 21 11 13 3 11" />
      </svg>
    </div>
  );
  return L.divIcon({ html, className: "", iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -18] });
};

const COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899"];

const createWaypointIcon = (letter: string, color: string, isStart: boolean, isEnd: boolean) => {
  const bg = isStart ? "#22C55E" : isEnd ? "#EF4444" : color;
  const html = renderToStaticMarkup(
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{
        width: 30, height: 30, borderRadius: "50%", backgroundColor: bg,
        border: "3px solid white", boxShadow: "0 2px 10px rgba(0,0,0,.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: "bold", fontSize: 13,
      }}>
        {letter}
      </div>
      <div style={{ width: 3, height: 10, backgroundColor: bg, marginTop: -1 }} />
    </div>
  );
  return L.divIcon({ html, className: "", iconSize: [30, 42], iconAnchor: [15, 42], popupAnchor: [0, -44] });
};

// ── Types ─────────────────────────────────────────────────────────────────────
export interface Vehicle {
  id: string; name: string; lat: number; lng: number;
  status: "moving" | "idle" | "stopped"; speed: number; driver: string; heading: number;
}
interface WP { lat: number; lng: number; label?: string; }
interface RouteInfo { coords: [number, number][]; distanceKm: number; durationMin: number; }

export interface LeafletMapProps {
  vehicles: Vehicle[];
  className?: string;
  center?: [number, number];
  zoom?: number;
  showRoutePlanner?: boolean;
}

// ── OSRM routing — real road path ─────────────────────────────────────────────
async function fetchRoute(waypoints: WP[]): Promise<RouteInfo | null> {
  if (waypoints.length < 2) return null;
  // Build coordinate string: lon,lat;lon,lat;...
  const coords = waypoints.map(w => `${w.lng},${w.lat}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.code !== "Ok" || !data.routes?.length) return null;
    const route = data.routes[0];
    // GeoJSON coords are [lng, lat] — flip to [lat, lng] for Leaflet
    const coords2: [number, number][] = route.geometry.coordinates.map(
      ([lng, lat]: [number, number]) => [lat, lng]
    );
    return {
      coords: coords2,
      distanceKm: route.distance / 1000,
      durationMin: Math.round(route.duration / 60),
    };
  } catch {
    return null;
  }
}

// ── Nominatim geocoding ───────────────────────────────────────────────────────
interface NomResult { place_id: number; display_name: string; lat: string; lon: string; }
async function geocode(q: string): Promise<NomResult[]> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&countrycodes=uz,ru,kz`;
  const res = await fetch(url, { headers: { "Accept-Language": "uz,ru,en" } });
  return res.json();
}

// ── Sub-components ────────────────────────────────────────────────────────────
function MapClickHandler({ enabled, onMapClick }: { enabled: boolean; onMapClick: (w: WP) => void }) {
  useMapEvents({ click(e) { if (enabled) onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
}
function MapResizer() {
  const map = useMap();
  useEffect(() => { map.invalidateSize(); }, [map]);
  return null;
}
function FlyTo({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => { if (target) map.flyTo(target, 15, { duration: 1.0 }); }, [target, map]);
  return null;
}
function FitBounds({ coords }: { coords: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (coords.length < 2) return;
    const bounds = L.latLngBounds(coords);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16, animate: true, duration: 1.0 });
  }, [coords, map]);
  return null;
}

// ── Main component ────────────────────────────────────────────────────────────
export function LeafletMap({
  vehicles, className = "h-full w-full",
  center = [41.2995, 69.2401], zoom = 12,
  showRoutePlanner = false,
}: LeafletMapProps) {
  const { t } = useTranslation();

  const [plannerOpen, setPlannerOpen] = useState(false);
  const [clickMode, setClickMode] = useState(false);
  const [waypoints, setWaypoints] = useState<WP[]>([]);
  const [route, setRoute] = useState<RouteInfo | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NomResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [fitRoute, setFitRoute] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const routeTimer = useRef<ReturnType<typeof setTimeout>>();

  // Recalculate route whenever waypoints change
  useEffect(() => {
    clearTimeout(routeTimer.current);
    if (waypoints.length < 2) { setRoute(null); setRouteError(false); return; }
    setRouteLoading(true);
    setRouteError(false);
    routeTimer.current = setTimeout(async () => {
      const result = await fetchRoute(waypoints);
      setRouteLoading(false);
      if (result) {
        setRoute(result);
        setFitRoute(true);
      } else {
        setRoute(null);
        setRouteError(true);
      }
    }, 300);
  }, [waypoints]);

  // Reset fitRoute flag after it fires
  useEffect(() => { if (fitRoute) setFitRoute(false); }, [fitRoute]);

  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    if (q.trim().length < 2) { setSearchResults([]); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try { setSearchResults(await geocode(q)); } finally { setSearching(false); }
    }, 500);
  }, []);

  const addFromResult = (r: NomResult) => {
    const wp: WP = { lat: parseFloat(r.lat), lng: parseFloat(r.lon), label: r.display_name.split(",")[0] };
    setWaypoints(p => [...p, wp]);
    setSearchQuery(""); setSearchResults([]);
    setFlyTarget([wp.lat, wp.lng]);
  };

  const removeWP = (i: number) => setWaypoints(p => p.filter((_, idx) => idx !== i));
  const clearAll = () => { setWaypoints([]); setRoute(null); setRouteError(false); setSearchQuery(""); setSearchResults([]); setClickMode(false); };

  const formatDuration = (min: number) => {
    if (min < 60) return `${min} daq`;
    return `${Math.floor(min / 60)} soat ${min % 60} daq`;
  };

  return (
    <div className={`relative rounded-xl overflow-hidden shadow-sm border border-gray-200 z-0 ${className}`}>
      <MapContainer center={center} zoom={zoom} style={{ height: "100%", width: "100%" }} scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapResizer />
        <FlyTo target={flyTarget} />
        {fitRoute && route && route.coords.length > 1 && <FitBounds coords={route.coords} />}
        <MapClickHandler enabled={clickMode} onMapClick={wp => setWaypoints(p => [...p, wp])} />

        {/* ── Vehicle markers ── */}
        {vehicles.map((v) => {
          const color = v.status === "moving" ? "#22C55E" : v.status === "idle" ? "#F59E0B" : v.status === "stopped" && (v as any).connectionStatus === "offline" ? "#9CA3AF" : "#EF4444";
          return (
            <Marker key={v.id} position={[v.lat, v.lng]} icon={createVehicleIcon(color, v.heading)}>
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-100">
                    <span className="font-bold text-gray-900">{v.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full text-white ${v.status === "moving" ? "bg-green-500" : v.status === "idle" ? "bg-amber-500" : "bg-red-500"}`}>
                      {v.status === "moving" ? t("moving") : v.status === "idle" ? t("idle") : t("stopped")}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex justify-between"><span>{t("driver")}:</span><span className="font-medium text-gray-900">{v.driver}</span></div>
                    <div className="flex justify-between"><span>{t("speed")}:</span><span className="font-medium text-gray-900">{v.speed} {t("kmh")}</span></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* ── Route polyline — OSRM real road ── */}
        {route && route.coords.length > 1 && (
          <>
            {/* Shadow/outline */}
            <Polyline positions={route.coords} color="#1E40AF" weight={8} opacity={0.25} />
            {/* Main road line */}
            <Polyline positions={route.coords} color="#3B82F6" weight={5} opacity={0.95} />
          </>
        )}

        {/* Fallback straight line while loading or on error */}
        {routeLoading && waypoints.length >= 2 && (
          <Polyline
            positions={waypoints.map(w => [w.lat, w.lng] as [number, number])}
            color="#94A3B8" weight={3} opacity={0.5} dashArray="8,6"
          />
        )}

        {/* ── Waypoint markers ── */}
        {waypoints.map((wp, i) => (
          <Marker
            key={`wp-${i}-${wp.lat}`}
            position={[wp.lat, wp.lng]}
            icon={createWaypointIcon(
              String.fromCharCode(65 + i),
              COLORS[i % COLORS.length],
              i === 0,
              i === waypoints.length - 1 && waypoints.length > 1
            )}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <div className="font-bold mb-1 text-gray-800">{String.fromCharCode(65 + i)}. {wp.label || "Tanlangan nuqta"}</div>
                <div className="text-xs text-gray-400 mb-2">{wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}</div>
                <button onClick={() => removeWP(i)} className="w-full text-xs text-red-500 hover:text-red-700 flex items-center justify-center gap-1 py-1 rounded border border-red-100 hover:bg-red-50">
                  <Trash2 size={11} /> O'chirish
                </button>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* ── Toolbar ── */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2">
        {showRoutePlanner && (
          <button
            onClick={() => setPlannerOpen(p => !p)}
            className={`px-3 py-2 rounded-lg shadow-md border text-sm flex items-center gap-1.5 font-medium transition-colors ${plannerOpen ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
          >
            <Route size={16} />
            <span>Marshrut</span>
          </button>
        )}
        <button className="p-2 hover:bg-gray-100 bg-white rounded-lg shadow-md border border-gray-200 text-gray-600" title={t("layers")}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </button>
      </div>

      {/* ── Route Planner Panel ── */}
      {plannerOpen && showRoutePlanner && (
        <div className="absolute top-4 left-4 z-[400] w-80 bg-white rounded-xl shadow-xl border border-gray-200 flex flex-col max-h-[calc(100%-2rem)] overflow-hidden">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center gap-2 font-semibold text-gray-800 text-sm">
              <Navigation size={15} className="text-blue-600" />
              Marshrut rejalashtirish
            </div>
            <button onClick={() => { setPlannerOpen(false); clearAll(); }} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          {/* Search box */}
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text" value={searchQuery} onChange={e => handleSearch(e.target.value)}
                placeholder="Manzil yoki joy qidiring..."
                className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-gray-50"
              />
              {searching
                ? <div className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                : searchQuery && <button onClick={() => { setSearchQuery(""); setSearchResults([]); }} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"><X size={13} /></button>
              }
            </div>

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="mt-1 border border-gray-100 rounded-lg overflow-hidden shadow-lg bg-white max-h-52 overflow-y-auto">
                {searchResults.map(r => (
                  <button key={r.place_id} onClick={() => addFromResult(r)} className="w-full text-left px-3 py-2.5 text-xs hover:bg-blue-50 border-b border-gray-50 last:border-0 flex items-start gap-2 transition-colors">
                    <MapPin size={12} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 leading-relaxed">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Click mode toggle */}
          <div className="px-3 pb-2 flex-shrink-0">
            <button
              onClick={() => setClickMode(c => !c)}
              className={`w-full py-2 rounded-lg text-xs font-medium border transition-all flex items-center justify-center gap-1.5 ${
                clickMode
                  ? "bg-amber-50 text-amber-700 border-amber-300 ring-1 ring-amber-200"
                  : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
              }`}
            >
              <MapPin size={13} />
              {clickMode ? "🖱️ Xaritaga bosing — nuqta qo'shiladi" : "Xaritadan nuqta tanlash"}
            </button>
          </div>

          {/* Waypoints list */}
          <div className="flex-1 overflow-y-auto px-3 pb-2 min-h-0">
            {waypoints.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Route size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-xs leading-relaxed">Manzil qidiring yoki<br />xaritadan nuqta tanlang</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {waypoints.map((wp, i) => {
                  const isStart = i === 0;
                  const isEnd = i === waypoints.length - 1 && waypoints.length > 1;
                  const dotColor = isStart ? "#22C55E" : isEnd ? "#EF4444" : COLORS[i % COLORS.length];
                  return (
                    <div key={i} className="flex items-center gap-2 p-2.5 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ backgroundColor: dotColor }}>
                        {String.fromCharCode(65 + i)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-gray-700 truncate">{wp.label || `${wp.lat.toFixed(4)}, ${wp.lng.toFixed(4)}`}</div>
                        {wp.label && <div className="text-[10px] text-gray-400">{wp.lat.toFixed(5)}, {wp.lng.toFixed(5)}</div>}
                      </div>
                      <button onClick={() => removeWP(i)} className="text-gray-300 hover:text-red-400 flex-shrink-0 transition-colors p-0.5 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer — route info */}
          {waypoints.length >= 2 && (
            <div className="border-t border-gray-100 flex-shrink-0">
              {routeLoading && (
                <div className="px-4 py-3 flex items-center gap-2 text-xs text-gray-500">
                  <Loader2 size={14} className="animate-spin text-blue-500" />
                  Yo'l hisoblanmoqda...
                </div>
              )}
              {routeError && !routeLoading && (
                <div className="px-4 py-3 text-xs text-amber-600 bg-amber-50 flex items-center gap-2">
                  <span>⚠️</span> Yo'l topilmadi — nuqtalar yo'l yaqinida emasmi?
                </div>
              )}
              {route && !routeLoading && (
                <div className="px-4 py-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">Yo'l marshruti</div>
                    <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                      <Trash2 size={12} /> Tozalash
                    </button>
                  </div>
                  <div className="flex gap-3">
                    {/* Distance */}
                    <div className="flex-1 bg-blue-50 rounded-lg px-3 py-2 text-center">
                      <div className="text-[10px] text-blue-400 mb-0.5">Masofa</div>
                      <div className="text-base font-bold text-blue-700 leading-tight">
                        {route.distanceKm < 1
                          ? `${(route.distanceKm * 1000).toFixed(0)} m`
                          : `${route.distanceKm.toFixed(1)} km`}
                      </div>
                    </div>
                    {/* Duration */}
                    <div className="flex-1 bg-green-50 rounded-lg px-3 py-2 text-center">
                      <div className="text-[10px] text-green-400 mb-0.5">Vaqt</div>
                      <div className="text-base font-bold text-green-700 leading-tight">
                        {formatDuration(route.durationMin)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400 flex items-center gap-1">
                    <div className="w-3 h-0.5 bg-blue-400 rounded" />
                    <div className="w-3 h-0.5 bg-blue-400 rounded" />
                    Avtomobil yo'li (OSRM)
                  </div>
                </div>
              )}
              {!route && !routeLoading && !routeError && (
                <div className="px-3 py-2.5 flex justify-between items-center">
                  <span className="text-xs text-gray-400">Masofa uchun 2+ nuqta kerak</span>
                  <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-600">Tozalash</button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
