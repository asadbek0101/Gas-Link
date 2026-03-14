import { motion } from "framer-motion";
import { Save, Building, Bell } from "lucide-react";
import { useTranslation } from "../lib/i18n";
export function SettingsPage() {
  const { t } = useTranslation();
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
      className="max-w-4xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t("companySettings")}
        </h1>
        <p className="text-gray-500 mt-1">{t("manageProfile")}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center gap-3">
          <Building size={20} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">{t("generalInfo")}</h2>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("companyName")}
              </label>
              <input
                type="text"
                defaultValue="Logistics Pro LLC"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("contactEmail")}
              </label>
              <input
                type="email"
                defaultValue="admin@logisticspro.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("phone")}
              </label>
              <input
                type="tel"
                defaultValue="+998 90 123 45 67"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("timezone")}
              </label>
              <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
                <option>Tashkent (UTC+5)</option>
                <option>Moscow (UTC+3)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4 flex items-center gap-3">
          <Bell size={20} className="text-gray-500" />
          <h2 className="font-semibold text-gray-900">
            {t("notificationsSettings")}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            t("speedViolationSetting"),
            t("geofenceExitSetting"),
            t("lowFuelSetting"),
            t("maintenanceNeeded"),
            t("shiftStartEnd"),
          ].map((item, i) => (
            <div key={i} className="flex items-center justify-between py-2">
              <span className="text-gray-700">{item}</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked={i < 3}
                />

                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-lg shadow-blue-600/20">
          <Save size={20} />
          {t("saveChanges")}
        </button>
      </div>
    </motion.div>
  );
}
