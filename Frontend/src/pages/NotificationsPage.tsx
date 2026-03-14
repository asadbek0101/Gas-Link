import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Info, CheckCircle, Loader2, Trash2, Send, Plus, Bell } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "../lib/i18n";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { notificationsApi } from "../api";
import type { Notification } from "../api/types";

export function NotificationsPage() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Notification | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ type: "info", title: "", message: "" });

  const fetchNotifications = () => {
    setLoading(true);
    notificationsApi.getAll().then((r) => setNotifications(r.data || [])).catch(() => toast.error("Failed")).finally(() => setLoading(false));
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkAsRead = async (id: string) => {
    try { await notificationsApi.markAsRead(id); setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: true } : n)); }
    catch { toast.error("Failed"); }
  };

  const handleMarkAllAsRead = async () => {
    try { await notificationsApi.markAllAsRead(); setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true }))); toast.success("Barchasi o'qildi"); }
    catch { toast.error("Failed"); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      await notificationsApi.create(form);
      toast.success("Bildirishnoma yuborildi");
      setIsModalOpen(false);
      setForm({ type: "info", title: "", message: "" });
      fetchNotifications();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { await notificationsApi.delete(deleteTarget.id); toast.success("O'chirildi"); setDeleteTarget(null); fetchNotifications(); }
    catch (err: any) { toast.error(err.message); } finally { setDeleting(false); }
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("notificationsTitle")}</h1>
          <p className="text-gray-500 mt-1">{t("eventHistory")} {unreadCount > 0 && <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs font-medium">{unreadCount} yangi</span>}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleMarkAllAsRead} className="text-sm text-blue-600 font-medium hover:underline">{t("markAllRead")}</button>
          <button onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#152e4d] font-medium shadow-lg shadow-blue-900/10">
            <Send size={16} />Yuborish
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
      ) : (
        <div className="space-y-4">
          {notifications.map((note) => (
            <motion.div key={note.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              className={`p-4 rounded-xl border transition-all group ${note.is_read ? "bg-white border-gray-200" : "bg-blue-50 border-blue-100 shadow-sm"}`}>
              <div className="flex gap-4">
                <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  note.type === "warning" ? "bg-amber-100 text-amber-600" : note.type === "error" ? "bg-red-100 text-red-600" : "bg-blue-100 text-blue-600"}`}>
                  {note.type === "warning" || note.type === "error" ? <AlertTriangle size={20} /> : <Info size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h3 className={`font-semibold truncate ${note.is_read ? "text-gray-900" : "text-blue-900"}`}>{note.title}</h3>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className="text-xs text-gray-500">{timeAgo(note.created_at)}</span>
                      <button onClick={() => setDeleteTarget(note)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all rounded hover:bg-red-50">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p className={`mt-1 text-sm ${note.is_read ? "text-gray-600" : "text-blue-800"}`}>{note.message}</p>
                </div>
                {!note.is_read && (
                  <button onClick={() => handleMarkAsRead(note.id)} className="text-blue-400 hover:text-blue-600 flex-shrink-0" title="O'qildi deb belgilash">
                    <CheckCircle size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {notifications.length === 0 && (
            <div className="text-center py-16">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Bildirishnomalar yo'q</p>
            </div>
          )}
        </div>
      )}

      {/* Send Notification Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Bildirishnoma yuborish">
        <form onSubmit={handleSend} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Turi</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "info", label: "Info", icon: <Info size={18} />, color: "blue" },
                { value: "warning", label: "Ogohlantirish", icon: <AlertTriangle size={18} />, color: "amber" },
                { value: "error", label: "Xato", icon: <AlertTriangle size={18} />, color: "red" },
              ].map((opt) => (
                <button key={opt.value} type="button" onClick={() => setForm({ ...form, type: opt.value })}
                  className={`flex items-center justify-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.type === opt.value
                      ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                      : "border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}>
                  {opt.icon}{opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sarlavha</label>
            <input type="text" required className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
              placeholder="Masalan: Tezlik buzilishi" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Xabar</label>
            <textarea required rows={3}
              className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all resize-none"
              placeholder="Batafsil xabar matni..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium">{t("cancel")}</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 text-white bg-[#1E3A5F] hover:bg-[#152e4d] rounded-xl font-medium disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-900/10">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}Yuborish
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Bildirishnomani o'chirish" message={`"${deleteTarget?.title}" o'chirilsinmi?`} confirmText="O'chirish" cancelText={t("cancel")} loading={deleting} />
    </motion.div>
  );
}
