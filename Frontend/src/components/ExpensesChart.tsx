import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useTranslation } from "../lib/i18n";
export function ExpensesChart() {
  const { t } = useTranslation();
  const data = useMemo(
    () => [
      {
        name: t("mon"),
        amount: 180,
      },
      {
        name: t("tue"),
        amount: 250,
      },
      {
        name: t("wed"),
        amount: 190,
      },
      {
        name: t("thu"),
        amount: 320,
      },
      {
        name: t("fri"),
        amount: 280,
      },
      {
        name: t("sat"),
        amount: 150,
      },
      {
        name: t("sun"),
        amount: 120,
      },
    ],

    [t],
  );
  return (
    <div className="bg-white rounded-card shadow-sm border border-gray-100 p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-gray-900">{t("weeklyExpenses")}</h3>
        <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
          {t("thousandSum")}
        </span>
      </div>

      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{
              top: 10,
              right: 10,
              left: -20,
              bottom: 0,
            }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#F3F4F6"
            />

            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9CA3AF",
                fontSize: 12,
              }}
              dy={10}
            />

            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: "#9CA3AF",
                fontSize: 12,
              }}
            />

            <Tooltip
              cursor={{
                fill: "#F9FAFB",
              }}
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E5E7EB",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: number) => [
                `${value} ${t("thousandSum")}`,
                t("expenses"),
              ]}
            />

            <Bar
              dataKey="amount"
              fill="#1E3A5F"
              radius={[4, 4, 0, 0]}
              barSize={32}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
