import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Star, Phone, Mail, Award, MoreHorizontal, User, Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "../lib/i18n";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { driversApi } from "../api";
import type { Driver } from "../api/types";

export function DriversPage() {
  const { t } = useTranslation();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", experience: "", status: "active" });
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetch = () => { setLoading(true); driversApi.getAll(1, 50).then((r) => setDrivers(r.data || [])).catch(() => toast.error("Failed")).finally(() => setLoading(false)); };
  useEffect(() => { fetch(); }, []);

  const openAdd = () => { setEditingDriver(null); setForm({ name: "", phone: "", experience: "", status: "active" }); setIsModalOpen(true); };
  const openEdit = (d: Driver) => { setEditingDriver(d); setForm({ name: d.name, phone: d.phone, experience: d.experience, status: d.status }); setIsModalOpen(true); setOpenMenu(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingDriver) { await driversApi.update(editingDriver.id, form); toast.success("Haydovchi yangilandi"); }
      else { await driversApi.create(form); toast.success("Haydovchi qo'shildi"); }
      setIsModalOpen(false); fetch();
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { await driversApi.delete(deleteTarget.id); toast.success("Haydovchi o'chirildi"); setDeleteTarget(null); fetch(); }
    catch (err: any) { toast.error(err.message); } finally { setDeleting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-center">
        <div><h1 className="text-2xl font-bold text-gray-900">{t("driversTitle")}</h1><p className="text-gray-500 mt-1">{t("staffRating")}</p></div>
        <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#152e4d] transition-colors font-medium shadow-lg shadow-blue-900/10">
          <Plus size={18} />{t("addDriver")}</button>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-gray-400" size={32} /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {drivers.map((driver) => (
            <div key={driver.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500"><User size={24} /></div>
                  <div>
                    <h3 className="font-bold text-gray-900">{driver.name}</h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      driver.status === "active" ? "bg-green-100 text-green-800" : driver.status === "vacation" ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"}`}>
                      {driver.status === "active" ? t("onLine") : driver.status === "vacation" ? t("vacation") : t("sickLeave")}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <button onClick={() => setOpenMenu(openMenu === driver.id ? null : driver.id)} className="text-gray-400 hover:text-gray-600"><MoreHorizontal size={20} /></button>
                  {openMenu === driver.id && (
                    <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                      <button onClick={() => openEdit(driver)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Pencil size={15} className="text-blue-500" />Tahrirlash</button>
                      <button onClick={() => { setDeleteTarget(driver); setOpenMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><Trash2 size={15} />O'chirish</button>
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500 mb-1">{t("rating")}</div><div className="flex items-center gap-1 font-bold text-gray-900"><Star size={16} className="text-yellow-400 fill-yellow-400" />{driver.rating}</div></div>
                <div className="bg-gray-50 p-3 rounded-lg"><div className="text-xs text-gray-500 mb-1">{t("trips")}</div><div className="flex items-center gap-1 font-bold text-gray-900"><Award size={16} className="text-blue-500" />{driver.trips}</div></div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-gray-600"><Phone size={16} className="text-gray-400" />{driver.phone}</div>
                <div className="flex items-center gap-3 text-sm text-gray-600"><Mail size={16} className="text-gray-400" />{t("experience")}: {driver.experience}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingDriver ? "Haydovchi tahrirlash" : t("addDriver")}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("name")}</label>
            <input type="text" required className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("phone")}</label>
            <input type="tel" required className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("experience")}</label>
            <input type="text" required className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("status")}</label>
            <select className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none transition-all appearance-none"
              value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t("onLine")}</option><option value="vacation">{t("vacation")}</option><option value="sick">{t("sickLeave")}</option>
            </select></div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium">{t("cancel")}</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-white bg-[#1E3A5F] hover:bg-[#152e4d] rounded-xl font-medium disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}{t("save")}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Haydovchini o'chirish" message={`"${deleteTarget?.name}" o'chirilsinmi?`} confirmText="O'chirish" cancelText={t("cancel")} loading={deleting} />
    </motion.div>
  );
}
