import { useCallback, useEffect, useMemo, useState } from "react";
import PesertaLayout from "../../layouts/PesertaLayout";
import AbsenKameraModal from "../../components/manajemen/peserta/presensi/AbsenKameraModal";
import {
  getStatusPresensiHariIni,
  getHariLibur,
} from "../../services/pesertaService";
import { getMe } from "../../services/authService";
import { isMagangSelesai } from "../../utils/authStorage";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import { getFileUrl } from "../../utils/fileUrl";
import { toastError } from "../../utils/swal";
import {
  Fingerprint,
  AlarmClock,
  Clock,
  Camera,
  Radio,
  MapPin,
  CheckCircle2,
  CircleCheckBig,
  CircleAlert,
  AlertCircle,
  AlertTriangle,
  Lock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  ClipboardList,
  CalendarDays,
  UserCheck,
  Loader2,
  Navigation,
  Crosshair,
  Info,
  Timer,
  NotebookPen,
  LogIn,
  Check,
  Briefcase,
  Layers,
  IdCard,
  Phone,
  Building2,
  Home,
  Car,
  SunMedium,
  ScanFace,
  CalendarOff,
} from "lucide-react";

const BULAN_PANJANG_KALENDER = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const BULAN_SHORT_KALENDER = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

// Target Koordinat Resmi Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo
const DISKOMINFO_LAT = -7.86834;
const DISKOMINFO_LNG = 111.46512;
const DISKOMINFO_NAMA_RESMI = "Dinas Komunikasi, Informatika dan Statistik Kabupaten Ponorogo";
const DISKOMINFO_ALAMAT_RESMI = "Jl. Ir. H. Juanda No. 198, Tonatan, Kec. Ponorogo";
const RADIUS_TOLERANSI_METER = 100;

// Haversine Distance Helper (meter)
const hitungJarakMeter = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const formatJarakHuman = (meter) => {
  if (meter >= 1000) {
    return `${(meter / 1000).toFixed(1)} km`;
  }
  return `${meter} meter`;
};

const formatWibDateLong = (date) => {
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(date);

  const weekday = parts.find((p) => p.type === "weekday")?.value?.toUpperCase() || "HARI";
  const day = parts.find((p) => p.type === "day")?.value || "01";
  const month = parts.find((p) => p.type === "month")?.value?.toUpperCase() || "BULAN";
  const year = parts.find((p) => p.type === "year")?.value || "2026";

  return `${weekday}, ${day} ${month} ${year}`;
};

const formatWibTime = (date) => {
  return date
    .toLocaleTimeString("id-ID", {
      timeZone: "Asia/Jakarta",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/\./g, ":");
};

const hitungJamMasukSelesai = (jamMasukStr, toleransiMenit = 30) => {
  if (!jamMasukStr) return "08:00";
  const [h, m] = jamMasukStr.split(":").map(Number);
  const total = h * 60 + m + Number(toleransiMenit || 0);
  const endH = String(Math.floor(total / 60) % 24).padStart(2, "0");
  const endM = String(total % 60).padStart(2, "0");
  return `${endH}:${endM}`;
};

const formatAlamatIndonesia = (data) => {
  if (!data || !data.address) {
    return {
      judul: "Lokasi di Luar Ponorogo",
      detail: data?.display_name || "Alamat tidak dapat ditentukan",
    };
  }

  const addr = data.address;
  const jalan = addr.road || addr.street || addr.residential || "";

  let kelurahan = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || "";
  if (/^r[tw]\s*\d+/i.test(kelurahan)) {
    kelurahan = addr.village || addr.suburb || "";
  }

  const kecamatan =
    addr.city_district ||
    addr.district ||
    addr.subdistrict ||
    addr.municipality ||
    "";

  const kota =
    addr.city ||
    addr.town ||
    addr.county ||
    addr.regency ||
    addr.state_district ||
    "";

  const provinsi = addr.state || "";

  const judul = (() => {
    if (jalan) return jalan;
    if (kecamatan && kota) return `${kecamatan.replace(/^kecamatan\s*/i, "Kec. ")}, ${kota}`;
    if (kelurahan && kota) return `${kelurahan.replace(/^kelurahan\s*/i, "Kel. ")}, ${kota}`;
    if (kota && provinsi) return `${kota}, ${provinsi}`;
    return data.name || kota || "Lokasi di Luar Ponorogo";
  })();

  const bagianAlamat = [];
  if (jalan) bagianAlamat.push(jalan);
  if (kelurahan && !/^r[tw]\s*\d+/i.test(kelurahan)) {
    bagianAlamat.push(
      kelurahan.toLowerCase().startsWith("kel")
        ? kelurahan
        : `Kel. ${kelurahan.replace(/^kelurahan\s*/i, "")}`
    );
  }
  if (kecamatan) {
    bagianAlamat.push(
      kecamatan.toLowerCase().startsWith("kec")
        ? kecamatan
        : `Kec. ${kecamatan.replace(/^kecamatan\s*/i, "")}`
    );
  }
  if (kota) bagianAlamat.push(kota);
  if (provinsi) bagianAlamat.push(provinsi);

  const detail = bagianAlamat.length > 0 ? bagianAlamat.join(", ") : data.display_name;

  return { judul, detail };
};

const toTitleCase = (str) => {
  if (!str) return "";
  return String(str).replace(/\b\w/g, (char) => char.toUpperCase());
};

const getDetailInfoLibur = (statusData, liburList) => {
  const isHariKerja = statusData?.hari_kerja !== false;
  if (isHariKerja) {
    return {
      isHoliday: false,
      kategori: "",
      labelBanner: "",
      namaLibur: "",
      alasanDisplay: "",
    };
  }

  const alasanRaw = (statusData?.alasan || "").trim();
  const tglToday = statusData?.tanggal || new Date().toISOString().slice(0, 10);
  const matchHoliday = (liburList || []).find((l) => l.tanggal === tglToday);

  let kategori = "Hari Libur";
  let labelBanner = "Libur";
  let namaLibur = "";

  if (alasanRaw.toLowerCase().includes("akhir pekan")) {
    kategori = "Akhir Pekan";
    labelBanner = "Akhir Pekan";
    namaLibur = "Libur Akhir Pekan";
  } else if (matchHoliday) {
    const isNasional = matchHoliday.tipe === "nasional";
    kategori = isNasional ? "Libur Nasional" : "Libur Instansi";
    labelBanner = isNasional ? "Libur Nasional" : "Libur Instansi";
    namaLibur = matchHoliday.nama;
  } else if (alasanRaw.toLowerCase().startsWith("hari libur:")) {
    const parsedNama = alasanRaw.replace(/^hari libur:\s*/i, "").trim();
    kategori = "Libur Nasional";
    labelBanner = "Libur Nasional";
    namaLibur = parsedNama;
  } else if (alasanRaw.toLowerCase().includes("diliburkan") || alasanRaw.toLowerCase().includes("admin")) {
    kategori = "Libur Instansi";
    labelBanner = "Libur Instansi";
    namaLibur = "Diliburkan Khusus Instansi";
  } else if (alasanRaw) {
    kategori = toTitleCase(alasanRaw);
    labelBanner = toTitleCase(alasanRaw);
    namaLibur = toTitleCase(alasanRaw);
  }

  return {
    isHoliday: true,
    kategori: toTitleCase(kategori),
    labelBanner: toTitleCase(labelBanner),
    namaLibur: toTitleCase(namaLibur || kategori),
    alasanDisplay: toTitleCase(namaLibur || alasanRaw || kategori),
  };
};

const formatDurasiWaktuIndo = (menitTotal) => {
  const m = Math.abs(Number(menitTotal || 0));
  if (m < 60) {
    return `${m} Menit`;
  }
  const jam = Math.floor(m / 60);
  const sisaMenit = m % 60;
  if (sisaMenit === 0) {
    return `${jam} Jam`;
  }
  return `${jam} Jam ${sisaMenit} Menit`;
};

const getJadwalMasukStatus = (
  currentTime,
  jamMasukBukaStr = "06:00",
  jamMasukSelesaiStr = "08:00",
  jamMasukRecorded = null,
  statusPresensi = null,
  menitTerlambat = 0
) => {
  if (jamMasukRecorded) {
    const isLate = statusPresensi === "terlambat" || menitTerlambat > 0;
    const durasiStr = formatDurasiWaktuIndo(menitTerlambat);
    return {
      type: isLate ? "terlambat" : "ontime",
      jamBuka: jamMasukBukaStr || "06:00",
      jamBatas: jamMasukSelesaiStr || "08:00",
      labelDetail: isLate
        ? `(Terlambat ${durasiStr} - Masuk ${jamMasukRecorded.slice(0, 5)} WIB)`
        : `(Tepat Waktu - Masuk ${jamMasukRecorded.slice(0, 5)} WIB)`,
      labelColorClass: isLate ? "text-amber-700 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400",
      isLate,
      isDone: true,
      isBuka: true,
      badgeClass: isLate
        ? "bg-amber-50/90 dark:bg-amber-950/40 text-slate-800 dark:text-slate-200 border-amber-200/80 dark:border-amber-800/50"
        : "bg-emerald-50/90 dark:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border-emerald-200/80 dark:border-emerald-800/50",
      iconClass: isLate ? "text-amber-500" : "text-emerald-500",
    };
  }

  const [bukaH, bukaM] = (jamMasukBukaStr || "06:00").split(":").map(Number);
  const bukaMin = (bukaH || 6) * 60 + (bukaM || 0);

  const [endH, endM] = (jamMasukSelesaiStr || "08:00").split(":").map(Number);
  const targetMin = (endH || 8) * 60 + (endM || 0);

  const wibHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      hour12: false,
    }).format(currentTime)
  );
  const wibMinute = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      minute: "numeric",
    }).format(currentTime)
  );
  const currentMin = wibHour * 60 + wibMinute;

  // Cek jika belum masuk jam buka presensi pagi (misal < 06:00 WIB)
  if (currentMin < bukaMin) {
    const diffBuka = bukaMin - currentMin;
    const durasiStr = formatDurasiWaktuIndo(diffBuka);
    return {
      type: "belum_buka",
      jamBuka: jamMasukBukaStr || "06:00",
      jamBatas: jamMasukSelesaiStr || "08:00",
      labelDetail: `(Dibuka dalam ${durasiStr})`,
      labelColorClass: "text-amber-600 dark:text-amber-400",
      isLate: false,
      isDone: false,
      isBuka: false,
      badgeClass:
        "bg-slate-50/90 dark:bg-white/[0.03] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10",
      iconClass: "text-slate-400",
    };
  }

  const diffMin = targetMin - currentMin;

  if (diffMin > 0) {
    const durasiStr = formatDurasiWaktuIndo(diffMin);
    return {
      type: "sisa",
      jamBuka: jamMasukBukaStr || "06:00",
      jamBatas: jamMasukSelesaiStr || "08:00",
      labelDetail: `(Sisa ${durasiStr})`,
      labelColorClass: "text-emerald-600 dark:text-emerald-400",
      isLate: false,
      isDone: false,
      isBuka: true,
      badgeClass:
        "bg-slate-50/90 dark:bg-white/[0.03] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10",
      iconClass: "text-amber-500",
    };
  } else {
    const lewatMin = Math.abs(diffMin);
    const durasiStr = formatDurasiWaktuIndo(lewatMin);
    return {
      type: "lewat",
      jamBuka: jamMasukBukaStr || "06:00",
      jamBatas: jamMasukSelesaiStr || "08:00",
      labelDetail: `(Lewat ${durasiStr})`,
      labelColorClass: "text-amber-600 dark:text-amber-400",
      isLate: true,
      isDone: false,
      isBuka: true,
      badgeClass:
        "bg-amber-50/80 dark:bg-amber-950/30 text-slate-800 dark:text-slate-200 border-amber-200/70 dark:border-amber-900/40",
      iconClass: "text-amber-500",
    };
  }
};

