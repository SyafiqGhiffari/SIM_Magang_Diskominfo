// Helper terpusat untuk baca/tulis data auth manajemen.
// Mendukung "Ingat Saya": localStorage (persisten) atau sessionStorage (per sesi tab).

const KEYS = ["admin_token", "admin_role", "admin_user"];

export const saveAuthData = ({ token, role, user, rememberMe }) => {
  const storage = rememberMe ? localStorage : sessionStorage;
  const other = rememberMe ? sessionStorage : localStorage;

  // Bersihkan storage yang tidak dipakai supaya tidak ada data ganda/basi
  KEYS.forEach((k) => other.removeItem(k));

  storage.setItem("admin_token", token);
  storage.setItem("admin_role", role);
  storage.setItem("admin_user", JSON.stringify(user));
};

export const getToken = () =>
  localStorage.getItem("admin_token") || sessionStorage.getItem("admin_token");

export const getRole = () =>
  localStorage.getItem("admin_role") || sessionStorage.getItem("admin_role");

export const getUser = () => {
  const raw = localStorage.getItem("admin_user") || sessionStorage.getItem("admin_user");
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearAuthData = () => {
  KEYS.forEach((k) => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
};

// ==== PERUBAHAN: "Ingat Saya" juga mengingat alamat email untuk diisi otomatis ====
const REMEMBERED_EMAIL_KEY = "admin_remembered_email";

export const saveRememberedEmail = (email) => {
  localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
};

export const getRememberedEmail = () => {
  return localStorage.getItem(REMEMBERED_EMAIL_KEY) || "";
};

export const clearRememberedEmail = () => {
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
};
// ==== AKHIR PERUBAHAN ====