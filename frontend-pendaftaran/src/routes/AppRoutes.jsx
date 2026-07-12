import { Routes, Route, Navigate } from "react-router-dom";

import Layout from "../components/landingPage/Layout";
import LandingPage from "../pages/landingPage/LandingPage";
import TentangPage from "../pages/landingPage/TentangPage";
import ProgramMagangPage from "../pages/landingPage/ProgramMagangPage";
import PersyaratanPage from "../pages/landingPage/PersyaratanPage";
import FaqPage from "../pages/landingPage/FaqPage";
import KontakPage from "../pages/landingPage/KontakPage";
import RegisterPendaftaran from "../pages/auth/RegisterPendaftaran";
import LoginPendaftaran from "../pages/auth/LoginPendaftaran";
import DashboardPendaftaran from "../pages/pendaftaran/DashboardPendaftaran";
import ProtectedRoute from "../components/ProtectedRoute";
import PilihPendaftaran from "../pages/auth/PilihPendaftaran";
import ResetPassword from "../pages/auth/ResetPassword";

const AppRoutes = () => {
  return (
    <Routes>
      // Halaman Utama (Landing Page)
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/tentang" element={<TentangPage />} />
        <Route path="/program-magang" element={<ProgramMagangPage />} />
        <Route path="/persyaratan" element={<PersyaratanPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/kontak" element={<KontakPage />} />
      </Route>

      // Auth Pendaftaran
      <Route path="/login" element={<LoginPendaftaran />} />
      <Route path="/register" element={<RegisterPendaftaran />} />
      <Route path="/pilih-pendaftaran" element={<PilihPendaftaran />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      // Dashboard Pendaftaran (Protected)
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPendaftaran /></ProtectedRoute>} />
      <Route path="/form-pendaftaran" element={<ProtectedRoute><Navigate to="/dashboard?tab=form" replace /></ProtectedRoute>} />
      <Route path="/status" element={<ProtectedRoute><Navigate to="/dashboard?tab=status" replace /></ProtectedRoute>} />
      <Route path="/revisi-dokumen" element={<ProtectedRoute><Navigate to="/dashboard?tab=revisi" replace /></ProtectedRoute>} />
    </Routes>
  );
};

export default AppRoutes;