import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/admin/DashboardPage";
import ChatPage from "../pages/admin/ChatPage";
import FaqPage from "../pages/admin/FaqPage";
import KelolaAkunPage from "../pages/admin/KelolaAkunPage";
import MentorDashboardPage from "../pages/mentor/MentorDashboardPage";
import PesertaDashboardPage from "../pages/peserta/PesertaDashboardPage";
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
      <Route path="/admin/chat" element={<ProtectedRoute allowedRoles={["admin"]}><ChatPage /></ProtectedRoute>} />
      <Route path="/admin/faq" element={<ProtectedRoute allowedRoles={["admin"]}><FaqPage /></ProtectedRoute>} />
      <Route path="/admin/akun" element={<ProtectedRoute allowedRoles={["admin"]}><KelolaAkunPage /></ProtectedRoute>} />

      {/* Mentor — hanya role mentor yang boleh akses */}
      <Route path="/mentor" element={<ProtectedRoute allowedRoles={["mentor"]}><MentorDashboardPage /></ProtectedRoute>} />

      {/* Peserta — hanya role peserta yang boleh akses */}
      <Route path="/peserta" element={<ProtectedRoute allowedRoles={["peserta"]}><PesertaDashboardPage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;