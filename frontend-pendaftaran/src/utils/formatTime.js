export const getRelativeTime = (date) => {
  if (!date) return "Baru saja";
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "Baru saja";
  if (diffMin < 60) return `${diffMin} menit yang lalu`;
  if (diffHour < 24) return `${diffHour} jam yang lalu`;
  if (diffDay === 1) return "Kemarin";
  if (diffDay < 7) return `${diffDay} hari yang lalu`;
  return past.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
};

export const formatTanggalIndonesia = (dateStr, fullMonth = false) => {
  if (!dateStr) return "-";
  try {
    const clean = String(dateStr).includes("T") ? String(dateStr).split("T")[0] : String(dateStr);
    const parts = clean.split("-");
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const bulanPendek = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
    const bulanPanjang = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const bulan = fullMonth ? bulanPanjang : bulanPendek;
    const bln = bulan[parseInt(m, 10) - 1] || m;
    return `${parseInt(d, 10)} ${bln} ${y}`;
  } catch {
    return dateStr;
  }
};