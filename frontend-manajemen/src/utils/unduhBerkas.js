// Mengubah balasan blob dari axios menjadi unduhan nyata di peramban.
// Nama berkas diambil dari header Content-Disposition bila tersedia,
// karena hanya backend yang tahu tanggal pembuatannya.
export function unduhBlob(res, namaCadangan = "berkas.csv") {
  const disposisi = res.headers?.["content-disposition"] || "";
  const cocok = disposisi.match(/filename="?([^"]+)"?/);
  const nama = cocok ? cocok[1] : namaCadangan;

  const url = window.URL.createObjectURL(new Blob([res.data]));
  const tautan = document.createElement("a");
  tautan.href = url;
  tautan.setAttribute("download", nama);
  document.body.appendChild(tautan);
  tautan.click();

  // Bersihkan, kalau tidak object URL akan menahan memori sampai tab ditutup
  tautan.remove();
  window.URL.revokeObjectURL(url);
}