import { useEffect, useRef, useState } from "react";

/**
 * Simpan otomatis untuk satu objek form.
 *
 * Cara kerja: setiap kali `nilai` berubah, hook menunggu jeda singkat
 * (debounce). Bila dalam jeda itu tidak ada perubahan lagi, fungsi `simpan`
 * dipanggil sekali. Perubahan pertama (saat data baru dimuat dari server)
 * sengaja diabaikan supaya tidak terjadi penyimpanan palsu.
 *
 * @param {any} nilai  Objek form yang dipantau. Boleh null saat masih memuat.
 * @param {(nilai:any)=>Promise<any>} simpan  Fungsi penyimpan ke server.
 * @param {{jeda?:number, aktif?:boolean}} opsi
 * @returns {{status:string, tandaiTersimpan:(nilaiBaru:any)=>void}}
 *   status: "idle" | "menunggu" | "menyimpan" | "tersimpan" | "gagal"
 */
export default function useAutoSimpan(nilai, simpan, opsi = {}) {
  const { jeda = 900, aktif = true } = opsi;

  const [status, setStatus] = useState("idle");
  const tandaRef = useRef(null); // sidik jari data yang sudah tersimpan
  const simpanRef = useRef(simpan);

  useEffect(() => {
    simpanRef.current = simpan;
  });

  useEffect(() => {
    if (!aktif || nilai === null || nilai === undefined) return undefined;

    const tanda = JSON.stringify(nilai);

    // Pemuatan pertama: jadikan patokan, jangan simpan apa pun.
    if (tandaRef.current === null) {
      tandaRef.current = tanda;
      return undefined;
    }

    // Tidak ada perubahan nyata.
    if (tandaRef.current === tanda) return undefined;

    setStatus("menunggu");

    const timer = setTimeout(async () => {
      setStatus("menyimpan");
      try {
        await simpanRef.current(nilai);
        tandaRef.current = tanda;
        setStatus("tersimpan");
      } catch {
        setStatus("gagal");
      }
    }, jeda);

    return () => clearTimeout(timer);
  }, [nilai, jeda, aktif]);

  // Dipakai saat data disegarkan ulang dari server agar tidak memicu simpan.
  const tandaiTersimpan = (nilaiBaru) => {
    tandaRef.current = JSON.stringify(nilaiBaru);
  };

  return { status, tandaiTersimpan };
}