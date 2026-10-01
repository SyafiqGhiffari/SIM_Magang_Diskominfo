import { useEffect, useState } from "react";

const ALAMAT_KANTOR_DISKOMINFO =
  "Jl. Ir. H. Juanda No. 198, Tonatan, Kec. Ponorogo, Kabupaten Ponorogo, Jawa Timur 63418";

// In-memory cache agar request koordinat yang sama tidak di-fetch berulang kali
const geocodeCache = new Map();

/**
 * Format alamat Nominatim ke format alamat Indonesia yang rapi dan lengkap
 */
export const formatAlamatIndonesia = (data) => {
  if (!data) return null;
  if (!data.address) {
    return data.display_name || null;
  }

  const addr = data.address;
  const jalan = addr.road || addr.street || addr.residential || addr.pedestrian || "";
  let kelurahan = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || "";
  if (/^r[tw]\s*\d+/i.test(kelurahan)) {
    kelurahan = addr.village || addr.suburb || "";
  }
  const kecamatan = addr.city_district || addr.district || addr.subdistrict || "";
  const kota = addr.city || addr.town || addr.county || addr.regency || "";
  const provinsi = addr.state || "";
  const kodePos = addr.postcode || "";

  const bagian = [];
  if (jalan) bagian.push(jalan);
  if (kelurahan) {
    bagian.push(
      kelurahan.toLowerCase().startsWith("kel") || kelurahan.toLowerCase().startsWith("desa")
        ? kelurahan
        : `Kel. ${kelurahan.replace(/^kelurahan\s*/i, "")}`,
    );
  }
  if (kecamatan) {
    bagian.push(
      kecamatan.toLowerCase().startsWith("kec")
        ? kecamatan
        : `Kec. ${kecamatan.replace(/^kecamatan\s*/i, "")}`,
    );
  }
  if (kota) bagian.push(kota);
  if (provinsi) bagian.push(provinsi);
  if (kodePos) bagian.push(kodePos);

  return bagian.length > 0 ? bagian.join(", ") : data.display_name || null;
};

/**
 * Mengambil alamat lengkap dari koordinat lat & lng secara asinkron
 */
export const fetchAlamatLengkap = async (lat, lng) => {
  if (!lat || !lng) return null;
  const numLat = Number(lat);
  const numLng = Number(lng);
  if (isNaN(numLat) || isNaN(numLng)) return null;

  const cacheKey = `${numLat.toFixed(5)},${numLng.toFixed(5)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}&zoom=18&addressdetails=1`,
      {
        headers: { "Accept-Language": "id" },
        signal: controller.signal,
      },
    );
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error("Gagal mengambil data geocode");
    const data = await res.json();
    const formatted = formatAlamatIndonesia(data);
    if (formatted) {
      geocodeCache.set(cacheKey, formatted);
      return formatted;
    }
  } catch {
    // Abaikan error jaringan/timeout
  }

  return null;
};

/**
 * Custom React Hook untuk mendapatkan alamat lengkap titik lokasi presensi
 */
export const useAlamatPresensi = (lat, lng, mode = "wfo", status = "hadir") => {
  const isLuarHadir =
    status === "izin" || status === "sakit" || status === "alfa" || status === "alpa";
  const cleanMode = String(mode || "wfo").toLowerCase();

  const getSyncAlamat = () => {
    if (isLuarHadir) return null;
    if (
      cleanMode === "wfo" &&
      (!lat || !lng || String(lat).trim() === "" || String(lng).trim() === "")
    ) {
      return ALAMAT_KANTOR_DISKOMINFO;
    }
    const numLat = Number(lat);
    const numLng = Number(lng);
    if (!isNaN(numLat) && !isNaN(numLng)) {
      const cacheKey = `${numLat.toFixed(5)},${numLng.toFixed(5)}`;
      if (geocodeCache.has(cacheKey)) {
        return geocodeCache.get(cacheKey);
      }
    }
    return cleanMode === "wfo" ? ALAMAT_KANTOR_DISKOMINFO : null;
  };

  const [asyncAlamat, setAsyncAlamat] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLuarHadir) return;
    if (!lat || !lng || String(lat).trim() === "" || String(lng).trim() === "") return;

    const numLat = Number(lat);
    const numLng = Number(lng);
    if (isNaN(numLat) || isNaN(numLng)) return;

    const cacheKey = `${numLat.toFixed(5)},${numLng.toFixed(5)}`;
    if (geocodeCache.has(cacheKey)) return;

    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) setLoading(true);
    }, 0);

    fetchAlamatLengkap(numLat, numLng)
      .then((hasil) => {
        if (isMounted && hasil) {
          setAsyncAlamat(hasil);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [lat, lng, isLuarHadir]);

  const syncAlamat = getSyncAlamat();
  const alamat = isLuarHadir ? null : asyncAlamat || syncAlamat;

  return { alamat, loading };
};
