import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/admin/DashboardPage";
import FaqPage from "../pages/admin/FaqPage";
import KelolaAkunPage from "../pages/admin/KelolaAkunPage";
import BidangPage from "../pages/admin/BidangPage";
import MentorPage from "../pages/admin/MentorPage";
import PesertaPage from "../pages/admin/PesertaPage";
import PendaftaranPage from "../pages/admin/PendaftaranPage";
import SuratPenerimaanPage from "../pages/admin/SuratPenerimaanPage";
import TemplateSuratPage from "../pages/admin/TemplateSuratPage";
import JamKerjaLiburPage from "../pages/admin/JamKerjaLiburPage";
import DataPresensiPage from "../pages/admin/DataPresensiPage";
import RekapPresensiPage from "../pages/admin/RekapPresensiPage";
import KelolaSertifikatPage from "../pages/admin/KelolaSertifikatPage";
import TemplateSertifikatPage from "../pages/admin/TemplateSertifikatPage";
import MentorDashboardPage from "../pages/mentor/MentorDashboardPage";
import PresensiBimbinganPage from "../pages/mentor/PresensiBimbinganPage";
import VerifikasiIzinPage from "../pages/mentor/VerifikasiIzinPage";
import PesertaDashboardPage from "../pages/peserta/PesertaDashboardPage";
import PresensiSayaPage from "../pages/peserta/PresensiSayaPage";
import PengajuanIzinPage from "../pages/peserta/PengajuanIzinPage";
import { getToken, getRole } from "../utils/authStorage";

const roleHomePath = {
  admin: "/admin",
  mentor: "/mentor",
  peserta: "/peserta",
};

const AuthRoute = ({ children }) => {
  const token = getToken();
  const role = getRole();
  if (token) return <Navigate to={roleHomePath[role] || "/login"} replace />;
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<AuthRoute><LoginPage /></AuthRoute>} />

      {/* Admin — hanya role admin yang boleh akses */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]}><DashboardPage /></ProtectedRoute>} /> 
      <Route path="/admin/faq" element={<ProtectedRoute allowedRoles={["admin"]}><FaqPage /></ProtectedRoute>} />
      <Route path="/admin/akun" element={<ProtectedRoute allowedRoles={["admin"]}><KelolaAkunPage /></ProtectedRoute>} />
      <Route path="/admin/bidang" element={<ProtectedRoute allowedRoles={["admin"]}><BidangPage /></ProtectedRoute>} />
      <Route path="/admin/mentor" element={<ProtectedRoute allowedRoles={["admin"]}><MentorPage /></ProtectedRoute>} />
      <Route path="/admin/peserta" element={<ProtectedRoute allowedRoles={["admin"]}><PesertaPage /></ProtectedRoute>} />
      <Route path="/admin/pendaftaran" element={<ProtectedRoute allowedRoles={["admin"]}><PendaftaranPage /></ProtectedRoute>} />
      <Route path="/admin/surat-penerimaan" element={<ProtectedRoute allowedRoles={["admin"]}><SuratPenerimaanPage /></ProtectedRoute>} />
      <Route path="/admin/surat-penerimaan/template" element={<ProtectedRoute allowedRoles={["admin"]}><TemplateSuratPage /></ProtectedRoute>} />
      <Route path="/admin/jam-kerja" element={<ProtectedRoute allowedRoles={["admin"]}><JamKerjaLiburPage /></ProtectedRoute>} />
      <Route path="/admin/presensi/rekap" element={<ProtectedRoute allowedRoles={["admin"]}><RekapPresensiPage /></ProtectedRoute>} />
      <Route path="/admin/presensi" element={<ProtectedRoute allowedRoles={["admin"]}><DataPresensiPage /></ProtectedRoute>} />
      <Route path="/admin/sertifikat" element={<ProtectedRoute allowedRoles={["admin"]}><KelolaSertifikatPage /></ProtectedRoute>} />
      <Route path="/admin/sertifikat/template" element={<ProtectedRoute allowedRoles={["admin"]}><TemplateSertifikatPage /></ProtectedRoute>} />

      {/* Mentor — hanya role mentor yang boleh akses */}
      <Route path="/mentor" element={<ProtectedRoute allowedRoles={["mentor"]}><MentorDashboardPage /></ProtectedRoute>} />
      <Route path="/mentor/presensi" element={<ProtectedRoute allowedRoles={["mentor"]}><PresensiBimbinganPage /></ProtectedRoute>} />
      <Route path="/mentor/pengajuan-izin" element={<ProtectedRoute allowedRoles={["mentor"]}><VerifikasiIzinPage /></ProtectedRoute>} />

      {/* Peserta — hanya role peserta yang boleh akses */}
      <Route path="/peserta" element={<ProtectedRoute allowedRoles={["peserta"]}><PesertaDashboardPage /></ProtectedRoute>} />
      <Route path="/peserta/presensi" element={<ProtectedRoute allowedRoles={["peserta"]}><PresensiSayaPage /></ProtectedRoute>} />
      <Route path="/peserta/pengajuan-izin" element={<ProtectedRoute allowedRoles={["peserta"]}><PengajuanIzinPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;