import { useState, useEffect } from "react";
import { MoreHorizontal, Loader2 } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { tripsApi } from "../api";
import type { Trip } from "../api/types";

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const styles: Record<string, string> = {
    active: "bg-green-100 text-green-700 border-green-200",
    completed: "bg-gray-100 text-gray-700 border-gray-200",
    delayed: "bg-amber-100 text-amber-700 border-amber-200",
  };
  const labels: Record<string, string> = {
    active: t("tripActive"),
    completed: t("tripCompleted"),
    delayed: t("tripDelayed"),
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
};

export function TripsTable() {
  const { t } = useTranslation();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    tripsApi
      .getAll(1, 10)
      .then((res) => setTrips(res.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white rounded-card shadow-sm border border-gray-100 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">{t("recentTrips")}</h3>
        <button className="text-sm text-navy hover:text-navy-light font-medium transition-colors">
          {t("allTrips")}
        </button>
      </div>
      {loading ? (
        <div className="p-12 flex items-center justify-center">
          <Loader2 className="animate-spin text-gray-400" size={24} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">{t("transport")}</th>
                <th className="px-6 py-3">{t("driver")}</th>
                <th className="px-6 py-3">{t("route")}</th>
                <th className="px-6 py-3">{t("fuel")}</th>
                <th className="px-6 py-3">{t("status")}</th>
                <th className="px-6 py-3 text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{trip.vehicle_name}</td>
                  <td className="px-6 py-4 text-gray-600">{trip.driver_name}</td>
                  <td className="px-6 py-4 text-gray-600">{trip.route}</td>
                  <td className="px-6 py-4 text-gray-600 font-mono">{trip.fuel_used}</td>
                  <td className="px-6 py-4"><StatusBadge status={trip.status} /></td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100 transition-colors">
                      <MoreHorizontal size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
