import api from "./api";

export const loginAdmin = (email, password) =>
  api.post("/manajemen/login", { email, password });

export const logoutAdmin = () =>
  api.post("/manajemen/logout");

export const getProfile = () =>
  api.get("/manajemen/profile");

export const gantiPasswordAdmin = (data) =>
  api.put("/manajemen/ganti-password", data);
