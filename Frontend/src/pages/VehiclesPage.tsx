import React, { useState, useEffect } from "react";
import { Search, Filter, MoreHorizontal, Fuel, Gauge, Truck, Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "../lib/i18n";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { vehiclesApi } from "../api";
import type { Vehicle } from "../api/types";

export function VehiclesPage() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ plate: "", model: "", driver_name: "", status: "active" });
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchVehicles = (search = "") => {
    setLoading(true);
    vehiclesApi.getAll(1, 50, search).then((res) => setVehicles(res.data || [])).catch(() => toast.error("Failed to load")).finally(() => setLoading(false));
  };

  useEffect(() => { fetchVehicles(); }, []);
  useEffect(() => { const t = setTimeout(() => fetchVehicles(searchTerm), 300); return () => clearTimeout(t); }, [searchTerm]);

  const openAdd = () => { setEditingVehicle(null); setForm({ plate: "", model: "", driver_name: "", status: "active" }); setIsModalOpen(true); };
  const openEdit = (v: Vehicle) => { setEditingVehicle(v); setForm({ plate: v.plate, model: v.model, driver_name: v.driver_name || "", status: v.status }); setIsModalOpen(true); setOpenMenu(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingVehicle) {
        await vehiclesApi.update(editingVehicle.id, form);
        toast.success("Transport yangilandi");
      } else {
        await vehiclesApi.create(form);
        toast.success("Transport qo'shildi");
      }
      setIsModalOpen(false);
      fetchVehicles(searchTerm);
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await vehiclesApi.delete(deleteTarget.id);
      toast.success("Transport o'chirildi");
      setDeleteTarget(null);
      fetchVehicles(searchTerm);
    } catch (err: any) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("fleetTitle")}</h1>
          <p className="text-gray-500 mt-1">{t("manageVehicles")}</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#152e4d] transition-colors font-medium shadow-lg shadow-blue-900/10">
            <Plus size={18} />{t("addVehicle")}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-16 flex items-center justify-center"><Loader2 className="animate-spin text-gray-400" size={28} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("transport")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("status")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("driver")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("fuel")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("mileage")}</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500"><Truck size={20} /></div>
                        <div><div className="font-semibold text-gray-900">{v.plate}</div><div className="text-xs text-gray-500">{v.model}</div></div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        v.status === "active" ? "bg-green-100 text-green-800" : v.status === "maintenance" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>
                        {v.status === "active" ? t("active") : v.status === "maintenance" ? t("inRepair") : t("vehicleStopped")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{v.driver_name || t("noDriver")}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Fuel size={16} className={v.fuel < 20 ? "text-red-500" : "text-gray-400"} />
                        <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${v.fuel < 20 ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${v.fuel}%` }} />
                        </div>
                        <span className="text-xs text-gray-600">{v.fuel}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Gauge size={16} className="text-gray-400" />{v.mileage.toLocaleString()} km
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === v.id ? null : v.id)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreHorizontal size={18} />
                        </button>
                        {openMenu === v.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                            <button onClick={() => openEdit(v)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50">
                              <Pencil size={15} className="text-blue-500" />{t("edit") || "Tahrirlash"}
                            </button>
                            <button onClick={() => { setDeleteTarget(v); setOpenMenu(null); }}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 size={15} />{t("delete") || "O'chirish"}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && vehicles.length === 0 && <div className="p-12 text-center text-gray-500">{t("notFound")}</div>}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingVehicle ? "Transport tahrirlash" : t("addVehicle")}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("plate")}</label>
            <input type="text" required className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={form.plate} onChange={(e) => setForm({ ...form, plate: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("model")}</label>
            <input type="text" required className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("driver")}</label>
            <input type="text" className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={form.driver_name} onChange={(e) => setForm({ ...form, driver_name: e.target.value })} placeholder={t("selectDriver")} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("status")}</label>
            <select className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none transition-all appearance-none"
              value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t("active")}</option>
              <option value="maintenance">{t("inRepair")}</option>
              <option value="stopped">{t("vehicleStopped")}</option>
            </select></div>
          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors font-medium">{t("cancel")}</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-white bg-[#1E3A5F] hover:bg-[#152e4d] rounded-xl transition-colors font-medium shadow-lg shadow-blue-900/10 disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}{t("save")}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Transportni o'chirish" message={`"${deleteTarget?.plate} — ${deleteTarget?.model}" o'chirilsinmi?`}
        confirmText="O'chirish" cancelText={t("cancel")} loading={deleting} />
    </motion.div>
  );
}
