import { useEffect, useState } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { getProfile, gantiPasswordAdmin } from "../../services/authService";
import { confirmDialog, toastSuccess, toastError } from "../../utils/swal";
import { Eye, EyeOff, ShieldCheck, Mail, BadgeCheck } from "lucide-react";

const KelolaAkunPage = () => {
  const [profile, setProfile] = useState(null);

  const [passwordForm, setPasswordForm] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getProfile().then((res) => setProfile(res.data.data)).catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toastError("Konfirmasi password tidak cocok.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toastError("Password baru minimal 6 karakter.");
      return;
    }

    const result = await confirmDialog({
      title: "Simpan password baru?",
      text: "Anda perlu login ulang setelah password diubah pada beberapa kasus.",
      icon: "question",
    });
    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      await gantiPasswordAdmin({
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      toastSuccess("Password berhasil diperbarui");
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memperbarui password.");
    } finally {
      setLoading(false);
    }
  };

  const initial = profile?.email ? profile.email.charAt(0).toUpperCase() : "A";

  return (
    <AdminLayout showSearch={false}>
      <div className="max-w-3xl mx-auto space-y-6 animate-[fadeslide_0.35s_ease-out]">
        <div>
          <h2 className="text-2xl font-black tracking-tight text-[#0B1442]">Kelola Akun</h2>
          <p className="mt-1.5 text-xs text-slate-500">Lihat informasi akun dan ubah kata sandi Anda.</p>
        </div>

        {/* CARD 1: INFORMASI AKUN */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div className="h-20 w-20 shrink-0 rounded-full bg-gradient-to-br from-[#0B1442] to-[#00A5EC] flex items-center justify-center text-white text-2xl font-black shadow-sm">
              {initial}
            </div>
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <p className="text-sm font-extrabold text-[#0B1442] truncate">{profile?.email || "Memuat..."}</p>
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 capitalize">
                  {profile?.role || "-"}
                </span>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                  profile?.status_akun === "aktif" ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
                }`}>
                  {profile?.status_akun || "-"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: GANTI PASSWORD */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-4 h-4 text-[#0B1442]" />
            <h3 className="text-sm font-extrabold text-[#0B1442]">Ganti Password</h3>
          </div>
          <div className="border-t mt-3 mb-5 border-slate-100" />

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-bold text-slate-500">Password Saat Ini</label>
              <div className="relative mt-1.5">
                <input
                  type={showOld ? "text" : "password"}
                  placeholder="••••••••"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm((p) => ({ ...p, oldPassword: e.target.value }))}
                  required
                  className="w-full rounded-xl border border-slate-200 pl-4 pr-11 py-3 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 focus:border-[#004F9F]"
                />
                <button
                  type="button"
                  onClick={() => setShowOld((p) => !p)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                >
                  {showOld ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              <div>
                <label className="text-xs font-bold text-slate-500">Password Baru</label>
                <div className="relative mt-1.5">
                  <input
                    type={showNew ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-4 pr-11 py-3 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 focus:border-[#004F9F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500">Konfirmasi Password Baru</label>
                <div className="relative mt-1.5">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                    className="w-full rounded-xl border border-slate-200 pl-4 pr-11 py-3 text-sm transition-all focus:ring-2 focus:outline-none focus:ring-[#00A5EC]/20 focus:border-[#004F9F]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((p) => !p)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3.5 text-[11px] leading-relaxed text-slate-500">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
              <span>Password minimal 6 karakter. Gunakan kombinasi huruf dan angka.</span>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] px-5 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 active:translate-y-0 transition-all duration-200 disabled:opacity-60 cursor-pointer"
              >
                {loading && <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                Simpan Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default KelolaAkunPage;