const getJadwalPulangStatus = (
  currentTime,
  jamPulangStr = "15:30",
  jamPulangRecorded = null
) => {
  if (jamPulangRecorded) {
    return {
      type: "selesai",
      jamBuka: jamPulangStr || "15:30",
      labelDetail: `(Presensi Tercatat ${jamPulangRecorded.slice(0, 5)} WIB)`,
      labelColorClass: "text-emerald-600 dark:text-emerald-400",
      badgeClass:
        "bg-emerald-50/90 dark:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border-emerald-200/80 dark:border-emerald-800/50",
      iconClass: "text-emerald-500",
    };
  }

  const [pulangH, pulangM] = (jamPulangStr || "15:30").split(":").map(Number);
  const targetMin = (pulangH || 15) * 60 + (pulangM || 30);

  const wibHour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      hour: "numeric",
      hour12: false,
    }).format(currentTime)
  );
  const wibMinute = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      minute: "numeric",
    }).format(currentTime)
  );
  const currentMin = wibHour * 60 + wibMinute;

  const diffMin = targetMin - currentMin;

  if (diffMin > 0) {
    const durasiStr = formatDurasiWaktuIndo(diffMin);
    return {
      type: "belum_buka",
      jamBuka: jamPulangStr || "15:30",
      labelDetail: `(Dibuka dalam ${durasiStr})`,
      labelColorClass: "text-amber-600 dark:text-amber-400",
      badgeClass:
        "bg-slate-50/90 dark:bg-white/[0.03] text-slate-700 dark:text-slate-200 border-slate-200/80 dark:border-white/10",
      iconClass: "text-amber-500",
    };
  } else {
    return {
      type: "sudah_buka",
      jamBuka: jamPulangStr || "15:30",
      labelDetail: "(Sesi Sedang Dibuka)",
      labelColorClass: "text-emerald-600 dark:text-emerald-400",
      badgeClass:
        "bg-emerald-50/80 dark:bg-emerald-950/30 text-slate-800 dark:text-slate-200 border-emerald-200/70 dark:border-emerald-900/40",
      iconClass: "text-emerald-500",
    };
  }
};

const getInitials = (nama) =>
  (nama || "?")
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

