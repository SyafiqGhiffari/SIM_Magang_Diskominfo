import api from "./api";

export const kirimPendaftaranMagang = async (formData) => {
  const response = await api.post("/pendaftaran/magang", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

export const getStatusPendaftaran = async () => {
  const response = await api.get("/pendaftaran/magang/status");
  return response.data;
};

export const kirimRevisiDokumen = async (formData) => {
  const response = await api.put("/pendaftaran/magang/revisi", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

// ── PROFIL ─────────────────────────────────────────────────────────────
export const getProfilSaya = async () => {
  const response = await api.get("/pendaftaran/me");
  return response.data;
};

export const updateProfil = async (data) => {
  const response = await api.put("/pendaftaran/update-profil", data);
  return response.data;
};

export const uploadFotoProfil = async (formData) => {
  const response = await api.post("/pendaftaran/upload-foto", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

export const hapusFotoProfil = async () => {
  const response = await api.delete("/pendaftaran/hapus-foto");
  return response.data;
};

export const gantiPassword = async (data) => {
  const response = await api.put("/pendaftaran/ganti-password", data);
  return response.data;
};

export const requestGantiEmail = async (data) => {
  const response = await api.post("/pendaftaran/request-ganti-email", data);
  return response.data;
};

export const verifikasiGantiEmail = async (data) => {
  const response = await api.post("/pendaftaran/verifikasi-ganti-email", data);
  return response.data;
};
