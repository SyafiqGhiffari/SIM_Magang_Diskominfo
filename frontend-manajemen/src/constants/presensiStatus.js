// Konstanta status presensi (bukan komponen) agar aman untuk Fast Refresh.

export const PRESENSI_STATUS = {
  hadir: {
    label: "Hadir",
    kode: "H",
    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
    dot: "bg-emerald-500",
    cell: "bg-emerald-100 text-emerald-700",
  },
  terlambat: {
    label: "Terlambat",
    kode: "T",
    badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
    dot: "bg-amber-500",
    cell: "bg-amber-100 text-amber-700",
  },
  izin: {
    label: "Izin",
    kode: "I",
    badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
    dot: "bg-sky-500",
    cell: "bg-sky-100 text-sky-700",
  },
  sakit: {
    label: "Sakit",
    kode: "S",
    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
    dot: "bg-violet-500",
    cell: "bg-violet-100 text-violet-700",
  },
  alfa: {
    label: "Alfa",
    kode: "A",
    badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
    dot: "bg-rose-500",
    cell: "bg-rose-100 text-rose-700",
  },
  libur: {
    label: "Libur",
    kode: "–",
    badge: "bg-slate-50 text-slate-400 ring-1 ring-slate-200",
    dot: "bg-slate-300",
    cell: "bg-slate-50 text-slate-300",
  },
  belum: {
    label: "Belum presensi",
    kode: "·",
    badge: "bg-slate-50 text-slate-500 ring-1 ring-slate-200",
    dot: "bg-slate-400",
    cell: "bg-white text-slate-300",
  },
};

export const STATUS_PRESENSI_OPTS = ["hadir", "terlambat", "izin", "sakit", "alfa"];

export const KATEGORI_PESERTA_OPTS = [
  { value: "mahasiswa", label: "Mahasiswa" },
  { value: "siswa", label: "Siswa" },
];

export const PRESENSI_SORT_OPTS = [
  { value: "tanggal_baru", label: "Tanggal terbaru" },
  { value: "tanggal_lama", label: "Tanggal terlama" },
  { value: "nama_az", label: "Nama A-Z" },
  { value: "nama_za", label: "Nama Z-A" },
  { value: "status", label: "Status presensi" },
  { value: "terlambat_terbanyak", label: "Paling sering terlambat" },
];

export const REKAP_SORT_OPTS = [
  { value: "kehadiran_terendah", label: "Kehadiran terendah" },
  { value: "kehadiran_tertinggi", label: "Kehadiran tertinggi" },
  { value: "nama_az", label: "Nama A-Z" },
  { value: "nama_za", label: "Nama Z-A" },
  { value: "alfa_terbanyak", label: "Alfa terbanyak" },
  { value: "terlambat_terbanyak", label: "Terlambat terbanyak" },
];

export const statusInfo = (key) => PRESENSI_STATUS[key] || PRESENSI_STATUS.belum;

export const BULAN_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export const formatTanggalPresensi = (str) => {
  if (!str) return "-";
  const d = new Date(String(str).slice(0, 10));
  if (isNaN(d)) return str;
  const bln = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  return `${d.getDate()} ${bln[d.getMonth()]} ${d.getFullYear()}`;
};

export const NAMA_HARI = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

// "Minggu" — hanya nama harinya
export const namaHari = (str) => {
  if (!str) return "-";
  const d = new Date(String(str).slice(0, 10));
  if (isNaN(d)) return "-";
  return NAMA_HARI[d.getDay()];
};

// "26 Juli 2026" — nama bulan penuh (tidak disingkat)
export const formatTanggalLengkap = (str) => {
  if (!str) return "-";
  const d = new Date(String(str).slice(0, 10));
  if (isNaN(d)) return str;
  return `${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
};

// "Minggu, 26 Juli 2026"
export const formatTanggalHari = (str) => {
  if (!str) return "-";
  const d = new Date(String(str).slice(0, 10));
  if (isNaN(d)) return str;
  return `${NAMA_HARI[d.getDay()]}, ${d.getDate()} ${BULAN_ID[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatMenit = (menit) => {
  const m = Number(menit) || 0;
  if (m <= 0) return "-";
  if (m < 60) return `${m} menit`;
  const jam = Math.floor(m / 60);
  const sisa = m % 60;
  return sisa ? `${jam} jam ${sisa} menit` : `${jam} jam`;
};