import { useEffect, useRef, useState } from "react";

/**
 * Simpan otomatis untuk daftar/baris (tiap baris punya id sendiri).
 *
 * Setiap baris memiliki timer dan status sendiri, sehingga mengedit satu baris
 * tidak mengganggu baris lain.
 *
 * @param {(data:any)=>Promise<any>} simpan  Fungsi penyimpan satu baris.
 * @param {number} jeda  Lama menunggu sebelum menyimpan (ms).
 * @returns {{status:Record<string,string>, jadwalkan:(id:any,data:any)=>void}}
 */
export default function useAutoSimpanBaris(simpan, jeda = 900) {
  const [status, setStatus] = useState({});
  const timerRef = useRef({});
  const simpanRef = useRef(simpan);

  useEffect(() => {
    simpanRef.current = simpan;
  });

  // Bersihkan seluruh timer saat komponen dilepas.
  useEffect(() => {
    const timers = timerRef.current;
    return () => Object.values(timers).forEach(clearTimeout);
  }, []);

  const jadwalkan = (id, data) => {
    clearTimeout(timerRef.current[id]);
    setStatus((s) => ({ ...s, [id]: "menunggu" }));

    timerRef.current[id] = setTimeout(async () => {
      setStatus((s) => ({ ...s, [id]: "menyimpan" }));
      try {
        await simpanRef.current(data);
        setStatus((s) => ({ ...s, [id]: "tersimpan" }));
      } catch {
        setStatus((s) => ({ ...s, [id]: "gagal" }));
      }
    }, jeda);
  };

  return { status, jadwalkan };
}