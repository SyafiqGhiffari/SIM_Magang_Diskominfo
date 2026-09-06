const bidangPalette = [
  {
    bg: "bg-blue-50 dark:bg-blue-900/20",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-200 dark:border-blue-700/40",
    style: { backgroundColor: "#eff6ff", color: "#1d4ed8" },
    darkStyle: { backgroundColor: "rgba(30, 58, 138, 0.2)", color: "#93c5fd" },
  },
  {
    bg: "bg-purple-50 dark:bg-purple-900/20",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-200 dark:border-purple-700/40",
    style: { backgroundColor: "#faf5ff", color: "#6b21a8" },
    darkStyle: { backgroundColor: "rgba(88, 28, 135, 0.2)", color: "#d8b4fe" },
  },
  {
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-200 dark:border-emerald-700/40",
    style: { backgroundColor: "#ecfdf5", color: "#047857" },
    darkStyle: { backgroundColor: "rgba(6, 78, 59, 0.2)", color: "#6ee7b7" },
  },
  {
    bg: "bg-amber-50 dark:bg-amber-900/20",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-700/40",
    style: { backgroundColor: "#fffbeb", color: "#b45309" },
    darkStyle: { backgroundColor: "rgba(120, 53, 15, 0.2)", color: "#fcd34d" },
  },
  {
    bg: "bg-rose-50 dark:bg-rose-900/20",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-700/40",
    style: { backgroundColor: "#fff1f2", color: "#be123c" },
    darkStyle: { backgroundColor: "rgba(136, 19, 55, 0.2)", color: "#fda4af" },
  },
  {
    bg: "bg-teal-50 dark:bg-teal-900/20",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-200 dark:border-teal-700/40",
    style: { backgroundColor: "#f0fdfa", color: "#0f766e" },
    darkStyle: { backgroundColor: "rgba(19, 78, 74, 0.2)", color: "#5eead4" },
  },
  {
    bg: "bg-indigo-50 dark:bg-indigo-900/20",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-200 dark:border-indigo-700/40",
    style: { backgroundColor: "#eef2ff", color: "#4338ca" },
    darkStyle: { backgroundColor: "rgba(49, 46, 129, 0.2)", color: "#a5b4fc" },
  },
  {
    bg: "bg-fuchsia-50 dark:bg-fuchsia-900/20",
    text: "text-fuchsia-700 dark:text-fuchsia-300",
    border: "border-fuchsia-200 dark:border-fuchsia-700/40",
    style: { backgroundColor: "#fdf4ff", color: "#a21caf" },
    darkStyle: { backgroundColor: "rgba(112, 26, 117, 0.2)", color: "#f0abfc" },
  },
];

// Setiap nama bidang selalu menghasilkan warna yang sama (konsisten),
// diprioritaskan menggunakan kata kunci bidang dan fallback ke hash sederhana.
export const getBidangColor = (name) => {
  if (!name) return bidangPalette[0];
  const cleanName = name.trim().toLowerCase();
  
  if (cleanName.includes("aplikasi") || cleanName.includes("informatika") || cleanName.includes("aptika")) {
    return bidangPalette[6]; // Indigo
  }
  if (cleanName.includes("statistik") || cleanName.includes("persandian")) {
    return bidangPalette[0]; // Blue
  }
  if (cleanName.includes("jaringan") || cleanName.includes("infrastruktur")) {
    return bidangPalette[2]; // Emerald
  }
  if (cleanName.includes("humas") || cleanName.includes("komunikasi") || cleanName.includes("informasi publik")) {
    return bidangPalette[3]; // Amber
  }
  if (cleanName.includes("sekretariat") || cleanName.includes("umum")) {
    return bidangPalette[1]; // Violet
  }
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash += name.charCodeAt(i);
  }
  return bidangPalette[hash % bidangPalette.length];
};