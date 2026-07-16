const bidangPalette = [
  { bg: "bg-blue-50", text: "text-blue-700" },
  { bg: "bg-violet-50", text: "text-violet-700" },
  { bg: "bg-emerald-50", text: "text-emerald-700" },
  { bg: "bg-amber-50", text: "text-amber-700" },
  { bg: "bg-rose-50", text: "text-rose-700" },
  { bg: "bg-cyan-50", text: "text-cyan-700" },
  { bg: "bg-indigo-50", text: "text-indigo-700" },
  { bg: "bg-fuchsia-50", text: "text-fuchsia-700" },
];

// Setiap nama bidang selalu menghasilkan warna yang sama (konsisten),
// dihitung dari hash sederhana nama bidangnya sendiri.
export const getBidangColor = (name) => {
  if (!name) return bidangPalette[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return bidangPalette[Math.abs(hash) % bidangPalette.length];
};