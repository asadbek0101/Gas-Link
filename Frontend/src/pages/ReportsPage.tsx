import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Download, Calendar } from "lucide-react";
import { useTranslation } from "../lib/i18n";
export function ReportsPage() {
  const { t } = useTranslation();
  const fuelData = useMemo(
    () => [
      {
        name: t("mon"),
        value: 400,
      },
      {
        name: t("tue"),
        value: 300,
      },
      {
        name: t("wed"),
        value: 550,
      },
      {
        name: t("thu"),
        value: 450,
      },
      {
        name: t("fri"),
        value: 600,
      },
      {
        name: t("sat"),
        value: 200,
      },
      {
        name: t("sun"),
        value: 150,
      },
    ],

    [t],
  );
  const mileageData = useMemo(
    () => [
      {
        name: t("mon"),
        km: 1200,
      },
      {
        name: t("tue"),
        km: 1100,
      },
      {
        name: t("wed"),
        km: 1400,
      },
      {
        name: t("thu"),
        km: 1300,
      },
      {
        name: t("fri"),
        km: 1600,
      },
      {
        name: t("sat"),
        km: 800,
      },
      {
        name: t("sun"),
        km: 600,
      },
    ],

    [t],
  );
  const statusData = useMemo(
    () => [
      {
        name: t("onRouteStatus"),
        value: 12,
        color: "#22C55E",
      },
      {
        name: t("parkingStatus"),
        value: 5,
        color: "#F59E0B",
      },
      {
        name: t("repairStatus"),
        value: 3,
        color: "#EF4444",
      },
    ],

    [t],
  );
  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t("analyticsTitle")}
          </h1>
          <p className="text-gray-500 mt-1">{t("fleetSummary")}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Calendar size={18} />
            <span>{t("thisMonth")}</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <Download size={18} />
            {t("export")}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {t("fuelConsumptionLiters")}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fuelData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />

                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#6B7280",
                  }}
                  dy={10}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#6B7280",
                  }}
                />

                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  cursor={{
                    fill: "#F3F4F6",
                  }}
                />

                <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {t("fleetMileageKm")}
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mileageData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#E5E7EB"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#6B7280",
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: "#6B7280",
                  }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "none",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="km"
                  stroke="#22C55E"
                  strokeWidth={3}
                  dot={{
                    r: 4,
                    fill: "#22C55E",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{
                    r: 6,
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {t("fleetStatusTitle")}
          </h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
            <div className="w-48 h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-4">
              {statusData.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor: item.color,
                    }}
                  />

                  <span className="text-gray-600">{item.name}</span>
                  <span className="font-bold text-gray-900 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 mb-6">
            {t("expensesByCategory")}
          </h3>
          <div className="space-y-4">
            {[
              {
                label: t("fuelCategory"),
                amount: "450,000",
                percent: 65,
              },
              {
                label: t("maintenanceCategory"),
                amount: "120,000",
                percent: 20,
              },
              {
                label: t("salaryCategory"),
                amount: "80,000",
                percent: 10,
              },
              {
                label: t("otherCategory"),
                amount: "35,000",
                percent: 5,
              },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium text-gray-900">
                    {item.amount} {t("thousandSum")}
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${item.percent}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
