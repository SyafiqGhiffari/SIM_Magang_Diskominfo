import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/authService";
import { MessageSquare, Lock, Mail, Loader2 } from "lucide-react";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await loginAdmin(email, password);
      if (res.data.success) {
        localStorage.setItem("admin_token", res.data.token);
        navigate("/");
      } else {
        setError(res.data.message || "Email atau password salah.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Terjadi kesalahan sistem.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: "flex", height: "100vh", width: "100vw", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #030c22 0%, #0B1442 50%, #0d1f5c 100%)",
      fontFamily: "system-ui, -apple-system, sans-serif", overflow: "hidden", position: "relative"
    }}>
      {/* Decorative Orbs */}
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "rgba(0, 165, 236, 0.15)", filter: "blur(80px)", top: "-10%", left: "-10%" }} />
      <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "rgba(124, 58, 237, 0.12)", filter: "blur(100px)", bottom: "-15%", right: "-10%" }} />

      {/* Card Container */}
      <div style={{
        width: 420, padding: 40, borderRadius: 24,
        background: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4)",
        display: "flex", flexDirection: "column", gap: 32, zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 54, height: 54, borderRadius: 14,
            background: "linear-gradient(135deg, #004F9F, #00a5ec)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px", boxShadow: "0 8px 24px rgba(0, 79, 159, 0.4)"
          }}>
            <MessageSquare size={26} color="#fff" />
          </div>
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>Portal Manajemen</h2>
          <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, fontWeight: 500 }}>Masuk dengan akun admin Anda</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            padding: "12px 16px", borderRadius: 12, background: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.2)", color: "#f87171", fontSize: 13, fontWeight: 600
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 700, letterSpacing: "0.5px" }}>EMAIL</label>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12,
              background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)",
              transition: "border-color 0.2s"
            }}>
              <Mail size={16} color="#94a3b8" />
              <input
                type="email"
                placeholder="admin@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: "#fff", fontSize: 14, width: "100%"
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ color: "#cbd5e1", fontSize: 12, fontWeight: 700, letterSpacing: "0.5px" }}>PASSWORD</label>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderRadius: 12,
              background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(255, 255, 255, 0.08)",
              transition: "border-color 0.2s"
            }}>
              <Lock size={16} color="#94a3b8" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  background: "transparent", border: "none", outline: "none",
                  color: "#fff", fontSize: 14, width: "100%"
                }}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 14, borderRadius: 12, border: "none",
              background: "linear-gradient(135deg, #004F9F, #00a5ec)",
              color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 8px 24px rgba(0, 79, 159, 0.35)", marginTop: 8,
              transition: "transform 0.2s, opacity 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            {loading ? (
              <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
            ) : "Masuk"}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default LoginPage;
