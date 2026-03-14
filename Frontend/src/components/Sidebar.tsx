import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Map, Truck, Users, FileText, Bell, Settings, LogOut, UserCog } from "lucide-react";
import { useTranslation } from "../lib/i18n";
import { clearAuth } from "../api";

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
}

const NavItem = ({ icon, label, to }: NavItemProps) => (
  <NavLink
    to={to}
    end={to === "/"}
    className={({ isActive }) =>
      `w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-200 relative group
      ${isActive ? "text-white bg-white/10" : "text-gray-400 hover:text-white hover:bg-white/5"}`
    }
  >
    {({ isActive }) => (
      <>
        {isActive && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-green-400 rounded-r-full" />
        )}
        {icon}
        {label}
      </>
    )}
  </NavLink>
);

export function Sidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#1E3A5F] flex flex-col shadow-2xl z-50 text-white">
      <div className="h-16 flex items-center px-6 border-b border-white/10 bg-[#152e4d]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shadow-lg shadow-green-500/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <span className="text-white font-bold text-lg tracking-tight">GasLink</span>
        </div>
      </div>

      <nav className="flex-1 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("menu")}</div>
        <NavItem icon={<LayoutDashboard size={20} />} label={t("dashboard")} to="/" />
        <NavItem icon={<Map size={20} />} label={t("map")} to="/map" />
        <NavItem icon={<Truck size={20} />} label={t("fleet")} to="/vehicles" />
        <NavItem icon={<Users size={20} />} label={t("drivers")} to="/drivers" />
        <NavItem icon={<UserCog size={20} />} label={t("usersTitle")} to="/users" />
        <NavItem icon={<FileText size={20} />} label={t("reports")} to="/reports" />

        <div className="mt-8 px-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{t("system")}</div>
        <NavItem icon={<Bell size={20} />} label={t("notifications")} to="/notifications" />
        <NavItem icon={<Settings size={20} />} label={t("settings")} to="/settings" />
      </nav>

      <div className="p-4 border-t border-white/10 bg-[#152e4d]">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full text-gray-300 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">{t("logout")}</span>
        </button>
      </div>
    </aside>
  );
}
