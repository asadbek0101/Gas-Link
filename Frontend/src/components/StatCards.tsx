import React, { cloneElement } from "react";
import { Truck, Navigation, Fuel, Gauge, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "../lib/i18n";
import type { DashboardStats } from "../api/types";

interface StatCardProps {
  title: string;
  value: string;
  trend: string;
  trendUp: boolean;
  icon: React.ReactNode;
  iconColor: string;
  index: number;
}

const StatCard = ({ title, value, trend, trendUp, icon, iconColor, index }: StatCardProps) => {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white p-6 rounded-card shadow-sm border border-gray-100 flex flex-col justify-between h-full"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${iconColor} bg-opacity-10`}>
          {cloneElement(icon as React.ReactElement, {
            className: `w-6 h-6 ${iconColor.replace("bg-", "text-")}`,
          })}
        </div>
      </div>
      <div className="flex items-center text-sm">
        <span className={`flex items-center font-medium ${trendUp ? "text-status-green" : "text-status-red"}`}>
          {trendUp ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
          {trend}
        </span>
        <span className="text-gray-400 ml-2">{t("vsYesterday")}</span>
      </div>
    </motion.div>
  );
};

interface StatCardsProps {
  stats?: DashboardStats | null;
}

export function StatCards({ stats }: StatCardsProps) {
  const { t } = useTranslation();
  const data = [
    {
      title: t("totalVehicles"),
      value: stats ? String(stats.total_vehicles) : "—",
      trend: "12%",
      trendUp: true,
      icon: <Truck />,
      iconColor: "bg-blue-500 text-blue-500",
    },
    {
      title: t("onRoute"),
      value: stats ? String(stats.on_route) : "—",
      trend: "5%",
      trendUp: true,
      icon: <Navigation />,
      iconColor: "bg-status-green text-status-green",
    },
    {
      title: t("fuelConsumption"),
      value: stats?.fuel_consumption || "—",
      trend: "2.4%",
      trendUp: false,
      icon: <Fuel />,
      iconColor: "bg-status-amber text-status-amber",
    },
    {
      title: t("todayMileage"),
      value: stats?.today_mileage || "—",
      trend: "8.1%",
      trendUp: true,
      icon: <Gauge />,
      iconColor: "bg-status-purple text-status-purple",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {data.map((stat, index) => (
        <StatCard key={index} index={index} {...stat} />
      ))}
    </div>
  );
}
