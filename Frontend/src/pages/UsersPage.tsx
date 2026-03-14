import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, MoreHorizontal, Mail, Shield, Calendar, Loader2, Pencil, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "../lib/i18n";
import { Modal } from "../components/Modal";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { usersApi } from "../api";
import type { User } from "../api/types";

export function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "viewer", status: "active" });
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const fetchUsers = (search = "") => {
    setLoading(true);
    usersApi.getAll(1, 50, search).then((r) => setUsers(r.data || [])).catch(() => toast.error("Failed")).finally(() => setLoading(false));
  };
  useEffect(() => { fetchUsers(); }, []);
  useEffect(() => { const t = setTimeout(() => fetchUsers(searchTerm), 300); return () => clearTimeout(t); }, [searchTerm]);

  const openAdd = () => { setEditingUser(null); setForm({ name: "", email: "", role: "viewer", status: "active" }); setIsModalOpen(true); };
  const openEdit = (u: User) => { setEditingUser(u); setForm({ name: u.name, email: u.email, role: u.role, status: u.status }); setIsModalOpen(true); setOpenMenu(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editingUser) { await usersApi.update(editingUser.id, form); toast.success("Foydalanuvchi yangilandi"); }
      else { await usersApi.create(form); toast.success("Foydalanuvchi qo'shildi"); }
      setIsModalOpen(false); fetchUsers(searchTerm);
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return; setDeleting(true);
    try { await usersApi.delete(deleteTarget.id); toast.success("Foydalanuvchi o'chirildi"); setDeleteTarget(null); fetchUsers(searchTerm); }
    catch (err: any) { toast.error(err.message); } finally { setDeleting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-2xl font-bold text-gray-900">{t("usersTitle")}</h1><p className="text-gray-500 mt-1">{t("manageUsers")}</p></div>
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder={t("searchPlaceholder")}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={openAdd} className="flex items-center gap-2 px-4 py-2 bg-[#1E3A5F] text-white rounded-lg hover:bg-[#152e4d] font-medium shadow-lg shadow-blue-900/10">
            <Plus size={18} />{t("addUser")}</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-gray-400" size={28} /></div> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("name")}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("role")}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("status")}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("lastLogin")}</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">{t("actions")}</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">{user.name.charAt(0)}</div>
                        <div><div className="font-semibold text-gray-900">{user.name}</div><div className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12} />{user.email}</div></div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-700"><Shield size={16} className="text-gray-400" />{t(user.role)}</div></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                        {user.status === "active" ? t("active") : t("vehicleStopped")}
                      </span>
                    </td>
                    <td className="px-6 py-4"><div className="flex items-center gap-2 text-sm text-gray-600"><Calendar size={16} className="text-gray-400" />{user.last_login ? new Date(user.last_login).toLocaleString() : "—"}</div></td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"><MoreHorizontal size={18} /></button>
                        {openMenu === user.id && (
                          <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1 z-20">
                            <button onClick={() => openEdit(user)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"><Pencil size={15} className="text-blue-500" />Tahrirlash</button>
                            <button onClick={() => { setDeleteTarget(user); setOpenMenu(null); }} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"><Trash2 size={15} />O'chirish</button>
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
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser ? "Foydalanuvchi tahrirlash" : t("addUserTitle")}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("fullName")}</label>
            <input type="text" required className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("email")}</label>
            <input type="email" required className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white outline-none transition-all"
              value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("role")}</label>
            <select className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none appearance-none"
              value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">{t("admin")}</option><option value="manager">{t("manager")}</option><option value="dispatcher">{t("dispatcher")}</option><option value="viewer">{t("viewer")}</option>
            </select></div>
          <div><label className="block text-sm font-semibold text-gray-700 mb-2">{t("status")}</label>
            <select className="w-full px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none appearance-none"
              value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">{t("active")}</option><option value="inactive">{t("vehicleStopped")}</option>
            </select></div>
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl font-medium">{t("cancel")}</button>
            <button type="submit" disabled={saving} className="px-5 py-2.5 text-white bg-[#1E3A5F] hover:bg-[#152e4d] rounded-xl font-medium disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}{t("save")}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Foydalanuvchini o'chirish" message={`"${deleteTarget?.name}" o'chirilsinmi?`} confirmText="O'chirish" cancelText={t("cancel")} loading={deleting} />
    </motion.div>
  );
}
