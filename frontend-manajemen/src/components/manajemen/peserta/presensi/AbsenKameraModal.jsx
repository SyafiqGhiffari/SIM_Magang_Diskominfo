import { useEffect, useRef, useState, useMemo } from "react";
import {
  X,
  Camera,
  RefreshCw,
  Upload,
  Loader2,
  LogIn,
  LogOut,
  Building2,
  Home,
  Car,
  Sparkles,
  MapPin,
  NotebookPen,
  FileText,
  SwitchCamera,
  AlertCircle,
  Save,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { presensiMasuk, presensiPulang } from "../../../../services/pesertaService";
import { getMe } from "../../../../services/authService";
import { getUser } from "../../../../utils/authStorage";
import { getFileUrl } from "../../../../utils/fileUrl";
import { toastError, toastSuccess } from "../../../../utils/swal";
import { useManajemenTheme } from "../../../../context/useManajemenTheme";

// Target Koordinat Resmi Diskominfo Kab. Ponorogo
const DISKOMINFO_LAT = -7.86834;
const DISKOMINFO_LNG = 111.46512;

/* Haversine distance calculator in meters */
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

/* Format nama bidang menjadi huruf besar kecil (Title Case yang rapi) */
const formatBidangNama = (bidang) => {
  if (!bidang) return "Aplikasi dan Informatika";
  const str = String(bidang).trim();
  if (str.length <= 4 && str === str.toUpperCase()) {
    return str; // Singkatan pendek seperti APTIKA, IKP
  }
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => {
      if (["dan", "atau", "di", "ke", "dari", "yang", "dan/atau"].includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
};

/* Format alamat Indonesia yang rapi */
const formatAlamatIndonesia = (data) => {
  if (!data || !data.address) {
    return {
      judul: "Titik Lokasi Terdeteksi",
      detail: data?.display_name || "Alamat lokasi tidak dapat ditentukan secara spesifik",
    };
  }

  const addr = data.address;
  const jalan = addr.road || addr.street || addr.residential || addr.suburb || "";
  let kelurahan = addr.village || addr.suburb || addr.neighbourhood || addr.hamlet || "";
  if (/^r[tw]\s*\d+/i.test(kelurahan)) {
    kelurahan = addr.village || addr.suburb || "";
  }
  const kecamatan = addr.city_district || addr.district || addr.subdistrict || "";
  const kota = addr.city || addr.town || addr.county || addr.regency || "";
  const provinsi = addr.state || "";

  const judul = (() => {
    if (jalan) return jalan;
    if (kecamatan && kota) return `${kecamatan.replace(/^kecamatan\s*/i, "Kec. ")}, ${kota}`;
    if (kelurahan && kota) return `${kelurahan.replace(/^kelurahan\s*/i, "Kel. ")}, ${kota}`;
    if (kota && provinsi) return `${kota}, ${provinsi}`;
    return data.name || kota || "Lokasi Saat Ini";
  })();

  const bagian = [];
  if (jalan) bagian.push(jalan);
  if (kelurahan && !/^r[tw]\s*\d+/i.test(kelurahan)) {
    bagian.push(kelurahan.toLowerCase().startsWith("kel") ? kelurahan : `Kel. ${kelurahan.replace(/^kelurahan\s*/i, "")}`);
  }
  if (kecamatan) {
    bagian.push(kecamatan.toLowerCase().startsWith("kec") ? kecamatan : `Kec. ${kecamatan.replace(/^kecamatan\s*/i, "")}`);
  }
  if (kota) bagian.push(kota);
  if (provinsi) bagian.push(provinsi);

  const detail = bagian.length > 0 ? bagian.join(", ") : data.display_name;
  return { judul, detail };
};

/* Inisial nama fallback (contoh: "Syafiq Ghiffari" -> "SG") */
const getInisial = (nama) => {
  if (!nama) return "SG";
  const parts = String(nama).trim().split(/\s+/);
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
};

/* Format tanggal hari ini dalam bahasa Indonesia */
const formatTanggalHariIni = () => {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  } catch {
    return "Hari Ini";
  }
};

/* Format jam WIB standar */
const getLiveWibTime = () => {
  try {
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(new Date()).replace(/\./g, ":");
  } catch {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  }
};

/* Helper untuk menggambar rounded rectangle di Canvas */
const drawCanvasRoundedRect = (ctx, x, y, width, height, radius) => {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
};

/* Helper untuk truncate teks canvas jika melebihi lebar maksimum */
const truncateCanvasText = (ctx, text, maxWidth) => {
  if (!text) return "";
  if (ctx.measureText(text).width <= maxWidth) return text;
  let truncated = String(text);
  while (truncated.length > 0 && ctx.measureText(truncated + "…").width > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
};

/* Membubuhkan watermark verifikasi digital resmi Diskominfo pada gambar canvas */
const bubuhkanWatermarkCanvas = ({
  ctx,
  width,
  height,
  timestampWib,
  locData,
  namaUser,
  bidangUser,
  modePresensi,
  isMasuk,
}) => {
  ctx.save();
  // Reset transformasi agar teks selalu tegak lurus dan tidak terbalik
  ctx.setTransform(1, 0, 0, 1, 0, 0);

  // Skala proporsional relatif terhadap lebar canvas
  const scale = Math.max(0.7, Math.min(1.4, width / 1280));
  const isPortrait = height > width;

  // Ukuran bar watermark ramping & rapat (tidak menutupi wajah/foto)
  const barHeightRatio = isPortrait ? 0.075 : 0.095;
  const barHeight = Math.max(62, Math.min(105, Math.round(height * barHeightRatio)));
  const paddingX = Math.max(12, Math.round(width * 0.02));
  const paddingY = Math.max(5, Math.round(height * 0.009));

  // 1. Latar Belakang Gradien Multi-Stop Gelap Elegan & Transparan Halus
  const topFadeHeight = Math.round(barHeight * 0.22);
  const grad = ctx.createLinearGradient(0, height - barHeight - topFadeHeight, 0, height);
  grad.addColorStop(0, "rgba(0, 0, 0, 0)");
  grad.addColorStop(0.35, "rgba(8, 15, 45, 0.78)");
  grad.addColorStop(0.7, "rgba(6, 12, 38, 0.95)");
  grad.addColorStop(1, "rgba(3, 7, 24, 0.99)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - barHeight - topFadeHeight, width, barHeight + topFadeHeight);

  // 2. Garis Aksen Gradien Neon Berpendar di Atas Bar Watermark
  const accentHeight = Math.max(1.5, Math.round(2 * scale));
  const lineGrad = ctx.createLinearGradient(0, 0, width, 0);
  lineGrad.addColorStop(0, "#004F9F");
  lineGrad.addColorStop(0.3, "#00A5EC");
  lineGrad.addColorStop(0.7, "#38BDF8");
  lineGrad.addColorStop(1, isMasuk ? "#10B981" : "#F59E0B");
  ctx.fillStyle = lineGrad;
  ctx.fillRect(0, height - barHeight - accentHeight, width, accentHeight);

  // 3. Kartu Kanan: Waktu Presensi & Hari/Tanggal (Kompak & Elegan)
  const cardWidth = Math.round(Math.min(225 * scale, width * 0.29));
  const cardHeight = barHeight - paddingY * 1.3;
  const cardX = width - paddingX - cardWidth;
  const cardY = height - barHeight + paddingY * 0.65;
  const cardRadius = Math.round(7 * scale);

  // Background Frosted Glass Card Kanan
  drawCanvasRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, cardRadius);
  const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX, cardY + cardHeight);
  cardGrad.addColorStop(0, "rgba(8, 20, 52, 0.92)");
  cardGrad.addColorStop(1, "rgba(3, 8, 26, 0.96)");
  ctx.fillStyle = cardGrad;
  ctx.fill();
  ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
  ctx.lineWidth = Math.max(1, 1 * scale);
  ctx.stroke();

  // Teks di dalam Kartu Kanan
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // 3a. Baris 1: Hari & Tanggal Lengkap (Ukuran Font Lebih Besar & Jelas)
  const tglStr = formatTanggalHariIni();
  const fontDate = Math.max(10, Math.round(12.5 * scale));
  ctx.font = `700 ${fontDate}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#F1F5F9";
  const dateCardText = truncateCanvasText(ctx, tglStr, cardWidth - 14 * scale);
  ctx.fillText(dateCardText, cardX + cardWidth / 2, cardY + cardHeight * 0.32);

  // 3b. Baris 2: Jam Monospace Utama
  const fontClock = Math.max(12.5, Math.round(16.5 * scale));
  ctx.font = `bold ${fontClock}px monospace, ui-monospace`;
  ctx.fillStyle = "#38BDF8";
  ctx.fillText(`${timestampWib} WIB`, cardX + cardWidth / 2, cardY + cardHeight * 0.69);

  // 4. Sisi Kiri: Informasi E-Presensi Ramping (3 Baris Rapat)
  const maxLeftWidth = cardX - paddingX - 12;
  const lineGap = Math.round((barHeight - paddingY * 2) / 2.5);
  const startLeftX = paddingX;
  const baseLeftY = height - barHeight + paddingY;

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";

  // --- BARIS 1: Header Brand + Sesi Presensi Badge + Mode Kehadiran Badge ---
  const yLine1 = baseLeftY + lineGap * 0.35;
  let curX = startLeftX;

  // 1a. Brand Title Resmi
  const fontBrand = Math.max(9.5, Math.round(11.5 * scale));
  ctx.font = `800 ${fontBrand}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#38BDF8";
  const brandText = "E-PRESENSI DISKOMINFO KAB. PONOROGO";
  ctx.fillText(brandText, curX, yLine1);
  curX += ctx.measureText(brandText).width + 8 * scale;

  // 1b. Badge Sesi (PRESENSI MASUK / PRESENSI PULANG - tanpa dot)
  const fontBadge = Math.max(7.5, Math.round(8.8 * scale));
  ctx.font = `700 ${fontBadge}px system-ui, -apple-system, sans-serif`;
  const sesiText = isMasuk ? "PRESENSI MASUK" : "PRESENSI PULANG";
  const sesiWidth = ctx.measureText(sesiText).width + 12 * scale;
  const badgeHeight = Math.round(fontBadge * 1.6);
  const badgeRadius = Math.round(3.5 * scale);

  if (curX + sesiWidth < maxLeftWidth) {
    drawCanvasRoundedRect(
      ctx,
      curX,
      yLine1 - badgeHeight / 2,
      sesiWidth,
      badgeHeight,
      badgeRadius
    );
    ctx.fillStyle = isMasuk ? "rgba(16, 185, 129, 0.22)" : "rgba(245, 158, 11, 0.22)";
    ctx.fill();
    ctx.strokeStyle = isMasuk ? "#10B981" : "#F59E0B";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = isMasuk ? "#34D399" : "#FBBF24";
    ctx.fillText(sesiText, curX + 6 * scale, yLine1);
    curX += sesiWidth + 6 * scale;
  }

  // 1c. Badge Mode (WFO / WFH / DINAS LUAR)
  const modeKey = String(modePresensi || "wfo").toLowerCase();
  const modeText =
    modeKey === "wfo"
      ? "WFO (KANTOR)"
      : modeKey === "wfh"
      ? "WFH (TUGAS MANDIRI)"
      : "DINAS LUAR";

  const modeWidth = ctx.measureText(modeText).width + 12 * scale;
  if (curX + modeWidth < maxLeftWidth) {
    drawCanvasRoundedRect(
      ctx,
      curX,
      yLine1 - badgeHeight / 2,
      modeWidth,
      badgeHeight,
      badgeRadius
    );
    ctx.fillStyle = "rgba(0, 79, 159, 0.35)";
    ctx.fill();
    ctx.strokeStyle = "rgba(0, 165, 236, 0.6)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#E0F2FE";
    ctx.fillText(modeText, curX + 6 * scale, yLine1);
  }

  // --- BARIS 2: Nama Peserta Sejajar dengan Bidang Unit Kerja di Sebelah Kanan ---
  const yLine2 = baseLeftY + lineGap * 1.25;
  const fontBody = Math.max(9, Math.round(10.8 * scale));
  ctx.font = `600 ${fontBody}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "#FFFFFF";

  const namaStr = namaUser || "Peserta Magang";
  const bidangStr = bidangUser || "Aplikasi dan Informatika";
  const namaDanBidang = `👤 ${namaStr}   •   🏢 Bidang: ${bidangStr}`;
  const safeNamaBidang = truncateCanvasText(ctx, namaDanBidang, maxLeftWidth);
  ctx.fillText(safeNamaBidang, startLeftX, yLine2);

  // --- BARIS 3: Alamat Sejajar dengan Titik Koordinat GPS & Radius ---
  const yLine3 = baseLeftY + lineGap * 2.15;
  const fontSub = Math.max(8, Math.round(9.8 * scale));
  ctx.font = `500 ${fontSub}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "rgba(224, 242, 254, 0.92)";

  const rawAlamat = locData?.detail || locData?.judul || "Dinas Komunikasi, Informatika dan Statistik Kab. Ponorogo";
  const latStr = locData?.lat != null ? `${locData.lat.toFixed(6)}, ${locData.lng.toFixed(6)}` : "-7.868352, 111.462319";
  const jarakStr = locData?.jarak != null ? ` (Radius: ±${Math.round(locData.jarak)}m)` : "";
  const alamatGps = `📍 ${rawAlamat}   •   🌐 GPS: ${latStr}${jarakStr}`;
  const safeAlamatGps = truncateCanvasText(ctx, alamatGps, maxLeftWidth);
  ctx.fillText(safeAlamatGps, startLeftX, yLine3);

  ctx.restore();
};

const AbsenKameraModal = ({
  jenis,
  geoState,
  onClose,
  onSelesai,
  onSuccess,
  modeTerpilih = "wfo",
  initialKeterangan = "",
  isDark = false,
  dk,
}) => {
  const themeContext = useManajemenTheme();
  const darkMode = isDark || dk || themeContext?.isDark || false;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const inputRef = useRef(null);

  const isMasuk = jenis === "masuk";
  const JenisIcon = isMasuk ? LogIn : LogOut;
  const modeKehadiran = modeTerpilih || "wfo";

  const [profileData, setProfileData] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  // Derived state awal jika geoState sudah disediakan oleh parent
  const initialLoc = useMemo(() => {
    if (geoState?.lokasiNama && geoState?.alamatDetail) {
      return {
        judul: geoState.lokasiNama,
        detail: geoState.alamatDetail,
        lat: geoState.lat,
        lng: geoState.lng,
        jarak: geoState.jarak,
      };
    }
    return null;
  }, [geoState]);

  const [realLoc, setRealLoc] = useState(null);

  const [kameraSiap, setKameraSiap] = useState(false);
  const [errKamera, setErrKamera] = useState("");
  const [preview, setPreview] = useState(null);
  const [fileFoto, setFileFoto] = useState(null);
  const [waktuAmbilFoto, setWaktuAmbilFoto] = useState(null);
  const [keterangan, setKeterangan] = useState(initialKeterangan || "");
  const [saving, setSaving] = useState(false);
  const [facingMode, setFacingMode] = useState("user"); // 'user' (depan) atau 'environment' (belakang)
  const [cameraTrigger, setCameraTrigger] = useState(0);
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);

  const authUser = getUser() || {};

  const namaPeserta =
    profileData?.pendaftaran?.nama_lengkap ||
    profileData?.nama ||
    authUser.nama ||
    "Syafiq Ghiffari";

  const bidangPesertaRaw =
    profileData?.pendaftaran?.posisi_bidang ||
    profileData?.bidang_nama ||
    profileData?.pendaftaran?.bidang?.nama ||
    authUser.bidang_nama ||
    authUser.bidang ||
    "Aplikasi dan Informatika";

  const bidangPeserta = formatBidangNama(bidangPesertaRaw);

  const fotoPeserta =
    profileData?.pendaftaran?.file_pas_foto ||
    profileData?.pendaftaran?.FilePasFoto ||
    profileData?.foto_profil ||
    authUser.foto_profil ||
    null;

  const urlFotoPeserta = fotoPeserta ? getFileUrl(fotoPeserta) : null;

  // Deteksi perangkat mobile yang mendukung peralihan kamera (kamera depan & belakang)
  // Khusus laptop / PC desktop (Windows, macOS, Linux), tombol Putar Kamera tidak diaktifkan
  useEffect(() => {
    let isMounted = true;
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    const ua = navigator.userAgent || "";
    // Cek apakah benar-benar perangkat smartphone / tablet mobile
    const isMobileDevice =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) ||
      (/Macintosh/i.test(ua) && navigator.maxTouchPoints > 1); // iPadOS

    if (!isMobileDevice) {
      return;
    }

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === "videoinput");
        if (isMounted) {
          setCanSwitchCamera(videoInputs.length > 1);
        }
      })
      .catch(() => {
        if (isMounted) {
          setCanSwitchCamera(true);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch profil peserta (nama, NIM/NISN, asal sekolah/kampus, bidang, foto pendaftaran)
  useEffect(() => {
    let isMounted = true;
    getMe()
      .then((res) => {
        if (isMounted && res.data?.data) {
          setProfileData(res.data.data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  // Deteksi lokasi GPS yang sebenarnya secara real-time dan reverse geocode ke alamat Indonesia
  useEffect(() => {
    if (initialLoc) return;
    if (typeof navigator === "undefined" || !navigator.geolocation) return;

    let isMounted = true;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const jarak = hitungJarakMeter(lat, lng, DISKOMINFO_LAT, DISKOMINFO_LNG);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            { headers: { "Accept-Language": "id" } }
          );
          const data = await res.json();
          if (isMounted && data) {
            const parsed = formatAlamatIndonesia(data);
            setRealLoc({
              judul: parsed.judul,
              detail: parsed.detail,
              lat,
              lng,
              jarak,
            });
          }
        } catch {
          if (isMounted) {
            setRealLoc({
              judul: "Koordinat Lokasi Terdeteksi",
              detail: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
              lat,
              lng,
              jarak,
            });
          }
        }
      },
      () => {
        if (isMounted) {
          // Fallback bila izin lokasi ditolak
          setRealLoc({
            judul: "Kantor Diskominfo Kab. Ponorogo",
            detail: "Jl. Ir. H. Juanda No. 198, Tonatan, Kec. Ponorogo",
            lat: DISKOMINFO_LAT,
            lng: DISKOMINFO_LNG,
            jarak: 0,
          });
        }
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );

    return () => {
      isMounted = false;
    };
  }, [initialLoc]);

  const matikanKamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    if (preview) return;
    let aktif = true;

    const startCamera = async () => {
      try {
        const constraints = {
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (!aktif) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setKameraSiap(true);
        setErrKamera("");
      } catch (err) {
        console.warn("Camera access warning:", err);
        if (aktif) {
          setErrKamera("Kamera tidak dapat diakses atau izin ditolak. Anda tetap dapat mengunggah foto langsung dari galeri / file.");
          setKameraSiap(false);
        }
      }
    };

    startCamera();

    return () => {
      aktif = false;
      matikanKamera();
    };
  }, [facingMode, preview, cameraTrigger]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !saving) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, saving]);

  const beralihKamera = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    setCameraTrigger((c) => c + 1);
  };

  const activeLoc = initialLoc || realLoc;

  const ambilFoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const snapTime = getLiveWibTime();
    setWaktuAmbilFoto(snapTime);

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    
    // Jika kamera depan, balik secara horizontal agar seperti cermin alami
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `presensi-raw-${Date.now()}.jpg`, { type: "image/jpeg" });
        setFileFoto(file);
        setPreview(URL.createObjectURL(blob));
        matikanKamera();
        setKameraSiap(false);
      },
      "image/jpeg",
      0.95
    );
  };

  const pilihDariGaleri = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toastError("Format foto harus JPG, JPEG, atau PNG.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toastError("Ukuran foto maksimal 10MB.");
      return;
    }

    const snapTime = getLiveWibTime();
    setWaktuAmbilFoto(snapTime);
    setFileFoto(file);
    setPreview(URL.createObjectURL(file));
    matikanKamera();
    setKameraSiap(false);
  };

  const ulangiFoto = () => {
    setPreview(null);
    setFileFoto(null);
    setWaktuAmbilFoto(null);
    setErrKamera("");
    setCameraTrigger((c) => c + 1);
  };

  // Helper untuk membubuhkan watermark resmi ke file saat disimpan ke server
  const generateWatermarkedFile = async (rawFileOrUrl, snapTime) => {
    return new Promise((resolve) => {
      const img = new Image();
      const tempUrl = typeof rawFileOrUrl === "string" ? rawFileOrUrl : URL.createObjectURL(rawFileOrUrl);
      img.onload = () => {
        const canvas = canvasRef.current || document.createElement("canvas");
        canvas.width = img.naturalWidth || 1280;
        canvas.height = img.naturalHeight || 720;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        bubuhkanWatermarkCanvas({
          ctx,
          width: canvas.width,
          height: canvas.height,
          timestampWib: snapTime || waktuAmbilFoto || getLiveWibTime(),
          locData: activeLoc,
          namaUser: namaPeserta,
          bidangUser: bidangPeserta,
          modePresensi: modeKehadiran,
          isMasuk,
        });

        canvas.toBlob(
          (blob) => {
            if (typeof rawFileOrUrl !== "string") {
              URL.revokeObjectURL(tempUrl);
            }
            if (blob) {
              resolve(new File([blob], `presensi-${jenis}-${Date.now()}.jpg`, { type: "image/jpeg" }));
            } else {
              resolve(rawFileOrUrl instanceof File ? rawFileOrUrl : null);
            }
          },
          "image/jpeg",
          0.92
        );
      };
      img.onerror = () => {
        if (typeof rawFileOrUrl !== "string") {
          URL.revokeObjectURL(tempUrl);
        }
        resolve(rawFileOrUrl instanceof File ? rawFileOrUrl : null);
      };
      img.src = tempUrl;
    });
  };

  const kirim = async () => {
    if (!fileFoto && !preview) {
      toastError("Harap ambil swafoto atau unggah foto bukti presensi terlebih dahulu.");
      return;
    }

    if (!isMasuk && !keterangan.trim()) {
      toastError("Harap isi uraian logbook capaian kegiatan harian Anda sebelum melakukan presensi pulang.");
      return;
    }

    setSaving(true);
    try {
      const form = new FormData();
      
      // Bubuhkan watermark resmi pada saat penyimpanan presensi agar tersimpan permanen ke backend
      const watermarkedFile = await generateWatermarkedFile(fileFoto || preview, waktuAmbilFoto);
      if (watermarkedFile) {
        form.append("foto", watermarkedFile);
      } else if (fileFoto) {
        form.append("foto", fileFoto);
      }

      const effectiveLat = activeLoc?.lat;
      const effectiveLng = activeLoc?.lng;
      const effectiveJarak = activeLoc?.jarak;

      let catatanFinal = keterangan.trim();
      if (isMasuk) {
        form.append("mode_kehadiran", modeKehadiran);
        if (effectiveLat != null) form.append("latitude", String(effectiveLat));
        if (effectiveLng != null) form.append("longitude", String(effectiveLng));
        if (effectiveJarak != null) form.append("jarak_meter", String(effectiveJarak));

        const tagMode =
          modeKehadiran === "wfo"
            ? "[WFO]"
            : modeKehadiran === "wfh"
            ? "[WFH]"
            : "[DINAS LUAR]";

        if (catatanFinal) {
          catatanFinal = `${tagMode} ${catatanFinal}`;
        } else {
          catatanFinal =
            modeKehadiran === "wfo"
              ? "[WFO] Hadir di Kantor Diskominfo"
              : modeKehadiran === "wfh"
              ? "[WFH] Tugas Mandiri / Remote"
              : "[DINAS LUAR] Kegiatan Lapangan / Luar Kantor";
        }
        form.append("keterangan", catatanFinal);
      } else {
        if (catatanFinal) form.append("keterangan", catatanFinal);
      }

      const res = isMasuk ? await presensiMasuk(form) : await presensiPulang(form);
      toastSuccess(res.data?.message || `Presensi ${isMasuk ? "masuk" : "pulang"} berhasil dicatat.`);
      matikanKamera();
      if (onSelesai) onSelesai(res.data);
      if (onSuccess) onSuccess(res.data);
      onClose();
    } catch (err) {
      toastError(err.response?.data?.message || "Gagal menyimpan presensi.");
    } finally {
      setSaving(false);
    }
  };

  const modeDetails = useMemo(() => {
    if (modeKehadiran === "wfo") {
      return {
        label: "WFO (Kantor Diskominfo)",
        badgeText: "WFO",
        desc: "Presensi kehadiran langsung di kantor dinas Diskominfo Ponorogo",
        icon: Building2,
      };
    }
    if (modeKehadiran === "wfh") {
      return {
        label: "WFH (Tugas Mandiri / Remote)",
        badgeText: "WFH",
        desc: "Bekerja mandiri sesuai arahan dan penugasan mentor pembimbing",
        icon: Home,
      };
    }
    return {
      label: "Dinas Luar (Tugas Lapangan)",
      badgeText: "Dinas Luar",
      desc: "Penugasan dinas resmi / liputan / kegiatan operasional luar kantor",
      icon: Car,
    };
  }, [modeKehadiran]);

  const ModeIcon = modeDetails.icon;

  // Resolusi alamat lengkap dan radius lokasi yang sebenarnya
  const alamatLokasiSebenarnya =
    activeLoc?.detail ||
    (modeKehadiran === "wfo"
      ? "Jl. Ir. H. Juanda No. 198, Tonatan, Kec. Ponorogo"
      : activeLoc?.lat != null
      ? `${activeLoc.lat.toFixed(6)}, ${activeLoc.lng.toFixed(6)}`
      : "Mendeteksi koordinat lokasi saat ini...");

  const jarakValue = activeLoc?.jarak;
  const keteranganJarakSebenarnya =
    jarakValue != null
      ? jarakValue < 100
        ? `Tepat berada di area kantor (Radius: ±${Math.round(jarakValue)} m)`
        : `Radius GPS: ±${Math.round(jarakValue)} m dari Kantor Diskominfo`
      : "Koordinat akurat terekam otomatis";

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-3 sm:p-4 lg:p-6 animate-[backdropFade_0.25s_ease-out]"
        onClick={() => !saving && onClose()}
      >
        <div
          className={`w-full max-w-lg md:max-w-3xl lg:max-w-5xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-[modalFadeUp_0.3s_ease-out] max-h-[92vh] flex flex-col ${
            darkMode ? "bg-[#161b22] border border-white/10" : "bg-white ring-1 ring-slate-900/10"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Modal - Gradien Biru Selaras dengan Modal Riwayat */}
          <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-4 py-3.5 sm:px-6 sm:py-5 shrink-0">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#00A5EC]/20 blur-3xl pointer-events-none" />
            <Camera
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 opacity-[0.07] sm:opacity-[0.09] text-sky-300 pointer-events-none rotate-6"
              strokeWidth={1}
            />

            <div className="relative flex items-start justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
                <span className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md text-white shadow-lg">
                  <JenisIcon className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="inline-flex items-center gap-1 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-[#00A5EC] mb-0.5 bg-white/5 border border-white/10 rounded-full px-2 py-0.5 backdrop-blur-md">
                    <Sparkles className="w-2.5 h-2.5 animate-pulse text-[#00A5EC]" />
                    {isMasuk ? "Sesi Presensi Masuk" : "Sesi Presensi Kepulangan & Logbook"}
                  </div>
                  <h3 className="text-xs sm:text-base lg:text-lg font-black text-white leading-tight truncate">
                    {isMasuk ? "Presensi Kehadiran Pagi" : "Presensi Kepulangan & Logbook"}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-2 text-[10px] sm:text-[11.5px] text-white/90 font-bold">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-sky-300 shrink-0" />
                      {formatTanggalHariIni()}
                    </span>
                    <span className="text-white/30">•</span>
                    <span className="inline-flex items-center gap-1.5 text-[9.5px] sm:text-[10.5px] font-bold bg-[#004F9F]/80 text-white border border-white/20 px-2.5 py-0.5 rounded-md shadow-xs backdrop-blur-md">
                      <ModeIcon className="w-3 h-3 text-sky-300 shrink-0" />
                      <span>{modeDetails.label}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Tombol Tutup Modal */}
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex h-7 w-7 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer disabled:opacity-40"
                aria-label="Tutup modal presensi"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Modal Body: 2 Kolom Kiri & Kanan */}
          <div
            className={`flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 ${
              darkMode ? "bg-[#161b22]" : "bg-slate-50/50"
            }`}
          >
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
              
              {/* KOLOM KIRI (Kamera Viewfinder dengan Tombol Terpadu) */}
              <div className="lg:col-span-7">
                {/* Viewfinder Container dengan Border Putih Bersih di Semua Mode */}
                <div
                  className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-slate-950 aspect-[4/3] border-2 shadow-2xl transition-all ${
                    preview
                      ? "border-emerald-400 shadow-emerald-500/15"
                      : "border-white shadow-xl shadow-black/30"
                  }`}
                >
                  {preview ? (
                    /* Pratinjau Foto Terambil (Bersih Tanpa Watermark Menutupi) */
                    <div className="relative h-full w-full">
                      <img
                        src={preview}
                        alt="Pratinjau Swafoto Presensi"
                        className="h-full w-full object-cover animate-[tplFade_0.3s_ease-out]"
                      />

                      {/* In-Frame Action Controls saat Foto Terambil */}
                      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-6 pb-2 sm:pb-2.5 px-3.5 sm:px-4">
                        {/* Dock Kontrol Bawah Terpadu: Kiri Unggah, Tengah Ulangi Swafoto */}
                        <div className="grid grid-cols-3 items-center w-full">
                          {/* Pojok Kiri: Ganti Foto dari Galeri */}
                          <div className="flex items-center justify-start">
                            <button
                              type="button"
                              onClick={() => inputRef.current?.click()}
                              disabled={saving}
                              title="Ganti File dari Galeri"
                              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md border border-white/30 transition-colors duration-150 cursor-pointer shadow-md disabled:opacity-50"
                              aria-label="Ganti File dari Galeri"
                            >
                              <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </button>
                          </div>

                          {/* Tengah: Ulangi Swafoto */}
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={ulangiFoto}
                              disabled={saving}
                              title="Ulangi Swafoto"
                              className="relative flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full border-2 border-white bg-white/20 hover:bg-white/35 p-1 backdrop-blur-md transition-colors duration-150 active:scale-95 cursor-pointer shadow-lg shadow-black/40 disabled:opacity-50"
                              aria-label="Ulangi Swafoto"
                            >
                              <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-slate-900 shadow-inner">
                                <RefreshCw className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-slate-900" />
                              </span>
                            </button>
                          </div>

                          {/* Pojok Kanan: Spacer Presisi */}
                          <div className="flex items-center justify-end">
                            <div className="w-10 sm:w-11" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Live Webcam Stream */
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`h-full w-full object-cover transition-transform duration-300 ${
                          facingMode === "user" ? "-scale-x-100" : ""
                        }`}
                      />

                      {/* In-Frame Action Dock di Bawah Viewfinder (Menyatu dengan Border & Frame Kamera) */}
                      <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 via-black/40 to-transparent pt-6 pb-2 sm:pb-2.5 px-3.5 sm:px-4">
                        <div className="grid grid-cols-3 items-center w-full">
                          {/* Pojok Kiri: Tombol Unggah Foto dari Galeri */}
                          <div className="flex items-center justify-start">
                            <button
                              type="button"
                              onClick={() => inputRef.current?.click()}
                              disabled={saving}
                              title="Unggah Foto dari Galeri"
                              className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md border border-white/30 transition-colors duration-150 cursor-pointer shadow-md disabled:opacity-50"
                              aria-label="Unggah Foto dari Galeri"
                            >
                              <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            </button>
                          </div>

                          {/* Tengah: Tombol Shutter Ambil Foto Presensi */}
                          <div className="flex items-center justify-center">
                            <button
                              type="button"
                              onClick={ambilFoto}
                              disabled={!kameraSiap || saving}
                              title="Ambil Swafoto"
                              className="relative flex h-12 w-12 sm:h-13 sm:w-13 items-center justify-center rounded-full border-2 border-white bg-white/20 hover:bg-white/35 p-1 backdrop-blur-md transition-colors duration-150 active:scale-95 cursor-pointer shadow-lg shadow-black/40 disabled:opacity-50"
                              aria-label="Ambil Swafoto"
                            >
                              <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-slate-900 shadow-inner">
                                <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-slate-900" />
                              </span>
                            </button>
                          </div>

                          {/* Pojok Kanan: Tombol Putar Kamera (Hanya Tampil di Smartphone/Tablet Mobile Multi-Kamera) */}
                          <div className="flex items-center justify-end">
                            {canSwitchCamera ? (
                              <button
                                type="button"
                                onClick={beralihKamera}
                                className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white backdrop-blur-md border border-white/30 transition-colors duration-150 cursor-pointer shadow-md"
                                title="Beralih Kamera Depan / Belakang"
                                aria-label="Putar Kamera"
                              >
                                <SwitchCamera className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                              </button>
                            ) : (
                              <div className="w-10 sm:w-11" /> /* Spacer agar posisi tengah tetap simetris */
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Loading / Error State Overlay */}
                      {!kameraSiap && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-slate-950/90 px-6 text-center">
                          {errKamera ? (
                            <>
                              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/30 text-white">
                                <AlertCircle className="w-6 h-6 text-white" />
                              </div>
                              <p className="text-xs font-semibold text-rose-200 max-w-sm leading-relaxed">
                                {errKamera}
                              </p>
                            </>
                          ) : (
                            <>
                              <Loader2 className="w-7 h-7 text-white animate-spin" />
                              <p className="text-xs font-semibold text-white/90">
                                Menyiapkan kamera &amp; sensor...
                              </p>
                            </>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                  <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={pilihDariGaleri}
                    className="hidden"
                  />
                </div>
              </div>

              {/* KOLOM KANAN (Profil Peserta, Titik Lokasi & Form Presensi) */}
              <div className="lg:col-span-5 space-y-3.5">
                {/* 1. KARTU IDENTITAS & TITIK LOKASI PRESENSI (1 Banner Terpadu Elegan) */}
                <div
                  className={`rounded-2xl sm:rounded-3xl border transition-all overflow-hidden ${
                    darkMode
                      ? "bg-[#1c2333]/90 border-white/10 shadow-lg shadow-black/20"
                      : "bg-gradient-to-b from-white via-white to-slate-50/70 border-slate-200/90 shadow-xs"
                  }`}
                >
                  {/* Bagian Atas: Profil Peserta */}
                  <div className="p-3.5 sm:p-4 flex items-center gap-3.5">
                    {/* Avatar Bulat dengan Border Beraksen Halus */}
                    <div className="relative shrink-0 rounded-full p-0.5 bg-gradient-to-br from-[#004F9F]/20 via-sky-400/20 to-indigo-500/20 shadow-2xs">
                      {urlFotoPeserta && !avatarError ? (
                        <img
                          src={urlFotoPeserta}
                          alt={namaPeserta}
                          onError={() => setAvatarError(true)}
                          className="h-11 w-11 sm:h-12 sm:w-12 rounded-full object-cover border border-white/80 dark:border-white/10"
                        />
                      ) : (
                        <span className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#0B1442] to-[#1E3A8A] text-white text-xs sm:text-[13px] font-black tracking-wider border border-white/10">
                          {getInisial(namaPeserta)}
                        </span>
                      )}
                    </div>

                    {/* Detail Identitas: Nama Lengkap & Bidang */}
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <h4 className="text-[13.5px] sm:text-[14.5px] font-black text-slate-900 dark:text-white leading-tight truncate" title={namaPeserta}>
                        {namaPeserta}
                      </h4>
                      <p className="text-[11.5px] sm:text-[12px] font-semibold text-slate-500 dark:text-slate-400 leading-tight truncate">
                        {bidangPeserta}
                      </p>
                    </div>
                  </div>

                  {/* Bagian Bawah: Titik Lokasi Presensi (Embedded Inner Box) */}
                  <div className="px-3.5 pb-3.5 sm:px-4 sm:pb-4">
                    <div
                      className={`p-3 sm:p-3.5 rounded-xl border transition-all ${
                        darkMode
                          ? "bg-white/[0.03] border-white/10"
                          : "bg-sky-50/60 border-sky-100/80 shadow-2xs"
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#004F9F]/10 dark:bg-sky-400/15 text-[#004F9F] dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/40 shadow-2xs mt-0.5">
                          <MapPin className="w-3.5 h-3.5 text-[#004F9F] dark:text-sky-300" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] sm:text-[9.5px] font-bold uppercase tracking-wider text-[#004F9F] dark:text-sky-400">
                            Titik Lokasi Presensi
                          </p>
                          <p className="text-[11.5px] sm:text-[12px] font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-snug" title={alamatLokasiSebenarnya}>
                            {alamatLokasiSebenarnya}
                          </p>
                          <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/90 dark:bg-white/5 border border-sky-200/60 dark:border-white/10 text-[10px] sm:text-[10.5px] font-bold text-[#004F9F] dark:text-sky-300 shadow-2xs">
                            <span>{keteranganJarakSebenarnya}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Form Input Keterangan (Masuk) / Pratinjau Logbook Harian (Pulang) */}
                {isMasuk ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between pb-0.5">
                      <label
                        htmlFor="presensi-keterangan"
                        className="flex items-center gap-2 text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300"
                      >
                        <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/40 shadow-2xs">
                          <NotebookPen className="w-3 h-3 text-indigo-600 dark:text-indigo-300" />
                        </span>
                        <span>
                          {modeKehadiran === "wfo"
                            ? "Keterangan Masuk (Opsional):"
                            : modeKehadiran === "wfh"
                            ? "Catatan Kerja WFH (Opsional):"
                            : "Lokasi & Agenda Dinas Luar (Disarankan):"}
                        </span>
                      </label>
                      <span className="text-[9.5px] sm:text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-white/5">
                        {keterangan.length} Karakter
                      </span>
                    </div>

                    <textarea
                      id="presensi-keterangan"
                      rows={5}
                      value={keterangan}
                      onChange={(e) => setKeterangan(e.target.value)}
                      placeholder={
                        modeKehadiran === "wfo"
                          ? "Contoh: Hadir tepat waktu di kantor dinas Diskominfo Ponorogo."
                          : modeKehadiran === "wfh"
                          ? "Contoh: Mengerjakan modul frontend / desain konten publikasi dari rumah."
                          : "Contoh: Liputan dokumentasi acara dinas di Alun-Alun / Pendopo Ponorogo."
                      }
                      className={`w-full resize-none rounded-2xl border px-4 py-3 text-xs sm:text-[12.5px] font-medium leading-relaxed outline-none transition-all duration-200 focus:ring-4 focus:ring-[#00A5EC]/15 ${
                        darkMode
                          ? "bg-[#1c2333] border-white/10 text-white placeholder:text-slate-500 focus:border-[#00A5EC]"
                          : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] shadow-xs"
                      }`}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between pb-0.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5.5 w-5.5 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs">
                          <FileText className="w-3 h-3 text-emerald-600 dark:text-emerald-300" />
                        </span>
                        <p className="text-[10.5px] sm:text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          Logbook Kegiatan Terlampir:
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[9.5px] sm:text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/40 shadow-2xs">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{keterangan.length} Karakter</span>
                      </span>
                    </div>

                    <div
                      className={`w-full rounded-2xl border p-3.5 sm:p-4 text-xs sm:text-[12.5px] font-medium leading-relaxed max-h-44 overflow-y-auto whitespace-pre-wrap transition-all ${
                        darkMode
                          ? "bg-[#1c2333]/70 border-white/10 text-slate-200"
                          : "bg-slate-50/80 border-slate-200/90 text-slate-700 shadow-2xs"
                      }`}
                    >
                      {keterangan ? (
                        keterangan
                      ) : (
                        <span className="text-slate-400 italic">
                          (Logbook kegiatan harian kosong)
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium px-1">
                      *Uraian logbook di atas otomatis terlampir dari kartu presensi dan akan disimpan saat menekan tombol simpan.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div
            className={`flex items-center justify-between gap-3 border-t p-3.5 sm:px-6 sm:py-4 shrink-0 ${
              darkMode ? "border-white/10 bg-[#161b22]" : "border-slate-100 bg-white"
            }`}
          >
            <p className="hidden items-center gap-1.5 text-[10.5px] font-semibold text-slate-400 sm:flex">
              Tekan
              <kbd
                className={`rounded-md border px-1.5 py-0.5 font-sans text-[9.5px] font-bold ${
                  darkMode
                    ? "border-white/10 bg-white/5 text-slate-300"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                Esc
              </kbd>
              untuk menutup
            </p>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className={`flex-1 sm:flex-initial rounded-xl border px-3.5 py-2 sm:px-4 sm:py-2 text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 cursor-pointer disabled:opacity-50 ${
                  darkMode
                    ? "bg-white/5 hover:bg-white/10 border-white/10 text-slate-300"
                    : "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700"
                }`}
              >
                Batal
              </button>

              {/* Tombol Kirim: Ukuran Kompak, Warna Senada dengan Tombol Dashboard, dan Icon Save */}
              <button
                type="button"
                onClick={kirim}
                disabled={saving || (!fileFoto && !preview)}
                className="flex-1 sm:flex-initial group inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-[#0B1442] to-[#1E3A8A] text-white font-bold text-xs px-4 py-2 sm:px-4.5 sm:py-2 shadow-md border border-white/10 transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                    <span>Menyimpan Presensi...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110 text-white" />
                    <span>
                      {isMasuk ? "Kirim Presensi Masuk" : "Simpan Pulang & Logbook"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AbsenKameraModal;