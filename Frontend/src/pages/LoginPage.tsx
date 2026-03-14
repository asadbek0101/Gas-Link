import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Truck, Eye, EyeOff, ChevronDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useTranslation, Language } from "../lib/i18n";
import { authApi, saveAuth, isAuthenticated } from "../api";

export function LoginPage() {
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);

  if (isAuthenticated()) {
    navigate("/", { replace: true });
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error(t("loginError")); return; }
    setLoading(true);
    try {
      const response = await authApi.login({ email, password });
      saveAuth(response);
      toast.success(t("welcomeBack"));
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  const languages: { code: Language; label: string; flag: string }[] = [
    { code: "uz", label: "O'zbekcha", flag: "🇺🇿" },
    { code: "ru", label: "Русский", flag: "🇷🇺" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];
  const currentLang = languages.find((l) => l.code === language);

  return (
    <div className="min-h-screen bg-[#F8F9FC] flex flex-col items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#1E3A5F] p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/20">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">GasLink</h1>
          <p className="text-blue-200 mt-2 text-sm">{t("loginSubtitle")}</p>
        </div>
        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("email")}</label>
              <input type="email" required disabled={loading}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                placeholder="admin@fleetcommand.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t("password")}</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} required disabled={loading}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12 disabled:opacity-50"
                  placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-[#1E3A5F] hover:bg-[#152e4d] text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 size={20} className="animate-spin" />}
              {loading ? "..." : t("signIn")}
            </button>
          </form>
          <div className="mt-8 pt-6 border-t border-gray-100 flex justify-center">
            <div className="relative">
              <button onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 rounded-full transition-colors border border-gray-200">
                <span className="text-lg">{currentLang?.flag}</span>
                <span>{currentLang?.label}</span>
                <ChevronDown size={14} className={`text-gray-400 transition-transform ${isLangOpen ? "rotate-180" : ""}`} />
              </button>
              {isLangOpen && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-50 overflow-hidden">
                  {languages.map((lang) => (
                    <button key={lang.code} onClick={() => { setLanguage(lang.code); setIsLangOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-gray-50 ${language === lang.code ? "text-blue-600 font-medium bg-blue-50" : "text-gray-700"}`}>
                      <span className="text-lg">{lang.flag}</span>{lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
