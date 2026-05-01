// components/admin/UserManagementClient.tsx
"use client";
import { useState } from "react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import toast from "react-hot-toast";
import {
  Plus, Pencil, UserX, UserCheck, Loader2, X, Search,
} from "lucide-react";
import { ROLE_LABELS } from "@/types";
import { UserRole } from "@prisma/client";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  divisi: string | null;
  isActive: boolean;
  createdAt: string;
  docCount: number;
}

interface FormState {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  divisi: string;
}

const ROLES: UserRole[] = ["ADMIN_STAFF", "AGENDARIS", "DIREKTUR", "KABAG", "KASUBAG"];

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN_STAFF: "bg-blue-100 text-blue-700",
  AGENDARIS:   "bg-purple-100 text-purple-700",
  DIREKTUR:    "bg-red-100 text-red-700",
  KABAG:       "bg-amber-100 text-amber-700",
  KASUBAG:     "bg-gray-100 text-gray-700",
};

export function UserManagementClient({
  initialUsers,
  currentUserId,
}: {
  initialUsers: UserItem[];
  currentUserId: string;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editTarget, setEditTarget] = useState<UserItem | null>(null);
  const [form, setForm] = useState<FormState>({
    name: "", email: "", password: "", role: "ADMIN_STAFF", divisi: "",
  });
  const [errors, setErrors] = useState<Partial<FormState>>({});

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setForm({ name: "", email: "", password: "", role: "ADMIN_STAFF", divisi: "" });
    setErrors({});
    setModal("create");
  };

  const openEdit = (u: UserItem) => {
    setEditTarget(u);
    setForm({ name: u.name, email: u.email, password: "", role: u.role, divisi: u.divisi ?? "" });
    setErrors({});
    setModal("edit");
  };

  const validate = (isCreate: boolean): boolean => {
    const e: Partial<FormState> = {};
    if (!form.name.trim()) e.name = "Nama wajib diisi.";
    if (!form.email.trim()) e.email = "Email wajib diisi.";
    if (isCreate && form.password.length < 8) e.password = "Password min. 8 karakter.";
    if (isCreate && !/[A-Z]/.test(form.password)) e.password = "Harus ada huruf kapital.";
    if (isCreate && !/[0-9]/.test(form.password)) e.password = "Harus ada angka.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    const isCreate = modal === "create";
    if (!validate(isCreate)) return;
    setLoading("form");

    try {
      const url = isCreate ? "/api/users" : `/api/users/${editTarget!.id}`;
      const method = isCreate ? "POST" : "PATCH";
      const body = { ...form, ...(form.password === "" ? { password: undefined } : {}) };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal.");

      toast.success(isCreate ? "Pengguna berhasil dibuat!" : "Pengguna berhasil diperbarui!");

      if (isCreate) {
        setUsers((prev) => [{ ...json.data, docCount: 0 }, ...prev]);
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === editTarget!.id ? { ...u, ...json.data } : u))
        );
      }
      setModal(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(null);
    }
  };

  const toggleActive = async (u: UserItem) => {
    if (u.id === currentUserId) {
      toast.error("Anda tidak dapat menonaktifkan akun sendiri.");
      return;
    }
    setLoading(u.id);
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: u.isActive ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        ...(u.isActive ? {} : { body: JSON.stringify({ isActive: true }) }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Gagal.");
      toast.success(u.isActive ? `${u.name} dinonaktifkan.` : `${u.name} diaktifkan.`);
      setUsers((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, isActive: !u.isActive } : x))
      );
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setLoading(null);
    }
  };

  const setF = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="card">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="form-input pl-9 py-1.5 text-sm"
            placeholder="Cari nama atau email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus className="w-4 h-4" /> Tambah Pengguna
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="table-th">Nama</th>
              <th className="table-th">Email</th>
              <th className="table-th">Role</th>
              <th className="table-th">Divisi</th>
              <th className="table-th">Dokumen</th>
              <th className="table-th">Status</th>
              <th className="table-th">Dibuat</th>
              <th className="table-th text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filtered.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 ${!u.isActive ? "opacity-60" : ""}`}>
                <td className="table-td font-medium">{u.name}</td>
                <td className="table-td text-gray-500">{u.email}</td>
                <td className="table-td">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                </td>
                <td className="table-td text-gray-500">{u.divisi ?? "-"}</td>
                <td className="table-td text-center">{u.docCount}</td>
                <td className="table-td">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {u.isActive ? "Aktif" : "Nonaktif"}
                  </span>
                </td>
                <td className="table-td text-gray-400 whitespace-nowrap">
                  {format(new Date(u.createdAt), "dd MMM yyyy", { locale: localeId })}
                </td>
                <td className="table-td">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      disabled={loading === u.id}
                      className={`p-1.5 rounded transition-colors ${
                        u.isActive
                          ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                          : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                      }`}
                      title={u.isActive ? "Nonaktifkan" : "Aktifkan"}
                    >
                      {loading === u.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : u.isActive ? (
                        <UserX className="w-4 h-4" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-8 text-sm text-gray-400">Tidak ada pengguna ditemukan.</p>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">
                {modal === "create" ? "Tambah Pengguna Baru" : "Edit Pengguna"}
              </h3>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="form-label">Nama Lengkap</label>
                <input className="form-input" placeholder="Nama lengkap" value={form.name} onChange={setF("name")} />
                {errors.name && <p className="form-error">{errors.name}</p>}
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" placeholder="email@pdam.go.id" value={form.email} onChange={setF("email")} />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>
              <div>
                <label className="form-label">
                  Password {modal === "edit" && <span className="text-gray-400 font-normal">(kosongkan jika tidak diubah)</span>}
                </label>
                <input type="password" className="form-input" placeholder="Min. 8 karakter, huruf kapital + angka" value={form.password} onChange={setF("password")} />
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Role</label>
                  <select className="form-input" value={form.role} onChange={setF("role")}>
                    {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Divisi / Bagian</label>
                  <input className="form-input" placeholder="Contoh: IT" value={form.divisi} onChange={setF("divisi")} />
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-5">
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center">Batal</button>
              <button
                onClick={handleSubmit}
                disabled={loading === "form"}
                className="btn-primary flex-1 justify-center"
              >
                {loading === "form"
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                  : modal === "create" ? "Buat Pengguna" : "Simpan Perubahan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
