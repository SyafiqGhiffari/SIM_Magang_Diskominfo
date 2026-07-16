const DOC_FIELDS = [
  "file_pas_foto",
  "file_surat_pengantar",
  "file_cv",
  "file_transkrip",
  "file_portofolio",
  "file_proposal_magang",
];

// Mengecek apakah SEMUA dokumen yang diunggah peserta sudah berstatus "approved"
// di detail_verifikasi. Kalau belum ada satu pun yang diunggah, dianggap belum siap.
export const isAllDocsApproved = (pendaftaran) => {
  const uploadedFields = DOC_FIELDS.filter((f) => Boolean(pendaftaran[f]));
  if (uploadedFields.length === 0) return false;

  let detail = {};
  if (pendaftaran.detail_verifikasi) {
    try {
      detail = JSON.parse(pendaftaran.detail_verifikasi);
    } catch {
      detail = {};
    }
  }

  return uploadedFields.every((f) => detail[f]?.status === "approved");
};