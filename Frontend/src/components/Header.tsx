import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, ChevronDown, Settings, Users, LogOut } from "lucide-react";
import { useTranslation, Language } from "../lib/i18n";
import { clearAuth, getStoredUser } from "../api";

export function Header() {
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const user = getStoredUser();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];

  const currentLang = languages.find((l) => l.code === language);

  const handleLogout = () => {
    clearAuth();
    navigate("/login");
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 right-0 left-64 z-10 px-6 flex items-center justify-between shadow-sm">
      <h1 className="text-xl font-semibold text-gray-800">{t("controlPanel")}</h1>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input type="text" placeholder={t("search")}
            className="pl-9 pr-4 py-2 w-64 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-light/20 focus:border-navy transition-all bg-gray-50 focus:bg-white" />
        </div>

        <div className="relative">
          <button onClick={() => setIsLangOpen(!isLangOpen)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
            <span className="text-lg">{currentLang?.flag}</span>
            <span className="uppercase">{currentLang?.code}</span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${isLangOpen ? "rotate-180" : ""}`} />
          </button>
          {isLangOpen && (
            <div className="absolute top-full right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
              {languages.map((lang) => (
                <button key={lang.code} onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${language === lang.code ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
                  <span className="text-lg">{lang.flag}</span>{lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={() => navigate("/notifications")} className="relative p-2 text-gray-500 hover:text-navy transition-colors rounded-full hover:bg-gray-100">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-red rounded-full border-2 border-white"></span>
        </button>

        <div className="relative pl-6 border-l border-gray-200" ref={profileRef}>
          <button onClick={() => setIsProfileOpen(!isProfileOpen)} className="flex items-center gap-3 focus:outline-none">
            <div className="flex flex-col items-end hidden sm:block">
              <span className="text-sm font-medium text-gray-900">{user?.name || "User"}</span>
              <span className="text-xs text-gray-500">{t("logisticsDirector")}</span>
            </div>
            <div className="w-9 h-9 bg-[#1E3A5F] text-white rounded-full flex items-center justify-center font-medium text-sm shadow-sm ring-2 ring-white">
              {(user?.name || "U").charAt(0)}
            </div>
            <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isProfileOpen ? "rotate-180" : ""}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="py-1">
                <button onClick={() => { navigate("/settings"); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Settings size={16} className="text-gray-400" />{t("settings")}
                </button>
                <button onClick={() => { navigate("/users"); setIsProfileOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                  <Users size={16} className="text-gray-400" />{t("usersTitle")}
                </button>
              </div>
              <div className="border-t border-gray-100 pt-1">
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                  <LogOut size={16} />{t("logout")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
