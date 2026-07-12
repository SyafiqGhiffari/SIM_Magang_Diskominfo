import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MessageSquare, LayoutDashboard, HelpCircle, LogOut, User } from "lucide-react";
import { logoutAdmin, getProfile } from "../services/authService";

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setProfile(res.data.data);
      } catch (err) {
        navigate("/login");
      }
    };
    fetchProfile();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await logoutAdmin();
      localStorage.removeItem("admin_token");
      navigate("/login");
    } catch (err) {
      localStorage.removeItem("admin_token");
      navigate("/login");
    }
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", background: "#f8fafc", overflow: "hidden", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Sidebar */}
      <div style={{ width: 260, background: "#0B1442", color: "#fff", display: "flex", flexDirection: "column", flexShrink: 0 }}>
        {/* Logo / Header */}
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #004F9F, #00a5ec)", display: "flex", alignItems: "center", justify: "center", display: "flex", justifyContent: "center" }}>
            <MessageSquare size={18} color="#fff" />
          </div>
          <div>
            <h1 style={{ fontSize: 15, fontWeight: 800, margin: 0, letterSpacing: "0.5px" }}>SIM MAGANG</h1>
            <p style={{ fontSize: 10, color: "#94a3b8", margin: 0, fontWeight: 600 }}>DISKOMINFO MANAJEMEN</p>
          </div>
        </div>

        {/* Navigation Items */}
        <div style={{ flex: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
          <Link to="/" style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8,
            color: isActive("/") ? "#fff" : "#94a3b8",
            background: isActive("/") ? "rgba(255,255,255,0.06)" : "transparent",
            textDecoration: "none", fontSize: 14, fontWeight: isActive("/") ? 700 : 500,
            transition: "all 0.2s"
          }}>
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </Link>

          <Link to="/chat" style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8,
            color: isActive("/chat") ? "#fff" : "#94a3b8",
            background: isActive("/chat") ? "rgba(255,255,255,0.06)" : "transparent",
            textDecoration: "none", fontSize: 14, fontWeight: isActive("/chat") ? 700 : 500,
            transition: "all 0.2s"
          }}>
            <MessageSquare size={18} />
            <span>Pesan Peserta</span>
          </Link>

          <Link to="/faq" style={{
            display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8,
            color: isActive("/faq") ? "#fff" : "#94a3b8",
            background: isActive("/faq") ? "rgba(255,255,255,0.06)" : "transparent",
            textDecoration: "none", fontSize: 14, fontWeight: isActive("/faq") ? 700 : 500,
            transition: "all 0.2s"
          }}>
            <HelpCircle size={18} />
            <span>FAQ & Quick Action</span>
          </Link>
        </div>

        {/* Footer Sidebar */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <button onClick={handleLogout} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderRadius: 8,
            color: "#ef4444", background: "transparent", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600, textAlign: "left", transition: "all 0.2s"
          }}>
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        {/* Topbar */}
        <div style={{ height: 70, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "0 32px", flexShrink: 0 }}>
          {profile && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{profile.email}</p>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "capitalize" }}>{profile.role}</p>
              </div>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e2e8f0" }}>
                <User size={18} color="#64748b" />
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: 32 }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