export const PesertaPresensiLogbookPage = () => {
  const { isDark } = useManajemenTheme();
  const readOnly = isMagangSelesai();

  // State Presensi
  const [status, setStatus] = useState(null);
  const [mentorData, setMentorData] = useState(null);

  // Pilihan Mode Kehadiran di Card Awal (WFO / WFH / Dinas Luar)
  const [selectedMode, setSelectedMode] = useState(null);

  // Isian Logbook Kegiatan Harian langsung di Card Pulang
  const [logbookHarian, setLogbookHarian] = useState("");

  // State Kalender Libur
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [liburList, setLiburList] = useState([]);

  // UI State
  const [absenModal, setAbsenModal] = useState(null); // "masuk" | "pulang"
  const [reloadKey, setReloadKey] = useState(0);

  // Live Clock (WIB)
  const [currentTime, setCurrentTime] = useState(new Date());

  // Geolocation Radius State
  const [geoState, setGeoState] = useState(() => {
    const hasGeo = typeof navigator !== "undefined" && Boolean(navigator.geolocation);
    if (!hasGeo) {
      return {
        status: "error",
        lat: null,
        lng: null,
        akurasi: null,
        jarak: null,
        lokasiNama: "Fitur GPS Tidak Didukung",
        alamatDetail: "Browser atau perangkat Anda tidak mendukung fitur pendeteksi geolokasi GPS.",
        keteranganJarak: "Lokasi tidak dapat divalidasi",
      };
    }
    return {
      status: "memeriksa",
      lat: null,
      lng: null,
      akurasi: null,
      jarak: null,
      lokasiNama: "",
      alamatDetail: "",
      keteranganJarak: "",
    };
  });
  const [geoProgress, setGeoProgress] = useState(0);

  // Ticking Clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Hari Libur
  useEffect(() => {
    let isMounted = true;
    const loadLibur = async () => {
      try {
        const res = await getHariLibur({ tahun: String(calYear) });
        if (isMounted) {
          setLiburList(res.data?.data || []);
        }
      } catch {
        // Abaikan jika ada kegagalan fetch libur
      }
    };

    const timer = setTimeout(() => {
      loadLibur();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [calYear]);

  const goCalMonth = (delta) => {
    let m = calMonth + delta;
    let y = calYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setCalMonth(m);
    if (y !== calYear) {
      setCalYear(y);
    }
  };

  const calFirstWeekday = new Date(calYear, calMonth, 1).getDay(); // 0=Minggu
  const calDaysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const liburByDay = useMemo(() => {
    const map = {};
    liburList.forEach((item) => {
      const [y, m, d] = (item.tanggal || "").split("-").map(Number);
      if (y === calYear && m - 1 === calMonth) {
        map[d] = item;
      }
    });
    return map;
  }, [liburList, calYear, calMonth]);

  const todayObj = new Date();
  const isTodayCell = (d) =>
    todayObj.getFullYear() === calYear &&
    todayObj.getMonth() === calMonth &&
    todayObj.getDate() === d;

  const upcomingLibur = useMemo(() => {
    const today0 = new Date();
    today0.setHours(0, 0, 0, 0);
    return liburList
      .filter((l) => {
        const [y, m, d] = (l.tanggal || "").split("-").map(Number);
        return y && new Date(y, m - 1, d) >= today0;
      })
      .sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal))[0] || null;
  }, [liburList]);

  // Live Geolocation Tracker dengan animasi progress dari 0% yang berdurasi 7.5 detik
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let isMounted = true;
    const startTime = Date.now();
    const MIN_LOADING_MS = 7500; // Durasi loading 7.5 detik

    const progressTimer = setInterval(() => {
      setGeoProgress((prev) => {
        if (prev < 20) return Math.min(20, +(prev + 1.0).toFixed(1));
        if (prev < 45) return Math.min(45, +(prev + 0.9).toFixed(1));
        if (prev < 70) return Math.min(70, +(prev + 0.8).toFixed(1));
        if (prev < 90) return Math.min(90, +(prev + 0.7).toFixed(1));
        if (prev < 97) return Math.min(97, +(prev + 0.35).toFixed(1));
        return prev;
      });
    }, 75);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const userLat = pos.coords.latitude;
        const userLng = pos.coords.longitude;
        const akurasi = Math.round(pos.coords.accuracy || 4);
        const jarak = hitungJarakMeter(userLat, userLng, DISKOMINFO_LAT, DISKOMINFO_LNG);

        let finalData = null;

        if (jarak <= RADIUS_TOLERANSI_METER) {
          finalData = {
            status: "terverifikasi",
            lat: userLat,
            lng: userLng,
            akurasi: akurasi || 4,
            jarak: jarak,
            lokasiNama: DISKOMINFO_NAMA_RESMI,
            alamatDetail: `${DISKOMINFO_ALAMAT_RESMI}, Kabupaten Ponorogo, Jawa Timur`,
            keteranganJarak:
              jarak > 0
                ? `Berada di zona kantor dinas (±${jarak} m dari titik pusat dinas)`
                : `Berada di zona kantor dinas (${DISKOMINFO_NAMA_RESMI})`,
          };
        } else {
          const formatted = formatJarakHuman(jarak);
          let lokasiNama = "Di Luar Area Diskominfo Ponorogo";
          let alamatDetail = "Mendeteksi nama jalan dan wilayah posisi saat ini...";

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&zoom=16`,
              { headers: { "Accept-Language": "id" } }
            );
            const data = await res.json();
            const { judul, detail } = formatAlamatIndonesia(data);
            if (judul) lokasiNama = judul;
            if (detail) alamatDetail = detail;
          } catch {
            // Fallback jika nominatim timeout
          }

          finalData = {
            status: "luar_radius",
            lat: userLat,
            lng: userLng,
            akurasi: akurasi || 10,
            jarak: jarak,
            lokasiNama,
            alamatDetail,
            keteranganJarak: `Berjarak ±${formatted} dari ${DISKOMINFO_NAMA_RESMI}`,
          };
        }

        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_MS - elapsed);

        setTimeout(() => {
          if (!isMounted) return;
          clearInterval(progressTimer);
          setGeoProgress(100);

          setTimeout(() => {
            if (!isMounted) return;
            setGeoState(finalData);
          }, 550);
        }, remainingTime);
      },
      () => {
        const elapsed = Date.now() - startTime;
        const remainingTime = Math.max(0, MIN_LOADING_MS - elapsed);

        setTimeout(() => {
          if (!isMounted) return;
          clearInterval(progressTimer);
          setGeoProgress(100);

          setTimeout(() => {
            if (!isMounted) return;
            setGeoState({
              status: "error",
              lat: null,
              lng: null,
              akurasi: null,
              jarak: null,
              lokasiNama: "Izin Akses Lokasi Ditolak / Tidak Aktif",
              alamatDetail: "Aktifkan izin lokasi browser pada perangkat Anda agar sistem dapat memvalidasi posisi presensi.",
              keteranganJarak: "Lokasi tidak dapat divalidasi tanpa akses GPS",
            });
          }, 550);
        }, remainingTime);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );

    return () => {
      isMounted = false;
      clearInterval(progressTimer);
    };
  }, []);

  // Fetch Presensi & Status Hari Ini
  const fetchPresensi = useCallback(async () => {
    try {
      const [resStatus, resMe] = await Promise.all([
        getStatusPresensiHariIni(),
        getMe().catch(() => ({ data: { data: null } })),
      ]);
      const statusData = resStatus.data?.data || null;
      setStatus(statusData);

      const meData = resMe.data?.data || null;
      if (meData?.pendaftaran?.mentor) {
        setMentorData(meData.pendaftaran.mentor);
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal memuat data presensi.");
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) fetchPresensi();
    }, 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [fetchPresensi, reloadKey]);

  const isHariKerja = status?.hari_kerja !== false;
  const infoLibur = useMemo(() => getDetailInfoLibur(status, liburList), [status, liburList]);
  const jamMasukBuka = status?.jam_kerja?.jam_masuk_buka || "06:00";
  const jamMasukMulai = status?.jam_kerja?.jam_masuk ? status.jam_kerja.jam_masuk.slice(0, 5) : (status?.jadwal?.jam_masuk || "07:30");
  const toleransiTerlambat = status?.jam_kerja?.toleransi_terlambat ?? (status?.jadwal?.toleransi_keterlambatan || 30);
  const jamMasukSelesai = hitungJamMasukSelesai(jamMasukMulai, toleransiTerlambat);
  const jadwalMasukInfo = useMemo(
    () =>
      getJadwalMasukStatus(
        currentTime,
        jamMasukBuka,
        jamMasukSelesai,
        status?.jam_masuk,
        status?.status,
        status?.menit_terlambat || 0
      ),
    [currentTime, jamMasukBuka, jamMasukSelesai, status?.jam_masuk, status?.status, status?.menit_terlambat]
  );
  const isSudahWaktunyaMasuk = !isHariKerja
    ? false
    : jadwalMasukInfo.type !== "belum_buka" || Boolean(status?.jam_masuk);
  const jamPulang = status?.jam_kerja?.jam_pulang ? status.jam_kerja.jam_pulang.slice(0, 5) : (status?.jadwal?.jam_pulang || "15:30");
  const jadwalPulangInfo = useMemo(
    () => getJadwalPulangStatus(currentTime, jamPulang, status?.jam_pulang),
    [currentTime, jamPulang, status?.jam_pulang]
  );
  const isSudahWaktunyaPulang = !isHariKerja
    ? false
    : jadwalPulangInfo.type !== "belum_buka" || Boolean(status?.jam_pulang);
  const isLogbookTerisi = logbookHarian.trim().length > 0;

  return (
    <PesertaLayout>
      <div className="space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Header Bar */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Presensi &amp; Logbook Magang Harian
          </h2>
          <p className={`mt-1 text-xs sm:text-[13px] max-w-5xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            {readOnly
              ? "Masa magang Anda telah selesai. Anda dapat meninjau seluruh riwayat kehadiran Anda di halaman Riwayat Aktivitas."
              : "Catat kehadiran datang dan kepulangan magang Anda di Diskominfo Kab. Ponorogo, isi jurnal aktivitas harian, serta pantau jam dinas pekan ini."}
          </p>
        </div>

        {/* HERO CARD: JAM DIGITAL LIVE & VALIDASI RADIUS DISKOMINFO */}
        {!readOnly && (
          <div
            className={`relative w-full max-w-full overflow-hidden rounded-2xl sm:rounded-3xl border shadow-xl transition-all duration-300 p-4 sm:px-6 sm:py-4.5 ${
              isDark
                ? "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#122B70] border-white/10 text-white"
                : "bg-gradient-to-br from-[#060D2A] via-[#0B1A4C] to-[#003882] border-blue-900/40 text-white"
            }`}
          >
            {/* Ambient Glows & Radial Dot Matrix */}
            <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
            <div className="absolute right-60 -bottom-16 h-40 w-40 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
            <div className="absolute -left-10 -bottom-10 h-36 w-36 rounded-full bg-white/5 blur-2xl pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

            {/* Watermark Icon Presensi */}
            <Fingerprint
              className="pointer-events-none absolute right-2 sm:right-6 lg:right-10 top-1/2 -translate-y-1/2 w-60 h-60 sm:w-72 sm:h-72 lg:w-[310px] lg:h-[310px] xl:w-[340px] xl:h-[340px] text-white opacity-[0.065] sm:opacity-[0.075] rotate-12"
              strokeWidth={1.2}
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 lg:gap-7">
              {/* Left: Tanggal, Live Clock, 3 Kapsul Jam Kerja Dinas */}
              <div className="space-y-2.5 flex-1 min-w-0">
                <div className="inline-flex flex-wrap items-center gap-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-sky-200 tracking-wider uppercase shadow-xs transition-colors">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isHariKerja ? "bg-emerald-400" : "bg-amber-400"} opacity-75`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isHariKerja ? "bg-emerald-400" : "bg-amber-400"}`} />
                  </span>
                  <span>{formatWibDateLong(currentTime)}</span>
                  {!isHariKerja && (
                    <span className="text-[10px] sm:text-[10.5px] text-amber-300 font-extrabold normal-case bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-400/30 capitalize tracking-normal">
                      {infoLibur.alasanDisplay}
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-2.5 my-1 sm:my-1.5">
                  <span className="text-4xl sm:text-5xl lg:text-[50px] xl:text-[56px] font-black tracking-tight text-white font-mono drop-shadow-[0_4px_16px_rgba(0,165,236,0.25)] leading-none">
                    {formatWibTime(currentTime)}
                  </span>
                  <span className="text-white font-black text-sm sm:text-base lg:text-lg tracking-wider select-none drop-shadow-xs">
                    WIB
                  </span>
                </div>

                {/* 3 Info Tiles Jadwal Presensi */}
                <div className="grid grid-cols-1 sm:grid-cols-[1.05fr_1fr_0.95fr] gap-2 pt-0.5 w-full">
                  <div className="group flex items-center gap-2 p-2 sm:px-2.5 sm:py-2 rounded-xl bg-black/30 hover:bg-black/45 border border-sky-400/25 hover:border-sky-400/45 backdrop-blur-md shadow-xs transition-all duration-200">
                    <div className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/30 shrink-0 shadow-inner">
                      <LogIn className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sky-200/75 font-semibold text-[10px] uppercase tracking-wide truncate">Presensi Masuk</div>
                      <div className="text-white font-black text-[11px] sm:text-xs xl:text-[12px] tracking-tight whitespace-nowrap capitalize">
                        {isHariKerja ? `${jamMasukMulai} – ${jamMasukSelesai} WIB` : infoLibur.labelBanner}
                      </div>
                    </div>
                  </div>

                  <div className="group flex items-center gap-2 p-2 sm:px-2.5 sm:py-2 rounded-xl bg-black/30 hover:bg-black/45 border border-amber-400/25 hover:border-amber-400/45 backdrop-blur-md shadow-xs transition-all duration-200">
                    <div className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/30 shrink-0 shadow-inner">
                      <LogOut className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-amber-200/75 font-semibold text-[10px] uppercase tracking-wide truncate">Presensi Pulang</div>
                      <div className="text-white font-black text-[11px] sm:text-xs xl:text-[12px] tracking-tight whitespace-nowrap capitalize">
                        {isHariKerja ? `Mulai ${jamPulang} WIB` : infoLibur.labelBanner}
                      </div>
                    </div>
                  </div>

                  <div className="group flex items-center gap-2 p-2 sm:px-2.5 sm:py-2 rounded-xl bg-black/30 hover:bg-black/45 border border-violet-400/25 hover:border-violet-400/45 backdrop-blur-md shadow-xs transition-all duration-200">
                    <div className="flex h-7 w-7 sm:h-7.5 sm:w-7.5 items-center justify-center rounded-lg bg-violet-500/20 text-violet-300 border border-violet-400/30 shrink-0 shadow-inner">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-violet-200/75 font-semibold text-[10px] uppercase tracking-wide truncate">
                        {isHariKerja ? "Toleransi" : "Status Hari Ini"}
                      </div>
                      <div className="text-white font-black text-[11px] sm:text-xs xl:text-[12px] tracking-tight truncate capitalize" title={!isHariKerja ? infoLibur.alasanDisplay : undefined}>
                        {isHariKerja ? `+${toleransiTerlambat} Menit` : infoLibur.alasanDisplay}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Validasi Radius Presensi Card */}
              <div className="bg-[#09143C]/90 border border-white/15 rounded-2xl p-3.5 sm:px-4 sm:py-3.5 backdrop-blur-xl shadow-2xl space-y-2.5 w-full lg:w-[580px] xl:w-[640px] 2xl:w-[670px] shrink-0">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-sky-200 text-xs sm:text-[12.5px] font-bold">
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-400">
                      <MapPin className="w-3.5 h-3.5" />
                    </span>
                    <span>Validasi Radius Presensi</span>
                  </div>
                  {geoState.status === "terverifikasi" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 shadow-xs">
                      <Check className="w-3 h-3" /> Di Area Kantor
                    </span>
                  ) : geoState.status === "luar_radius" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/40 shadow-xs">
                      <AlertTriangle className="w-3 h-3" /> Di Luar Radius
                    </span>
                  ) : geoState.status === "error" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-500/20 text-rose-300 border border-rose-400/40 shadow-xs">
                      <AlertCircle className="w-3 h-3" /> GPS Tidak Aktif
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-400/40 animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin text-sky-400" /> Memeriksa Lokasi...
                    </span>
                  )}
                </div>

                <div className="bg-black/25 rounded-xl px-3.5 py-2.5 border border-white/10 space-y-1.5">
                  {geoState.status === "memeriksa" ? (
                    <div className="py-0.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400 shrink-0" />
                          <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-sky-400 truncate">
                            Memeriksa Lokasi &amp; Radius GPS...
                          </span>
                        </div>
                        <span className="text-[10.5px] font-mono font-bold text-sky-300 shrink-0">
                          {Math.min(100, Math.round(geoProgress))}%
                        </span>
                      </div>
                      <p className="text-[11.5px] text-slate-300 leading-snug">
                        {geoProgress < 20
                          ? "Menginisialisasi modul GPS & mencari sinyal satelit..."
                          : geoProgress < 45
                          ? "Mendeteksi titik koordinat lintang & bujur perangkat Anda..."
                          : geoProgress < 70
                          ? "Memverifikasi data geolokasi & nama wilayah posisi Anda..."
                          : geoProgress < 90
                          ? "Menghitung jarak radius presensi ke kantor Diskominfo Ponorogo..."
                          : geoProgress < 100
                          ? "Menyelesaikan validasi kelayakan radius presensi..."
                          : "Validasi radius lokasi berhasil diselesaikan!"}
                      </p>
                      <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden mt-1 p-0.5">
                        <div
                          className="h-full bg-gradient-to-r from-sky-500 via-blue-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-xs"
                          style={{ width: `${Math.min(100, Math.round(geoProgress))}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="leading-snug">
                        <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-sky-400 mr-2 inline-block">
                          Lokasi Terdeteksi:
                        </span>
                        <span className="text-[13px] sm:text-[13.5px] font-extrabold text-white break-words" title={geoState.lokasiNama}>
                          {geoState.lokasiNama}
                        </span>
                      </div>

                      <p className="text-[11.5px] text-slate-300 leading-snug">
                        {geoState.alamatDetail}
                      </p>

                      <p className={`text-[11.5px] font-bold flex items-center gap-1.5 ${
                        geoState.status === "terverifikasi"
                          ? "text-emerald-300"
                          : geoState.status === "error"
                          ? "text-rose-300"
                          : "text-amber-300"
                      }`}>
                        <Navigation className="w-3.5 h-3.5 shrink-0" />
                        <span>{geoState.keteranganJarak}</span>
                      </p>
                    </>
                  )}
                </div>

                <div className="bg-black/35 rounded-xl px-3 py-1.5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11.5px] text-blue-200/90">
                  <div className="flex items-center gap-1.5 font-mono" title="Titik koordinat garis lintang dan bujur dari GPS Anda">
                    <Crosshair className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>
                      Titik GPS:{" "}
                      {geoState.lat != null && geoState.lng != null ? (
                        <strong className="text-white font-semibold">
                          Lat {geoState.lat.toFixed(5)}, Long {geoState.lng.toFixed(5)}
                        </strong>
                      ) : geoState.status === "memeriksa" ? (
                        <span className="text-sky-300 animate-pulse font-normal">Mendeteksi koordinat...</span>
                      ) : (
                        <span className="text-slate-400 font-normal">Tidak Terdeteksi</span>
                      )}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1.5 font-bold ${
                    geoState.status === "terverifikasi"
                      ? "text-emerald-400"
                      : geoState.status === "luar_radius"
                      ? "text-amber-400"
                      : geoState.status === "error"
                      ? "text-rose-400"
                      : "text-sky-300"
                  }`} title="Estimasi tingkat presisi sinyal GPS">
                    <Radio className="w-3 h-3 shrink-0" />
                    <span>
                      {geoState.akurasi != null ? (
                        `Akurasi GPS: ±${geoState.akurasi} m`
                      ) : geoState.status === "memeriksa" ? (
                        "Mengukur sinyal GPS..."
                      ) : (
                        "Akurasi: Tidak Tersedia"
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DUA CARD PRESENSI: PRESENSI MASUK & PRESENSI PULANG + FORM LOGBOOK */}
        {!readOnly && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {/* CARD 1: PRESENSI DATANG (PRESENSI MASUK PAGI) */}
            <div
              className={`rounded-3xl border p-5 sm:p-6 transition-all duration-300 flex flex-col justify-start gap-3.5 relative overflow-hidden shadow-xs hover:shadow-md ${
                isDark
                  ? "bg-gradient-to-b from-[#161b22] to-[#12161c] border-white/10"
                  : "bg-gradient-to-b from-white to-slate-50/60 border-slate-200/80"
              }`}
            >
              {/* Header Card (Tanpa Garis Sekat Pemisah) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
                        status?.jam_masuk
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 shadow-2xs"
                          : "bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border-blue-100 dark:border-sky-900/40 shadow-2xs"
                      }`}
                    >
                      {status?.jam_masuk ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <AlarmClock className="w-5 h-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                        status?.jam_masuk
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[#004F9F] dark:text-[#00A5EC]"
                      }`}>
                        PRESENSI DATANG
                      </p>
                      <h4 className={`text-base sm:text-lg font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Presensi Masuk Pagi
                      </h4>
                    </div>
                  </div>

                  {/* Status Indicator Kanan Atas */}
                  {status?.jam_masuk ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Hadir ({status.jam_masuk.slice(0, 5)} WIB)</span>
                    </span>
                  ) : !isHariKerja ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0 shadow-2xs">
                      <CalendarOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Libur ({infoLibur.labelBanner})</span>
                    </span>
                  ) : status?.status === "izin" || status?.status === "sakit" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0 shadow-2xs">
                      Izin Resmi
                    </span>
                  ) : !isSudahWaktunyaMasuk ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Sesi Belum Dibuka</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-sky-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 border border-sky-200/80 dark:border-sky-800/60 shrink-0 shadow-2xs">
                      <span className="flex h-2 w-2 rounded-full bg-[#00A5EC] animate-pulse" />
                      <span>Siap Presensi Masuk</span>
                    </span>
                  )}
                </div>

                {/* Batch Jadwal / Batas Presensi Masuk */}
                <div>
                  {!isHariKerja ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-2xs bg-amber-50/90 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200/70 dark:border-amber-900/40">
                      <CalendarOff className="w-4 h-4 shrink-0 text-amber-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Status: <strong className={`font-black ${isDark ? "text-white" : "text-[#0B1442]"}`}>{infoLibur.alasanDisplay}</strong>
                      </span>
                    </div>
                  ) : !isSudahWaktunyaMasuk ? (
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-2xs transition-all ${jadwalMasukInfo.badgeClass}`}
                    >
                      <Timer className={`w-4 h-4 shrink-0 ${jadwalMasukInfo.iconClass}`} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Jadwal Dibuka:{" "}
                        <strong className={`font-black ${isDark ? "text-white" : "text-[#0B1442]"}`}>
                          {jadwalMasukInfo.jamBuka} WIB
                        </strong>
                      </span>
                      <span className={`font-bold ${jadwalMasukInfo.labelColorClass}`}>
                        {jadwalMasukInfo.labelDetail}
                      </span>
                    </div>
                  ) : (
                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-2xs transition-all ${jadwalMasukInfo.badgeClass}`}
                    >
                      <Timer className={`w-4 h-4 shrink-0 ${jadwalMasukInfo.iconClass}`} />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Batas:{" "}
                        <strong className={`font-black ${isDark ? "text-white" : "text-[#0B1442]"}`}>
                          {jadwalMasukInfo.jamBatas} WIB
                        </strong>
                      </span>
                      <span
                        className={`font-bold ${
                          jadwalMasukInfo.isDone && !jadwalMasukInfo.isLate
                            ? "text-emerald-600 dark:text-emerald-400"
                            : jadwalMasukInfo.isLate
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {jadwalMasukInfo.labelDetail}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Banner Kategori Jenis Kehadiran Langsung di Card Awal */}
              <div
                className={`rounded-2xl p-3.5 sm:p-4 border space-y-3 transition-all duration-200 ${
                  isDark
                    ? "bg-white/[0.02] border-white/10"
                    : "bg-slate-50/80 border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 shadow-2xs">
                      <Layers className="w-3.5 h-3.5" />
                    </span>
                    <p className={`text-xs sm:text-[12.5px] font-black ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                      Kategori Jenis Kehadiran
                    </p>
                  </div>
                  {selectedMode ? (
                    selectedMode === "wfo" && geoState?.status !== "terverifikasi" ? (
                      <span className="text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-200 dark:border-rose-800 shadow-2xs">
                        WFO Di Luar Radius
                      </span>
                    ) : (
                      <span className="text-[10px] font-black text-[#004F9F] dark:text-sky-300 bg-blue-50/90 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-blue-200/90 dark:border-sky-800 shadow-2xs">
                        {selectedMode === "wfo" ? "WFO Terpilih" : selectedMode === "wfh" ? "WFH Terpilih" : "Dinas Luar Terpilih"}
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-md border border-slate-200/80 dark:border-white/10">
                      Pilih Salah Satu
                    </span>
                  )}
                </div>

                {/* 3 Interactive Mode Cards (Warna Seragam Biru Brand, Merah Khusus Saat Eror WFO) */}
                <div className="grid grid-cols-3 gap-2">
                  {/* WFO (Kotak Berwarna Merah Jika Terpilih Saat Di Luar Radius) */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode((prev) => (prev === "wfo" ? null : "wfo"))}
                    disabled={!isHariKerja || !isSudahWaktunyaMasuk || Boolean(status?.jam_masuk)}
                    className={`relative rounded-xl border p-2.5 flex flex-col items-center text-center shadow-2xs transition-all ${
                      !isHariKerja || !isSudahWaktunyaMasuk || Boolean(status?.jam_masuk) ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } ${
                      selectedMode === "wfo"
                        ? geoState?.status !== "terverifikasi"
                          ? "border-rose-400 dark:border-rose-600 bg-rose-50/90 dark:bg-rose-950/60 text-rose-700 dark:text-rose-200 ring-2 ring-rose-400/40 scale-[1.02]"
                          : "border-[#004F9F] dark:border-[#00A5EC] bg-blue-50/90 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-200 ring-2 ring-[#00A5EC]/40 scale-[1.02]"
                        : isDark
                        ? "border-white/10 bg-[#161b22] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                        : "border-slate-200/90 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50/70"
                    }`}
                  >
                    {/* Floating Corner Badge */}
                    {selectedMode === "wfo" && (
                      <span className="absolute top-1.5 right-1.5 flex items-center justify-center">
                        {geoState?.status !== "terverifikasi" ? (
                          <CircleAlert className="w-4.5 h-4.5 text-rose-600 dark:text-rose-400 fill-rose-100/80 dark:fill-rose-950/90 shadow-2xs" />
                        ) : (
                          <CircleCheckBig className="w-4.5 h-4.5 text-[#004F9F] dark:text-[#00A5EC] fill-blue-100/70 dark:fill-sky-950/90 shadow-2xs" />
                        )}
                      </span>
                    )}

                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg mb-1 transition-colors ${
                        selectedMode === "wfo"
                          ? geoState?.status !== "terverifikasi"
                            ? "bg-rose-600 text-white"
                            : "bg-[#004F9F] dark:bg-[#00A5EC] text-white"
                          : "bg-blue-50 dark:bg-blue-950/60 text-[#004F9F] dark:text-sky-300"
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-[11px] font-black ${selectedMode === "wfo" && geoState?.status !== "terverifikasi" ? "text-rose-800 dark:text-rose-100" : ""}`}>
                      WFO
                    </span>
                    <span className={`text-[9px] font-medium leading-tight mt-0.5 ${selectedMode === "wfo" && geoState?.status !== "terverifikasi" ? "text-rose-600/90 dark:text-rose-300/90 font-semibold" : "text-slate-500 dark:text-slate-400"}`}>
                      Hadir di Kantor (≤100m)
                    </span>
                  </button>

                  {/* WFH (Warna Seragam Biru Brand Sama Persis) */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode((prev) => (prev === "wfh" ? null : "wfh"))}
                    disabled={!isHariKerja || !isSudahWaktunyaMasuk || Boolean(status?.jam_masuk)}
                    className={`relative rounded-xl border p-2.5 flex flex-col items-center text-center shadow-2xs transition-all ${
                      !isHariKerja || !isSudahWaktunyaMasuk || Boolean(status?.jam_masuk) ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } ${
                      selectedMode === "wfh"
                        ? "border-[#004F9F] dark:border-[#00A5EC] bg-blue-50/90 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-200 ring-2 ring-[#00A5EC]/40 scale-[1.02]"
                        : isDark
                        ? "border-white/10 bg-[#161b22] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                        : "border-slate-200/90 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50/70"
                    }`}
                  >
                    {/* Floating Corner Badge */}
                    {selectedMode === "wfh" && (
                      <span className="absolute top-1.5 right-1.5 flex items-center justify-center">
                        <CircleCheckBig className="w-4.5 h-4.5 text-[#004F9F] dark:text-[#00A5EC] fill-blue-100/70 dark:fill-sky-950/90 shadow-2xs" />
                      </span>
                    )}

                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg mb-1 transition-colors ${
                        selectedMode === "wfh"
                          ? "bg-[#004F9F] dark:bg-[#00A5EC] text-white"
                          : "bg-blue-50 dark:bg-blue-950/60 text-[#004F9F] dark:text-sky-300"
                      }`}
                    >
                      <Home className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-black">WFH</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                      Tugas Mandiri / Remote
                    </span>
                  </button>

                  {/* Dinas Luar (Warna Seragam Biru Brand Sama Persis) */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode((prev) => (prev === "dinas_luar" ? null : "dinas_luar"))}
                    disabled={!isHariKerja || !isSudahWaktunyaMasuk || Boolean(status?.jam_masuk)}
                    className={`relative rounded-xl border p-2.5 flex flex-col items-center text-center shadow-2xs transition-all ${
                      !isHariKerja || !isSudahWaktunyaMasuk || Boolean(status?.jam_masuk) ? "cursor-not-allowed opacity-50" : "cursor-pointer"
                    } ${
                      selectedMode === "dinas_luar"
                        ? "border-[#004F9F] dark:border-[#00A5EC] bg-blue-50/90 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-200 ring-2 ring-[#00A5EC]/40 scale-[1.02]"
                        : isDark
                        ? "border-white/10 bg-[#161b22] text-slate-300 hover:border-white/20 hover:bg-white/[0.04]"
                        : "border-slate-200/90 bg-white text-slate-700 hover:border-blue-300 hover:bg-slate-50/70"
                    }`}
                  >
                    {/* Floating Corner Badge */}
                    {selectedMode === "dinas_luar" && (
                      <span className="absolute top-1.5 right-1.5 flex items-center justify-center">
                        <CircleCheckBig className="w-4.5 h-4.5 text-[#004F9F] dark:text-[#00A5EC] fill-blue-100/70 dark:fill-sky-950/90 shadow-2xs" />
                      </span>
                    )}

                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-lg mb-1 transition-colors ${
                        selectedMode === "dinas_luar"
                          ? "bg-[#004F9F] dark:bg-[#00A5EC] text-white"
                          : "bg-blue-50 dark:bg-blue-950/60 text-[#004F9F] dark:text-sky-300"
                      }`}
                    >
                      <Car className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[11px] font-black">Dinas Luar</span>
                    <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium leading-tight mt-0.5">
                      Tugas Lapangan Resmi
                    </span>
                  </button>
                </div>

                {/* Info / Alert Khusus Validasi Mode & Radius */}
                {selectedMode === "wfo" && geoState?.status !== "terverifikasi" ? (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-[11px] font-medium leading-relaxed shadow-2xs">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                    <div>
                      <p className="font-black text-[11.5px] text-rose-800 dark:text-rose-200">
                        Di Luar Radius Kantor Diskominfo ({formatJarakHuman(geoState?.jarak || 0)})
                      </p>
                      <p className="text-[10.5px] text-rose-600/90 dark:text-rose-300/90 mt-0.5 leading-relaxed">
                        Lokasi GPS Anda saat ini berjarak ±{formatJarakHuman(geoState?.jarak || 0)} dari kantor Diskominfo (batas toleransi presensi WFO adalah maksimal 100 meter). Silakan lakukan presensi di area kantor Diskominfo Kab. Ponorogo, atau pilih jenis kehadiran WFH / Dinas Luar jika Anda sedang bertugas di luar kantor.
                      </p>
                    </div>
                  </div>
                ) : selectedMode === "wfo" && geoState?.status === "terverifikasi" ? (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                    <p className="leading-relaxed">
                      Posisi GPS berhasil terverifikasi berada di area kantor Diskominfo Kab. Ponorogo (radius ±{formatJarakHuman(geoState?.jarak || 0)}). Anda memenuhi syarat untuk membuka kamera dan melakukan dokumentasi presensi masuk kerja di kantor hari ini.
                    </p>
                  </div>
                ) : selectedMode === "wfh" ? (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-50/80 dark:bg-sky-950/30 border border-blue-200/70 dark:border-sky-800/40 text-[#004F9F] dark:text-sky-300 text-[11px] font-semibold shadow-2xs">
                    <Info className="w-4 h-4 shrink-0 text-[#00A5EC] mt-0.5" />
                    <p className="leading-relaxed">
                      Kategori Work From Home (WFH) aktif untuk pelaksanaan penugasan dan pembelajaran mandiri secara remote. Pastikan Anda berada di lokasi penugasan yang ditentukan, bersiap mengambil swafoto presensi masuk, serta mengisi logbook kegiatan harian.
                    </p>
                  </div>
                ) : selectedMode === "dinas_luar" ? (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-blue-50/80 dark:bg-sky-950/30 border border-blue-200/70 dark:border-sky-800/40 text-[#004F9F] dark:text-sky-300 text-[11px] font-semibold shadow-2xs">
                    <Info className="w-4 h-4 shrink-0 text-[#00A5EC] mt-0.5" />
                    <p className="leading-relaxed">
                      Kategori Dinas Luar dipilih untuk berbagai agenda penugasan atau kegiatan di luar area kantor. Pastikan Anda siap mengambil dokumentasi swafoto di lokasi kegiatan dan mencatat rinciannya pada logbook harian.
                    </p>
                  </div>
                ) : !isSudahWaktunyaMasuk ? (
                  <p className="text-[10.5px] text-amber-600 dark:text-amber-400 font-semibold leading-relaxed">
                    Sesi presensi masuk belum dibuka. Anda dapat menentukan kategori kehadiran dan melakukan presensi masuk mulai pukul {jamMasukBuka} WIB.
                  </p>
                ) : (
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                    Silakan tentukan salah satu kategori kehadiran (WFO, WFH, atau Dinas Luar) di atas sesuai agenda kegiatan magang Anda hari ini untuk mengaktifkan tombol pembukaan kamera dan melakukan presensi masuk.
                  </p>
                )}
              </div>

              {/* Petunjuk Ringkas Kesiapan Presensi Masuk (Ukuran Kompak & Teks Penuh) */}
              <div
                className={`rounded-xl px-3 py-2 border transition-all duration-200 ${
                  isDark
                    ? "bg-white/[0.02] border-white/10"
                    : "bg-slate-50/80 border-slate-200/80"
                }`}
              >
                <div className="mb-1.5">
                  <span className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kesiapan Presensi Masuk
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] sm:text-[10.5px]">
                  <div
                    className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${
                      isDark
                        ? "bg-[#161b22]/70 border-white/5 text-slate-300"
                        : "bg-white border-slate-200/60 text-slate-600 shadow-2xs"
                    }`}
                  >
                    <SunMedium className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span className="leading-tight">Pastikan pencahayaan cukup &amp; wajah jelas</span>
                  </div>

                  <div
                    className={`px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${
                      isDark
                        ? "bg-[#161b22]/70 border-white/5 text-slate-300"
                        : "bg-white border-slate-200/60 text-slate-600 shadow-2xs"
                    }`}
                  >
                    <ScanFace className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="leading-tight">Posisikan wajah tegak &amp; tidak tertutup masker</span>
                  </div>
                </div>
              </div>

              {/* Action Button CTA Presensi Masuk (Pinned ke Bawah) */}
              <div className="space-y-3 mt-auto pt-1">
                {status?.jam_masuk ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800/60 cursor-default shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Presensi Masuk Selesai ({status.jam_masuk.slice(0, 5)} WIB)</span>
                  </button>
                ) : !isHariKerja ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-amber-200/80 dark:border-amber-900/40 cursor-not-allowed shadow-none"
                  >
                    <CalendarOff className="w-4 h-4 text-amber-500" />
                    <span>Hari Libur ({infoLibur.alasanDisplay}) - Presensi Ditutup</span>
                  </button>
                ) : status?.status === "izin" || status?.status === "sakit" ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-purple-200/80 dark:border-purple-900/40 cursor-not-allowed shadow-none"
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                    <span>Tercatat {status?.status?.toUpperCase()} Resmi (Presensi Ditutup)</span>
                  </button>
                ) : !isSudahWaktunyaMasuk ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/5 cursor-not-allowed shadow-none"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Sesi Presensi Masuk Dibuka Pukul {jamMasukBuka} WIB</span>
                  </button>
                ) : !selectedMode ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/5 cursor-not-allowed shadow-none"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Pilih Kategori Kehadiran Terlebih Dahulu</span>
                  </button>
                ) : selectedMode === "wfo" && geoState?.status !== "terverifikasi" ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 text-rose-400 dark:text-rose-500/80 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-rose-200/60 dark:border-rose-900/30 cursor-not-allowed shadow-none"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span>Di Luar Radius Diskominfo (WFO Dinonaktifkan)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAbsenModal("masuk")}
                    className="group/btn w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md border border-white/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-125 group-hover/btn:-rotate-12" />
                    <span>
                      Buka Kamera &amp; Lakukan Presensi Masuk ({selectedMode === "wfo" ? "WFO" : selectedMode === "wfh" ? "WFH" : "Dinas Luar"})
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* CARD 2: PRESENSI KEPULANGAN & LOGBOOK (PRESENSI PULANG) */}
            <div
              className={`rounded-3xl border p-5 sm:p-6 transition-all duration-300 flex flex-col justify-start gap-3.5 sm:gap-4 relative overflow-hidden shadow-xs hover:shadow-md ${
                isDark
                  ? "bg-gradient-to-b from-[#161b22] to-[#12161c] border-white/10"
                  : "bg-gradient-to-b from-white to-slate-50/60 border-slate-200/80"
              }`}
            >
              {/* Header Card (Tanpa Garis Sekat Pemisah) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`flex h-10.5 w-10.5 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${
                        status?.jam_pulang
                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60 shadow-2xs"
                          : "bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border-blue-100 dark:border-sky-900/40 shadow-2xs"
                      }`}
                    >
                      {status?.jam_pulang ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <LogOut className="w-5 h-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className={`text-[10px] sm:text-[11px] font-black uppercase tracking-wider ${
                        status?.jam_pulang
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-[#004F9F] dark:text-[#00A5EC]"
                      }`}>
                        PRESENSI KEPULANGAN
                      </p>
                      <h4 className={`text-base sm:text-lg font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Presensi Pulang &amp; Logbook
                      </h4>
                    </div>
                  </div>

                  {/* Status Indicator Kanan Atas */}
                  {status?.jam_pulang ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Selesai ({status.jam_pulang.slice(0, 5)} WIB)</span>
                    </span>
                  ) : !isHariKerja ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0 shadow-2xs">
                      <CalendarOff className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Libur ({infoLibur.labelBanner})</span>
                    </span>
                  ) : status?.status === "izin" || status?.status === "sakit" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0 shadow-2xs">
                      Izin Resmi
                    </span>
                  ) : !status?.jam_masuk ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs">
                      <Lock className="w-3 h-3 text-slate-400" />
                      <span>Menunggu Presensi Masuk</span>
                    </span>
                  ) : !isSudahWaktunyaPulang ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Sesi Belum Dibuka</span>
                    </span>
                  ) : !isLogbookTerisi ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 shrink-0 shadow-2xs">
                      <CircleAlert className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>Isi Logbook Dulu</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 shrink-0 shadow-2xs">
                      <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                      <span>Siap Presensi Pulang</span>
                    </span>
                  )}
                </div>

                {/* Batch Jadwal Sesi Kepulangan (Start Rata Kiri Sejajar Icon Header Sesuai Card Masuk) */}
                <div>
                  {!isHariKerja ? (
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-2xs bg-amber-50/90 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border-amber-200/70 dark:border-amber-900/40">
                      <CalendarOff className="w-4 h-4 shrink-0 text-amber-500" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Status: <strong className={`font-black ${isDark ? "text-white" : "text-[#0B1442]"}`}>{infoLibur.alasanDisplay}</strong>
                      </span>
                    </div>
                  ) : (
                    (() => {
                      return (
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs shadow-2xs transition-all ${jadwalPulangInfo.badgeClass}`}
                        >
                          <Timer className={`w-4 h-4 shrink-0 ${jadwalPulangInfo.iconClass}`} />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            Jadwal Dibuka:{" "}
                            <strong className={`font-black ${isDark ? "text-white" : "text-[#0B1442]"}`}>
                              {jadwalPulangInfo.jamBuka} WIB
                            </strong>
                          </span>
                          <span className={`font-bold ${jadwalPulangInfo.labelColorClass}`}>
                            {jadwalPulangInfo.labelDetail}
                          </span>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* Banner Progress Bar 3 Tahap Alur Harian */}
              <div
                className={`rounded-2xl py-2.5 px-3.5 sm:px-4 border transition-all duration-200 ${
                  isDark
                    ? "bg-white/[0.02] border-white/10"
                    : "bg-slate-50/80 border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 shadow-2xs">
                      <ClipboardList className="w-3 h-3" />
                    </span>
                    <span className="text-[10px] sm:text-[10.5px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Progress Alur Aktivitas Hari Ini
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black border shadow-2xs ${
                      status?.jam_pulang
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60"
                        : status?.jam_masuk && isLogbookTerisi && isSudahWaktunyaPulang
                        ? "bg-sky-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60"
                        : status?.jam_masuk && isLogbookTerisi
                        ? "bg-blue-50 dark:bg-blue-950/60 text-[#004F9F] dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60"
                        : status?.jam_masuk
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    <span className="tabular-nums">
                      {status?.jam_pulang
                        ? "100% Selesai"
                        : status?.jam_masuk && isLogbookTerisi && isSudahWaktunyaPulang
                        ? "75% Siap Pulang"
                        : status?.jam_masuk && isLogbookTerisi
                        ? "66% Logbook Tercatat"
                        : status?.jam_masuk
                        ? "33% Masuk Selesai"
                        : "0% Belum Mulai"}
                    </span>
                  </span>
                </div>

                {/* Progress Bar Track & 3 Steps */}
                <div className="relative pt-0.5 pb-0.5">
                  {/* Background Track Line */}
                  <div className="absolute top-3.5 left-[16.6%] right-[16.6%] h-1 bg-slate-200 dark:bg-white/10 rounded-full z-0 overflow-hidden">
                    <div
                      className="h-full bg-[#004F9F] dark:bg-[#00A5EC] rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: status?.jam_pulang
                          ? "100%"
                          : status?.jam_masuk && isLogbookTerisi
                          ? "75%"
                          : status?.jam_masuk
                          ? "25%"
                          : "0%",
                      }}
                    />
                  </div>

                  {/* 3 Step Points */}
                  <div className="relative z-10 grid grid-cols-3 gap-2">
                    {/* Step 1: Presensi Masuk */}
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition-all duration-300 mb-1 ${
                          status?.jam_masuk
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 ring-2 ring-emerald-500/20"
                            : "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-500"
                        }`}
                      >
                        {status?.jam_masuk ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : "1"}
                      </div>
                      <p className="text-[10.5px] sm:text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                        Presensi Masuk
                      </p>
                      <p
                        className={`text-[9.5px] font-bold mt-0.5 ${
                          status?.jam_masuk
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {status?.jam_masuk ? status.jam_masuk.slice(0, 5) + " WIB" : "Belum"}
                      </p>
                    </div>

                    {/* Step 2: Logbook Harian */}
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition-all duration-300 mb-1 ${
                          status?.jam_pulang || (status?.jam_masuk && isLogbookTerisi)
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 ring-2 ring-emerald-500/20"
                            : status?.jam_masuk
                            ? "bg-amber-500 text-white shadow-sm shadow-amber-500/25 ring-2 ring-amber-500/20"
                            : "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-500"
                        }`}
                      >
                        {status?.jam_pulang || (status?.jam_masuk && isLogbookTerisi) ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : (
                          "2"
                        )}
                      </div>
                      <p className="text-[10.5px] sm:text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                        Logbook Harian
                      </p>
                      <p
                        className={`text-[9.5px] font-bold mt-0.5 ${
                          status?.jam_pulang
                            ? "text-emerald-600 dark:text-emerald-400"
                            : isLogbookTerisi
                            ? "text-emerald-600 dark:text-emerald-400"
                            : status?.jam_masuk
                            ? "text-amber-600 dark:text-amber-400 font-extrabold"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {status?.jam_pulang
                          ? "Tersimpan"
                          : isLogbookTerisi
                          ? "Tercatat"
                          : status?.jam_masuk
                          ? "Wajib Diisi"
                          : "Belum"}
                      </p>
                    </div>

                    {/* Step 3: Presensi Pulang */}
                    <div className="flex flex-col items-center text-center">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-black transition-all duration-300 mb-1 ${
                          status?.jam_pulang
                            ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25 ring-2 ring-emerald-500/20"
                            : status?.jam_masuk && isLogbookTerisi && isSudahWaktunyaPulang
                            ? "bg-[#004F9F] dark:bg-[#00A5EC] text-white shadow-sm ring-2 ring-[#004F9F]/20 dark:ring-sky-400/30"
                            : "bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 text-slate-500"
                        }`}
                      >
                        {status?.jam_pulang ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : "3"}
                      </div>
                      <p className="text-[10.5px] sm:text-[11px] font-black text-slate-800 dark:text-slate-200 leading-tight">
                        Presensi Pulang
                      </p>
                      <p
                        className={`text-[9.5px] font-bold mt-0.5 ${
                          status?.jam_pulang
                            ? "text-emerald-600 dark:text-emerald-400"
                            : status?.jam_masuk && isLogbookTerisi && isSudahWaktunyaPulang
                            ? "text-sky-600 dark:text-sky-400 font-extrabold"
                            : status?.jam_masuk && !isSudahWaktunyaPulang
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-slate-400 dark:text-slate-500"
                        }`}
                      >
                        {status?.jam_pulang
                          ? status.jam_pulang.slice(0, 5) + " WIB"
                          : status?.jam_masuk && isLogbookTerisi && isSudahWaktunyaPulang
                          ? "Siap Presensi"
                          : status?.jam_masuk && !isSudahWaktunyaPulang
                          ? `Buka ${jamPulang}`
                          : "Belum"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Isian Logbook Kegiatan Harian Langsung di Card */}
              <div
                className={`rounded-2xl p-4 border space-y-3 transition-all duration-200 ${
                  status?.jam_pulang
                    ? isDark
                      ? "bg-emerald-950/20 border-emerald-500/30"
                      : "bg-emerald-50/40 border-emerald-200/70"
                    : isDark
                    ? "bg-white/[0.02] border-white/10"
                    : "bg-slate-50/80 border-slate-200/80"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 shadow-2xs">
                      <NotebookPen className="w-3.5 h-3.5" />
                    </span>
                    <p className={`text-xs sm:text-[12.5px] font-black ${isDark ? "text-slate-200" : "text-[#0B1442]"}`}>
                      Logbook Kegiatan Harian
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[10.5px] font-black border shadow-2xs ${
                      status?.jam_pulang
                        ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60"
                        : isLogbookTerisi
                        ? "bg-sky-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60"
                        : status?.jam_masuk
                        ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    {status?.jam_pulang ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Tersimpan</span>
                      </>
                    ) : isLogbookTerisi ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-[#00A5EC]" />
                        <span>Siap Disimpan</span>
                      </>
                    ) : status?.jam_masuk ? (
                      <>
                        <CircleAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>Wajib Diisi</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3 text-slate-400" />
                        <span>Menunggu Masuk</span>
                      </>
                    )}
                  </span>
                </div>

                {status?.jam_pulang ? (
                  <div className="bg-white/90 dark:bg-black/30 p-3.5 rounded-xl border border-emerald-200/60 dark:border-white/5 space-y-1.5 shadow-2xs">
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Uraian Kegiatan Tersimpan:
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-200 italic line-clamp-3 leading-relaxed">
                      "{status.keterangan || "Kegiatan magang hari ini telah dicatat dan disubmit."}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="relative">
                      <textarea
                        rows={3}
                        value={logbookHarian}
                        onChange={(e) => setLogbookHarian(e.target.value)}
                        disabled={!status?.jam_masuk}
                        placeholder={
                          !status?.jam_masuk
                            ? "Lakukan presensi masuk pagi terlebih dahulu untuk mulai mengisi logbook kegiatan hari ini..."
                            : "Tuliskan uraian hasil kegiatan magang, progres tugas, atau pembelajaran hari ini di sini..."
                        }
                        className={`w-full resize-none rounded-xl border p-3.5 text-xs font-semibold leading-relaxed outline-none transition-all duration-200 ${
                          !status?.jam_masuk
                            ? "bg-slate-100/70 dark:bg-white/[0.02] border-slate-200/70 dark:border-white/5 text-slate-400 cursor-not-allowed"
                            : isDark
                            ? "bg-[#161b22] border-white/10 text-slate-200 focus:border-[#00A5EC] focus:ring-2 focus:ring-[#00A5EC]/20 placeholder:text-slate-500"
                            : "bg-white border-slate-200 text-slate-800 focus:border-[#004F9F] focus:ring-2 focus:ring-[#00A5EC]/20 placeholder:text-slate-400 shadow-2xs"
                        }`}
                      />
                    </div>
                    {status?.jam_masuk && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 font-medium px-0.5">
                        <span className="flex items-center gap-1 truncate">
                          *Isian logbook di atas akan otomatis disertakan saat submit presensi pulang.
                        </span>
                        <span
                          className={`tabular-nums font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                            isLogbookTerisi
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50"
                              : "bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10"
                          }`}
                        >
                          {logbookHarian.trim().length} karakter
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button CTA Presensi Pulang (Pinned ke Bawah) */}
              <div className="space-y-3 mt-auto pt-1">
                {status?.jam_pulang ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-emerald-200 dark:border-emerald-800/60 cursor-default shadow-2xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Presensi Pulang Selesai ({status.jam_pulang.slice(0, 5)} WIB)</span>
                  </button>
                ) : !isHariKerja ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-amber-200/80 dark:border-amber-900/40 cursor-not-allowed shadow-none"
                  >
                    <CalendarOff className="w-4 h-4 text-amber-500" />
                    <span>Hari Libur ({infoLibur.alasanDisplay}) - Presensi Ditutup</span>
                  </button>
                ) : status?.status === "izin" || status?.status === "sakit" ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-purple-50/80 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-purple-200/80 dark:border-purple-900/40 cursor-not-allowed shadow-none"
                  >
                    <CheckCircle2 className="w-4 h-4 text-purple-500" />
                    <span>Tercatat {status?.status?.toUpperCase()} Resmi (Presensi Ditutup)</span>
                  </button>
                ) : !status?.jam_masuk ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/5 cursor-not-allowed shadow-none"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Menunggu Presensi Masuk Terlebih Dahulu</span>
                  </button>
                ) : !isSudahWaktunyaPulang ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/5 cursor-not-allowed shadow-none"
                  >
                    <Clock className="w-4 h-4 text-amber-500" />
                    <span>Sesi Pulang Belum Dibuka (Mulai {jamPulang} WIB)</span>
                  </button>
                ) : !isLogbookTerisi ? (
                  <button
                    type="button"
                    disabled
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-100 dark:bg-slate-800/70 text-slate-400 dark:text-slate-500 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 border border-slate-200/80 dark:border-white/5 cursor-not-allowed shadow-none"
                  >
                    <NotebookPen className="w-4 h-4" />
                    <span>Isi Logbook Kegiatan Terlebih Dahulu</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAbsenModal("pulang")}
                    className="group/btn w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md border border-white/10 hover:-translate-y-0.5 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Camera className="w-4 h-4 transition-transform duration-300 group-hover/btn:scale-125 group-hover/btn:-rotate-12" />
                    <span>Buka Kamera &amp; Lakukan Presensi Pulang</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 3 CARD HORIZONTAL GRID: REGULASI, KALENDER LIBUR, MENTOR PEMBIMBING */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 sm:gap-4 items-start">
          {/* CARD 1: REGULASI PRESENSI (LEBIH LEBAR: 5/12 COLS) */}
          <div
            className={`md:col-span-12 lg:col-span-5 rounded-2xl border p-3.5 sm:p-4 transition-all duration-300 shadow-xs flex flex-col justify-between ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <div className="min-w-0">
                    <h4 className={`text-xs sm:text-[13px] font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      Regulasi Presensi Magang
                    </h4>
                    <p className="text-[9.5px] sm:text-[10px] text-slate-400 truncate">
                      Ketentuan, tata tertib &amp; SOP dinas
                    </p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-bold bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-sky-800/40 shrink-0 shadow-2xs">
                  SOP Berlaku
                </span>
              </div>

              <div className="space-y-2">
                {/* 1. Batas Jadwal & Toleransi Keterlambatan */}
                <div className={`p-2 sm:p-2.5 rounded-lg border transition-colors ${
                  isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 mt-0.5">
                      <Clock className="w-3 h-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h5 className={`text-[11px] sm:text-[11.5px] font-black leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Batas Jadwal &amp; Toleransi Terlambat
                      </h5>
                      <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        {isHariKerja
                          ? toleransiTerlambat > 0
                            ? `Presensi tepat waktu berlaku hingga pukul ${jamMasukMulai} WIB dengan batas toleransi +${toleransiTerlambat} menit (maksimal pukul ${jamMasukSelesai} WIB). Melebihi batas toleransi otomatis terhitung Terlambat.`
                            : `Presensi tepat waktu berlaku hingga pukul ${jamMasukMulai} WIB. Presensi yang dicatat melebihi batas waktu otomatis terhitung Terlambat.`
                          : `Pada hari kerja normal presensi masuk s.d. pukul ${jamMasukMulai} WIB. Hari ini presensi dinonaktifkan (${infoLibur.namaLibur}).`}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Swafoto Kamera & Geofencing GPS (Maks. 100m) */}
                <div className={`p-2 sm:p-2.5 rounded-lg border transition-colors ${
                  isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 mt-0.5">
                      <Camera className="w-3 h-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h5 className={`text-[11px] sm:text-[11.5px] font-black leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Swafoto Wajah &amp; GPS Radius 100m
                      </h5>
                      <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        Peserta wajib swafoto wajah langsung dengan pencahayaan memadai. Lokasi tervalidasi radius GPS kantor Diskominfo (maks. 100m). Dilarang keras memakai emulator / fake GPS.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Kewajiban Logbook Harian */}
                <div className={`p-2 sm:p-2.5 rounded-lg border transition-colors ${
                  isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 mt-0.5">
                      <NotebookPen className="w-3 h-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h5 className={`text-[11px] sm:text-[11.5px] font-black leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Pengisian Jurnal Logbook Harian
                      </h5>
                      <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        Setiap peserta wajib mengisi ringkasan kegiatan, progres tugas, dan kendala kerja. Logbook wajib disubmit bersamaan saat presensi pulang mulai pukul {jamPulang} WIB.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. Prosedur Izin, Sakit & Konfirmasi Pembimbing */}
                <div className={`p-2 sm:p-2.5 rounded-lg border transition-colors ${
                  isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="flex h-5.5 w-5.5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-100 dark:border-sky-900/40 mt-0.5">
                      <ClipboardList className="w-3 h-3" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <h5 className={`text-[11px] sm:text-[11.5px] font-black leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                        Prosedur Pengajuan Izin &amp; Sakit
                      </h5>
                      <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5">
                        Apabila berhalangan hadir karena sakit/urusan mendesak, pengajuan izin wajib dikirimkan sebelum jam dinas dimulai via menu Pengajuan Izin untuk verifikasi Mentor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: KALENDER LIBUR (4/12 COLS) */}
          <div
            className={`md:col-span-7 lg:col-span-4 rounded-2xl border p-3.5 sm:p-4 transition-all duration-300 shadow-xs flex flex-col justify-between ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-2xs">
                    <CalendarDays className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <div className="min-w-0">
                    <h4 className={`text-xs sm:text-[13px] font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      Kalender Libur
                    </h4>
                    <p className="text-[9.5px] sm:text-[10px] text-slate-400 truncate">
                      Libur nasional &amp; instansi
                    </p>
                  </div>
                </div>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-bold bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC] border border-blue-200/60 dark:border-sky-800/40 shrink-0 shadow-2xs"
                  title={`Total ${liburList.length} hari libur resmi (nasional & instansi) di tahun ${calYear}`}
                >
                  {liburList.length} Hari Libur ({calYear})
                </span>
              </div>

              {/* Calendar Box */}
              <div className={`rounded-xl border overflow-hidden ${
                isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
              }`}>
                {/* Month Navigation */}
                <div className={`flex items-center justify-between px-2.5 py-1.5 border-b ${
                  isDark ? "border-white/5 bg-white/[0.01]" : "border-slate-100 bg-white/60"
                }`}>
                  <button
                    type="button"
                    onClick={() => goCalMonth(-1)}
                    className={`flex h-5.5 w-5.5 items-center justify-center rounded-md border transition-all duration-200 hover:-translate-y-0.5 active:scale-90 cursor-pointer ${
                      isDark
                        ? "border-white/10 bg-white/5 text-slate-300 hover:border-sky-400 hover:text-sky-400"
                        : "border-slate-200 bg-white text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F]"
                    }`}
                    title="Bulan sebelumnya"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>

                  <p className={`text-[11px] sm:text-[11.5px] font-black ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                    {BULAN_PANJANG_KALENDER[calMonth]} {calYear}
                  </p>

                  <button
                    type="button"
                    onClick={() => goCalMonth(1)}
                    className={`flex h-5.5 w-5.5 items-center justify-center rounded-md border transition-all duration-200 hover:-translate-y-0.5 active:scale-90 cursor-pointer ${
                      isDark
                        ? "border-white/10 bg-white/5 text-slate-300 hover:border-sky-400 hover:text-sky-400"
                        : "border-slate-200 bg-white text-slate-500 hover:border-[#004F9F]/40 hover:text-[#004F9F]"
                    }`}
                    title="Bulan berikutnya"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Grid Days & Dates */}
                <div className="p-1.5 sm:p-2">
                  <div className="grid grid-cols-7 mb-0.5">
                    {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((d, i) => (
                      <span
                        key={d}
                        className={`text-center text-[7.5px] sm:text-[8px] font-black uppercase tracking-wide py-0.5 ${
                          i === 0 ? "text-red-400" : "text-slate-400"
                        }`}
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-0.5">
                    {Array.from({ length: calFirstWeekday }).map((_, i) => (
                      <span key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: calDaysInMonth }).map((_, i) => {
                      const d = i + 1;
                      const libur = liburByDay[d];
                      const weekday = new Date(calYear, calMonth, d).getDay();
                      const isWeekend = weekday === 0 || weekday === 6;
                      const today = isTodayCell(d);

                      return (
                        <div
                          key={d}
                          className="relative flex items-center justify-center py-0.5"
                          title={libur ? `${libur.nama} (${libur.tipe === "nasional" ? "Libur Nasional" : "Libur Instansi"})` : undefined}
                        >
                          <span
                            className={`flex h-5.5 w-5.5 sm:h-6 sm:w-6 items-center justify-center rounded-md text-[9.5px] sm:text-[10px] font-bold transition-all duration-150 ${
                              today
                                ? "bg-[#0B1442] text-white shadow-xs ring-1.5 ring-[#00A5EC]/50 font-black"
                                : libur
                                ? isDark
                                  ? "bg-rose-950/60 text-rose-400 font-black"
                                  : "bg-red-50 text-red-600 font-black border border-red-200/60"
                                : isWeekend
                                ? "text-red-400 font-semibold"
                                : isDark
                                ? "text-slate-300 hover:bg-white/5"
                                : "text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {d}
                          </span>
                          {libur && !today && (
                            <span className="absolute bottom-0.5 h-0.5 w-0.5 rounded-full bg-red-500" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Acara Terdekat */}
                <div className={`border-t px-2.5 py-2 ${isDark ? "border-white/5 bg-white/[0.01]" : "border-slate-100 bg-white/40"}`}>
                  <p className={`text-[7.5px] sm:text-[8px] font-black uppercase tracking-wider mb-1.5 ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                    Acara Terdekat
                  </p>
                  {upcomingLibur ? (
                    <div className={`flex items-center gap-2 rounded-lg p-1.5 sm:p-2 border transition-all duration-200 ${
                      isDark
                        ? "border-sky-500/20 bg-sky-950/25 shadow-2xs"
                        : "border-blue-100 bg-blue-50/60 shadow-2xs"
                    }`}>
                      <span className={`flex h-7 w-7 shrink-0 flex-col items-center justify-center rounded-md shadow-2xs border ${
                        isDark
                          ? "bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#004F9F] border-[#00A5EC]/40 text-white"
                          : "bg-gradient-to-br from-[#0B1442] to-[#004F9F] border-transparent text-white"
                      }`}>
                        <span className="text-[10px] font-black leading-none text-white tracking-tight">
                          {Number(upcomingLibur.tanggal.split("-")[2])}
                        </span>
                        <span className={`text-[6.5px] font-black uppercase mt-0.5 ${
                          isDark ? "text-[#00A5EC]" : "text-sky-200"
                        }`}>
                          {BULAN_SHORT_KALENDER[Number(upcomingLibur.tanggal.split("-")[1]) - 1]}
                        </span>
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className={`text-[10px] sm:text-[10.5px] font-black leading-tight break-words ${
                          isDark ? "text-slate-100" : "text-[#0B1442]"
                        }`}>
                          {upcomingLibur.nama}
                        </p>
                        <div className="mt-0.5 flex items-center gap-1">
                          <span className={`inline-flex items-center gap-1 text-[7.5px] font-bold px-1.5 py-0.2 rounded border ${
                            upcomingLibur.tipe === "nasional"
                              ? isDark
                                ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/30"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : isDark
                                ? "bg-sky-950/60 text-sky-300 border-sky-500/30"
                                : "bg-sky-50 text-[#004F9F] border-sky-200"
                          }`}>
                            <span className={`h-1 w-1 rounded-full ${
                              upcomingLibur.tipe === "nasional"
                                ? isDark ? "bg-emerald-400" : "bg-emerald-500"
                                : isDark ? "bg-sky-400" : "bg-[#00A5EC]"
                            }`} />
                            {upcomingLibur.tipe === "nasional" ? "Libur Nasional" : "Libur Instansi"}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className={`text-[9px] font-medium ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                      Tidak ada libur mendatang di tahun {calYear}.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: MENTOR PEMBIMBING LAPANGAN (LEBIH RAMPING: 3/12 COLS & NATURAL HEIGHT) */}
          <div
            className={`md:col-span-5 lg:col-span-3 rounded-2xl border p-3.5 sm:p-4 transition-all duration-300 shadow-xs flex flex-col h-fit ${
              isDark ? "border-white/10 bg-[#161b22]" : "border-slate-200/80 bg-white"
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2.5 pb-2.5 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="flex h-7.5 w-7.5 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white shadow-2xs">
                    <UserCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </span>
                  <div className="min-w-0">
                    <h4 className={`text-xs sm:text-[13px] font-black truncate ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
                      Mentor Pembimbing
                    </h4>
                    <p className="text-[9.5px] sm:text-[10px] text-slate-400 truncate">
                      Pembimbing lapangan magang
                    </p>
                  </div>
                </div>
                {mentorData ? (
                  mentorData.is_online ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 shrink-0 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>Online</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60 shrink-0 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
                      <span>Offline</span>
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[9.5px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700/60 shrink-0 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                    <span>Belum Ditugaskan</span>
                  </span>
                )}
              </div>

              {mentorData ? (
                <div className={`p-2.5 sm:p-3 rounded-xl border space-y-2.5 ${
                  isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
                }`}>
                  <div className="flex items-center gap-2.5">
                    <div className="relative shrink-0">
                      {mentorData.foto_profil ? (
                        <img
                          src={getFileUrl(mentorData.foto_profil)}
                          alt={mentorData.nama}
                          className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg object-cover border border-white dark:border-slate-700 shadow-xs ring-1.5 ring-[#00A5EC]/30"
                        />
                      ) : (
                        <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#0B1442] to-[#00A5EC] text-white text-[11px] font-black shadow-xs border border-white dark:border-slate-700 ring-1.5 ring-[#00A5EC]/30">
                          {getInitials(mentorData.nama)}
                        </div>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border-2 border-white dark:border-slate-900 shadow-2xs ${
                          mentorData.is_online ? "bg-emerald-500" : "bg-slate-400 dark:bg-slate-500"
                        }`}
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs sm:text-[12.5px] font-black truncate leading-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`} title={mentorData.nama}>
                        {mentorData.nama}
                      </h4>
                      <p className="text-[9.5px] sm:text-[10px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5 font-medium">
                        <Briefcase className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                        <span className="truncate">{mentorData.jabatan || "Pembimbing Lapangan Diskominfo"}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-1.5 border-t border-slate-200/70 dark:border-white/5">
                    <div className={`p-1.5 sm:p-2 rounded-lg border flex items-center justify-between gap-1.5 ${
                      isDark ? "bg-white/[0.02] border-white/5" : "bg-white/80 border-slate-100 shadow-2xs"
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md bg-blue-50 dark:bg-sky-950/60 text-[#004F9F] dark:text-[#00A5EC]">
                          <IdCard className="w-3 h-3" />
                        </span>
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          NIP
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-mono font-bold text-[#004F9F] dark:text-[#00A5EC] truncate tracking-wide">
                        {mentorData.nip || "-"}
                      </span>
                    </div>

                    <div className={`p-1.5 sm:p-2 rounded-lg border flex items-center justify-between gap-1.5 ${
                      isDark ? "bg-white/[0.02] border-white/5" : "bg-white/80 border-slate-100 shadow-2xs"
                    }`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                          <Phone className="w-3 h-3" />
                        </span>
                        <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                          No. WhatsApp / HP
                        </span>
                      </div>
                      <span className="text-[10px] sm:text-[10.5px] font-mono font-semibold text-slate-700 dark:text-slate-200 truncate">
                        {mentorData.no_hp || "-"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`p-2.5 sm:p-3 rounded-xl border flex items-center gap-2.5 ${
                  isDark ? "bg-white/[0.02] border-white/5" : "bg-slate-50/80 border-slate-100"
                }`}>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400 shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h5 className={`text-[11px] sm:text-xs font-bold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                      Belum Ditugaskan
                    </h5>
                    <p className="text-[9.5px] text-slate-400 truncate mt-0.5">
                      Mentor pembimbing belum ditentukan
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL KAMERA (PRESENSI MASUK / PULANG) */}
      {absenModal && (
        <AbsenKameraModal
          jenis={absenModal}
          modeTerpilih={selectedMode || "wfo"}
          initialKeterangan={absenModal === "pulang" ? logbookHarian : ""}
          jamSekarang={formatWibTime(currentTime)}
          geoState={geoState}
          isDark={isDark}
          onClose={() => setAbsenModal(null)}
          onSelesai={() => {
            setAbsenModal(null);
            setReloadKey((k) => k + 1);
            fetchPresensi();
          }}
        />
      )}
    </PesertaLayout>
  );
};

export default PesertaPresensiLogbookPage;