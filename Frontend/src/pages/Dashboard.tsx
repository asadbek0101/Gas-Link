import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { StatCards } from "../components/StatCards";
import { MapSection } from "../components/MapSection";
import { TripsTable } from "../components/TripsTable";
import { ExpensesChart } from "../components/ExpensesChart";
import { dashboardApi } from "../api";
import type { DashboardStats } from "../api/types";

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  useEffect(() => { dashboardApi.getStats().then(setStats).catch(console.error); }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-7xl mx-auto">
      <StatCards stats={stats} />
      <MapSection />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><TripsTable /></div>
        <div className="lg:col-span-1"><ExpensesChart /></div>
      </div>
    </motion.div>
  );
}
