import { useState, useEffect, useRef } from "react";
import AdminLayout from "../../layouts/AdminLayout";
import { useManajemenTheme } from "../../context/useManajemenTheme";
import {
  getPengaturanPenilaian,
  updatePengaturanPenilaian,
  getAllRekapPenilaianAdmin,
} from "../../services/penilaianService";
import { toastError } from "../../utils/swal";
import {
  BobotStatsCards,
  BobotFormCard,
  BobotSimulasiRumusCard,
  BobotPredikatPedomanCard,
} from "../../components/manajemen/admin/pengaturanBobot";

const DEFAULT_BOBOT = {
  bobot_profesional: 35,
  bobot_personal: 25,
  bobot_sosial: 20,
  bobot_administratif: 20,
  daftar_indikator: "",
};

export const PengaturanBobotPenilaianPage = () => {
  const { isDark } = useManajemenTheme();

  const [bobot, setBobot] = useState(DEFAULT_BOBOT);
  const [stats, setStats] = useState({
    totalPeserta: 0,
    transkripTerbit: 0,
    rataRataNilai: "0.00",
  });
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState("saved"); // "idle" | "saving" | "saved" | "error"
  const isInitialLoad = useRef(true);

  const fetchBobot = async () => {
    setLoading(true);
    try {
      const [resBobot, resRekap] = await Promise.allSettled([
        getPengaturanPenilaian(),
        getAllRekapPenilaianAdmin(),
      ]);

      if (resBobot.status === "fulfilled" && resBobot.value.data?.data) {
        const d = resBobot.value.data.data;
        setBobot({
          bobot_profesional: Number(d.bobot_profesional) || 35,
          bobot_personal: Number(d.bobot_personal) || 25,
          bobot_sosial: Number(d.bobot_sosial) || 20,
          bobot_administratif: Number(d.bobot_administratif) || 20,
          daftar_indikator: d.daftar_indikator || "",
        });
      }

      if (resRekap.status === "fulfilled" && resRekap.value.data?.data) {
        const list = resRekap.value.data.data || [];
        const totalPeserta = list.length;
        const transkripTerbit = list.filter((r) => r.status_penilaian === "final").length;
        const nilaiFinal = list
          .filter((r) => r.nilai_akhir_angka != null && r.status_penilaian === "final")
          .map((r) => Number(r.nilai_akhir_angka));
        const rataRataNilai =
          nilaiFinal.length > 0
            ? (nilaiFinal.reduce((a, b) => a + b, 0) / nilaiFinal.length).toFixed(2)
            : "0.00";

        setStats({
          totalPeserta,
          transkripTerbit,
          rataRataNilai,
        });
      }
    } catch {
      toastError("Gagal memuat konfigurasi bobot penilaian");
    } finally {
      setLoading(false);
      setTimeout(() => {
        isInitialLoad.current = false;
      }, 100);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBobot();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const totalBobot =
    Number(bobot.bobot_profesional || 0) +
    Number(bobot.bobot_personal || 0) +
    Number(bobot.bobot_sosial || 0) +
    Number(bobot.bobot_administratif || 0);

  const isTotalValid = Math.abs(totalBobot - 100) < 0.01;

  // Debounced Auto-Save when isTotalValid (100%)
  useEffect(() => {
    if (isInitialLoad.current || loading || !isTotalValid) return;

    const debounceTimer = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        await updatePengaturanPenilaian(bobot);
        setSaveStatus("saved");
      } catch (err) {
        setSaveStatus("error");
        toastError(err.response?.data?.message || "Gagal menyimpan perubahan bobot otomatis");
      }
    }, 600);

    return () => clearTimeout(debounceTimer);
  }, [bobot, isTotalValid, loading]);

  const handleSetPreset = (presetObj) => {
    setBobot(presetObj);
  };

  const updateField = (field, val) => {
    if (field === "daftar_indikator") {
      setBobot((prev) => ({ ...prev, daftar_indikator: val }));
      return;
    }
    const num = Math.min(100, Math.max(0, Number(val) || 0));
    setBobot((prev) => ({ ...prev, [field]: num }));
  };

  return (
    <AdminLayout showSearch={false}>
      <div className="space-y-5 sm:space-y-6 animate-[fadeslide_0.35s_ease-out]">
        {/* Page Header (Judul Halaman di Atas) */}
        <div>
          <h2 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? "text-slate-100" : "text-[#0B1442]"}`}>
            Pengaturan Bobot Penilaian
          </h2>
          <p className={`mt-1 sm:mt-1.5 text-[11px] sm:text-xs max-w-4xl leading-relaxed ${isDark ? "text-slate-400" : "text-slate-500"}`}>
            <span className="inline sm:hidden">Atur proporsi persentase 4 pilar kompetensi nilai magang.</span>
            <span className="hidden sm:inline">Konfigurasikan proporsi bobot persentase dari 4 pilar kompetensi yang menjadi dasar kalkulasi nilai akhir dan transkrip resmi magang Diskominfo.</span>
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400 text-sm gap-2.5">
            <div className="h-4 w-4 rounded-full border-2 border-[#004F9F] border-t-transparent animate-spin" />
            Memuat data pengaturan bobot penilaian...
          </div>
        ) : (
          <div className="space-y-5 sm:space-y-6 animate-[fadeslide_0.3s_ease-out]">
            {/* 4 STATS CARDS (DATA EVALUASI AKTUAL) */}
            <BobotStatsCards
              stats={stats}
              bobot={bobot}
              isDark={isDark}
            />

            {/* GRID: KONFIGURASI BOBOT 4 PILAR (KIRI) & SIMULASI RUMUS (KANAN) */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-5 items-start">
              {/* Kolom Kiri: Card Konfigurasi Bobot 4 Pilar (7 cols pada XL, 8 cols pada 2XL) */}
              <div className="xl:col-span-7 2xl:col-span-8">
                <BobotFormCard
                  bobot={bobot}
                  updateField={updateField}
                  totalBobot={totalBobot}
                  isTotalValid={isTotalValid}
                  onSetPreset={handleSetPreset}
                  saveStatus={saveStatus}
                  isDark={isDark}
                />
              </div>

              {/* Kolom Kanan: Simulasi Kalkulasi & Pedoman Rentang Nilai (5 cols pada XL, 4 cols pada 2XL) */}
              <div className="xl:col-span-5 2xl:col-span-4 space-y-4 sm:space-y-5">
                <BobotSimulasiRumusCard
                  bobot={bobot}
                  isDark={isDark}
                />

                <BobotPredikatPedomanCard
                  isDark={isDark}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PengaturanBobotPenilaianPage;
