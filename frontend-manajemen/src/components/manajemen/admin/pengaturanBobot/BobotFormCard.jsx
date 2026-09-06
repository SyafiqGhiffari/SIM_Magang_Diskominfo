import { useState } from "react";
import {
  Briefcase, UserCheck, Users, ClipboardCheck,
  Plus, Minus, Check, X, Pencil, Trash2, SlidersHorizontal,
  CheckCircle2, AlertTriangle, Sparkles, Equal, Loader2, Lock, RotateCcw
} from "lucide-react";
import { confirmDialog, toastSuccess, toastError } from "../../../../utils/swal";

const DEFAULT_INDIKATOR_MAP = {
  profesional: [
    { id: "prof_1", teks: "Kemampuan memahami tugas yang diberikan" },
    { id: "prof_2", teks: "Kemampuan melaksanakan tugas" },
    { id: "prof_3", teks: "Kemampuan menyelesaikan tugas tepat waktu" },
    { id: "prof_4", teks: "Kualitas hasil pekerjaan" },
  ],
  personal: [
    { id: "pers_1", teks: "Disiplin dan kepatuhan jam kerja magang" },
    { id: "pers_2", teks: "Inisiatif dan kemandirian dalam bekerja" },
    { id: "pers_3", teks: "Tanggung jawab atas tugas yang diberikan" },
    { id: "pers_4", teks: "Sikap, etika, dan integritas kerja" },
  ],
  sosial: [
    { id: "sos_1", teks: "Kemampuan komunikasi dan adaptasi lingkungan" },
    { id: "sos_2", teks: "Kemampuan kerja sama tim (teamwork)" },
    { id: "sos_3", teks: "Menghargai rekan kerja dan staf dinas" },
  ],
  administratif: [
    { id: "adm_1", teks: "Kedisiplinan Presensi Kehadiran" },
    { id: "adm_2", teks: "Ketertiban Pengisian Logbook Jurnal Harian" },
    { id: "adm_3", teks: "Penyelesaian Penugasan Mandiri" },
    { id: "adm_4", teks: "Kualitas & Persetujuan Laporan Akhir Magang" },
  ],
};

const parseIndikatorData = (raw) => {
  if (!raw) return DEFAULT_INDIKATOR_MAP;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed)) {
      const map = { ...DEFAULT_INDIKATOR_MAP };
      parsed.forEach((cat) => {
        if (cat.kategori && Array.isArray(cat.items) && cat.items.length > 0) {
          map[cat.kategori] = cat.items;
        }
      });
      return map;
    }
  } catch (e) {
    console.error("Error parsing indikator:", e);
  }
  return DEFAULT_INDIKATOR_MAP;
};

const serializeIndikatorData = (map) => {
  return JSON.stringify([
    {
      kategori: "profesional",
      judul_kategori: "Kompetensi Profesional",
      items: map.profesional || DEFAULT_INDIKATOR_MAP.profesional,
    },
    {
      kategori: "personal",
      judul_kategori: "Kompetensi Personal",
      items: map.personal || DEFAULT_INDIKATOR_MAP.personal,
    },
    {
      kategori: "sosial",
      judul_kategori: "Kompetensi Sosial",
      items: map.sosial || DEFAULT_INDIKATOR_MAP.sosial,
    },
    {
      kategori: "administratif",
      judul_kategori: "Kompetensi Administratif",
      items: DEFAULT_INDIKATOR_MAP.administratif,
    },
  ]);
};

export const BobotFormCard = ({
  bobot,
  updateField,
  totalBobot = 100,
  isTotalValid = true,
  onSetPreset,
  saveStatus = "saved",
  isDark = false,
}) => {
  const selisih = 100 - totalBobot;
  const isKelebihan = totalBobot > 100;

  // Indikator Map State (Parsed from bobot.daftar_indikator)
  const indikatorMap = parseIndikatorData(bobot.daftar_indikator);

  // Editing state: { kategori: null, id: null, teks: "" }
  const [editingItem, setEditingItem] = useState(null);
  // Adding state: { kategori: null, teks: "" }
  const [addingKategori, setAddingKategori] = useState(null);
  const [newTeks, setNewTeks] = useState("");

  const handleSaveIndikatorMap = (newMap) => {
    const serialized = serializeIndikatorData(newMap);
    updateField("daftar_indikator", serialized);
  };

  const handleStartAdd = (kategoriKey) => {
    setAddingKategori(kategoriKey);
    setNewTeks("");
    setEditingItem(null);
  };

  const handleCancelAdd = () => {
    setAddingKategori(null);
    setNewTeks("");
  };

  const handleConfirmAdd = (kategoriKey) => {
    const trimmed = newTeks.trim();
    if (!trimmed) {
      toastError("Teks butir penilaian tidak boleh kosong");
      return;
    }

    const currentItems = indikatorMap[kategoriKey] || [];
    if (currentItems.length >= 6) {
      toastError("Maksimal 6 butir penilaian per pilar agar transkrip tetap muat 1 halaman");
      return;
    }

    const nextIndex = currentItems.length + 1;
    const newItem = {
      id: `${kategoriKey}_${nextIndex}`,
      teks: trimmed,
    };

    const updated = {
      ...indikatorMap,
      [kategoriKey]: [...currentItems, newItem],
    };

    handleSaveIndikatorMap(updated);
    setAddingKategori(null);
    setNewTeks("");
    toastSuccess("Butir penilaian berhasil ditambahkan");
  };

  const handleStartEdit = (kategoriKey, item) => {
    setEditingItem({ kategori: kategoriKey, id: item.id, teks: item.teks });
    setAddingKategori(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  const handleConfirmEdit = () => {
    if (!editingItem) return;
    const trimmed = editingItem.teks.trim();
    if (!trimmed) {
      toastError("Teks butir penilaian tidak boleh kosong");
      return;
    }

    const currentItems = indikatorMap[editingItem.kategori] || [];
    const updatedItems = currentItems.map((it) =>
      it.id === editingItem.id ? { ...it, teks: trimmed } : it
    );

    const updated = {
      ...indikatorMap,
      [editingItem.kategori]: updatedItems,
    };

    handleSaveIndikatorMap(updated);
    setEditingItem(null);
    toastSuccess("Butir penilaian berhasil diperbarui");
  };

  const handleDeleteItem = async (kategoriKey, itemId, itemTeks) => {
    const currentItems = indikatorMap[kategoriKey] || [];
    if (currentItems.length <= 2) {
      toastError("Minimal harus ada 2 butir penilaian dalam setiap pilar kompetensi");
      return;
    }

    const result = await confirmDialog({
      title: "Hapus Butir Penilaian?",
      text: `Yakin ingin menghapus butir: "${itemTeks}"?`,
      confirmText: "Ya, Hapus",
      icon: "warning",
      danger: true,
    });

    if (!result.isConfirmed) return;

    const updatedItems = currentItems.filter((it) => it.id !== itemId);
    const updated = {
      ...indikatorMap,
      [kategoriKey]: updatedItems,
    };

    handleSaveIndikatorMap(updated);
    toastSuccess("Butir penilaian berhasil dihapus");
  };

  const handleResetIndikatorBaku = async (kategoriKey) => {
    const result = await confirmDialog({
      title: "Kembalikan Butir ke Format Baku?",
      text: "Seluruh butir pada pilar ini akan diatur ulang ke butir standar bawaan Diskominfo.",
      confirmText: "Ya, Reset Format Baku",
      icon: "question",
    });

    if (!result.isConfirmed) return;

    const updated = {
      ...indikatorMap,
      [kategoriKey]: DEFAULT_INDIKATOR_MAP[kategoriKey],
    };

    handleSaveIndikatorMap(updated);
    toastSuccess("Butir penilaian dikembalikan ke format standar baku");
  };

  // 4 Pillars Configuration Data
  const pilarList = [
    {
      id: "bobot_profesional",
      kategoriKey: "profesional",
      pilar: "Pilar I",
      nama: "Kompetensi Profesional",
      deskripsi: "Kemampuan teknis operasional & mutu hasil pekerjaan di bawah bimbingan mentor dinas.",
      nilai: bobot.bobot_profesional,
      icon: Briefcase,
      presets: [25, 30, 35, 40, 45],
      isManual: true,
      subCardBg: isDark ? "bg-blue-950/20 border-blue-500/25 hover:border-blue-500/40" : "bg-blue-50/40 border-blue-200/80 hover:border-blue-300",
      badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/20",
      textAccent: "text-blue-600 dark:text-blue-400",
      gradStart: "#004F9F",
      gradEnd: "#00A5EC",
      thumbBorder: "[&::-webkit-slider-thumb]:border-[#004F9F] [&::-moz-range-thumb]:border-[#004F9F]",
      activePresetBg: "bg-blue-600 dark:bg-blue-600 text-white border border-blue-600",
      inputFocusClass: "hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-600 dark:focus:border-blue-400 focus:ring-blue-500/20",
      stepperHoverClass: "hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-950/30",
      btnAddClass: "hover:text-blue-700 dark:hover:text-blue-300 hover:border-blue-300 dark:hover:border-blue-700",
      addIconColor: "text-blue-600 dark:text-blue-400",
      btnResetClass: "hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40",
      addFormBg: "bg-blue-50/90 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800/60",
      addBtnSave: "bg-blue-600 hover:bg-blue-700",
      iconBg: "bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-xs",
      numberPill: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
      items: indikatorMap.profesional || DEFAULT_INDIKATOR_MAP.profesional,
    },
    {
      id: "bobot_personal",
      kategoriKey: "personal",
      pilar: "Pilar II",
      nama: "Kompetensi Personal",
      deskripsi: "Kedisiplinan jam kerja, integritas, inisiatif, dan etika perilaku kerja peserta magang.",
      nilai: bobot.bobot_personal,
      icon: UserCheck,
      presets: [15, 20, 25, 30, 35],
      isManual: true,
      subCardBg: isDark ? "bg-emerald-950/20 border-emerald-500/25 hover:border-emerald-500/40" : "bg-emerald-50/40 border-emerald-200/80 hover:border-emerald-300",
      badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20",
      textAccent: "text-emerald-600 dark:text-emerald-400",
      gradStart: "#047857",
      gradEnd: "#10b981",
      thumbBorder: "[&::-webkit-slider-thumb]:border-emerald-600 [&::-moz-range-thumb]:border-emerald-600",
      activePresetBg: "bg-emerald-600 dark:bg-emerald-600 text-white border border-emerald-600",
      inputFocusClass: "hover:border-emerald-400 dark:hover:border-emerald-500 focus:border-emerald-600 dark:focus:border-emerald-400 focus:ring-emerald-500/20",
      stepperHoverClass: "hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30",
      btnAddClass: "hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-300 dark:hover:border-emerald-700",
      addIconColor: "text-emerald-600 dark:text-emerald-400",
      btnResetClass: "hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
      addFormBg: "bg-emerald-50/90 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/60",
      addBtnSave: "bg-emerald-600 hover:bg-emerald-700",
      iconBg: "bg-gradient-to-br from-emerald-700 to-teal-600 text-white shadow-xs",
      numberPill: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40",
      items: indikatorMap.personal || DEFAULT_INDIKATOR_MAP.personal,
    },
    {
      id: "bobot_sosial",
      kategoriKey: "sosial",
      pilar: "Pilar III",
      nama: "Kompetensi Sosial",
      deskripsi: "Kemampuan komunikasi, kolaborasi tim (teamwork), dan adaptasi lingkungan dinas.",
      nilai: bobot.bobot_sosial,
      icon: Users,
      presets: [15, 20, 25, 30],
      isManual: true,
      subCardBg: isDark ? "bg-amber-950/20 border-amber-500/25 hover:border-amber-500/40" : "bg-amber-50/40 border-amber-200/80 hover:border-amber-300",
      badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
      textAccent: "text-amber-600 dark:text-amber-400",
      gradStart: "#d97706",
      gradEnd: "#f59e0b",
      thumbBorder: "[&::-webkit-slider-thumb]:border-amber-500 [&::-moz-range-thumb]:border-amber-500",
      activePresetBg: "bg-amber-500 dark:bg-amber-500 text-white border border-amber-500",
      inputFocusClass: "hover:border-amber-400 dark:hover:border-amber-500 focus:border-amber-500 dark:focus:border-amber-400 focus:ring-amber-500/20",
      stepperHoverClass: "hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-300 dark:hover:border-amber-700 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
      btnAddClass: "hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-300 dark:hover:border-amber-700",
      addIconColor: "text-amber-600 dark:text-amber-400",
      btnResetClass: "hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40",
      addFormBg: "bg-amber-50/90 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800/60",
      addBtnSave: "bg-amber-500 hover:bg-amber-600",
      iconBg: "bg-gradient-to-br from-amber-600 to-orange-500 text-white shadow-xs",
      numberPill: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800/40",
      items: indikatorMap.sosial || DEFAULT_INDIKATOR_MAP.sosial,
    },
    {
      id: "bobot_administratif",
      kategoriKey: "administratif",
      pilar: "Pilar IV",
      nama: "Kompetensi Administratif & Laporan",
      deskripsi: "Dihitung otomatis: Presensi kehadiran, logbook jurnal harian, & laporan akhir magang.",
      nilai: bobot.bobot_administratif,
      icon: ClipboardCheck,
      presets: [15, 20, 25, 30],
      isManual: false,
      subCardBg: isDark ? "bg-purple-950/20 border-purple-500/25 hover:border-purple-500/40" : "bg-purple-50/40 border-purple-200/80 hover:border-purple-300",
      badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 ring-1 ring-purple-500/20",
      textAccent: "text-purple-600 dark:text-purple-400",
      gradStart: "#7e22ce",
      gradEnd: "#a855f7",
      thumbBorder: "[&::-webkit-slider-thumb]:border-purple-600 [&::-moz-range-thumb]:border-purple-600",
      activePresetBg: "bg-purple-600 dark:bg-purple-600 text-white border border-purple-600",
      inputFocusClass: "hover:border-purple-400 dark:hover:border-purple-500 focus:border-purple-600 dark:focus:border-purple-400 focus:ring-purple-500/20",
      stepperHoverClass: "hover:text-purple-600 dark:hover:text-purple-400 hover:border-purple-300 dark:hover:border-purple-700 hover:bg-purple-50/50 dark:hover:bg-purple-950/30",
      btnAddClass: "hover:text-purple-700 dark:hover:text-purple-300 hover:border-purple-300 dark:hover:border-purple-700",
      addIconColor: "text-purple-600 dark:text-purple-400",
      btnResetClass: "hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40",
      addFormBg: "bg-purple-50/90 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/60",
      addBtnSave: "bg-purple-600 hover:bg-purple-700",
      iconBg: "bg-gradient-to-br from-purple-700 to-indigo-600 text-white shadow-xs",
      numberPill: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800/40",
      items: DEFAULT_INDIKATOR_MAP.administratif,
    },
  ];

  const adjustValue = (field, currentVal, delta) => {
    const nextVal = Math.min(100, Math.max(0, (Number(currentVal) || 0) + delta));
    updateField(field, nextVal);
  };

  const isBakuActive =
    bobot.bobot_profesional === 35 &&
    bobot.bobot_personal === 25 &&
    bobot.bobot_sosial === 20 &&
    bobot.bobot_administratif === 20;

  const isBagiRataActive =
    bobot.bobot_profesional === 25 &&
    bobot.bobot_personal === 25 &&
    bobot.bobot_sosial === 25 &&
    bobot.bobot_administratif === 25;

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 shadow-sm transition-all duration-300 space-y-4 ${
        isDark
          ? "border-white/10 bg-[#161b22]"
          : "border-slate-200/80 bg-white"
      }`}
    >
      {/* Unified Card Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0B1442] to-[#004F9F] text-white shadow-sm">
            <SlidersHorizontal className="w-4.5 h-4.5" />
          </span>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
              Konfigurasi Bobot 4 Pilar Kompetensi
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Sesuaikan bobot persentase & kelola butir penilaian tiap pilar. Otomatis tersimpan saat total 100%.
            </p>
          </div>
        </div>

        {/* Auto-Save Status Badge */}
        <div>
          {saveStatus === "saving" ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30 shadow-2xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Menyimpan...
            </span>
          ) : isTotalValid ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/30 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Tersimpan Otomatis
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500/30 shadow-2xs animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5" />
              {isKelebihan
                ? `Kelebihan +${Math.abs(selisih).toFixed(1)}%`
                : `Kekurangan -${Math.abs(selisih).toFixed(1)}%`}
            </span>
          )}
        </div>
      </div>

      {/* INTEGRATED TOTAL ACCUMULATOR COCKPIT */}
      <div
        className={`rounded-xl border p-3.5 sm:p-4 space-y-3 transition-all duration-200 ${
          isDark
            ? "bg-slate-900/60 border-white/5"
            : "bg-slate-50/80 border-slate-200/70"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Akumulasi Total:
            </span>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl sm:text-2xl font-black tabular-nums transition-colors duration-200 ${
                  isTotalValid
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {totalBobot.toFixed(1)}%
              </span>
              <span className="text-[11px] font-bold text-slate-400">/ 100.0%</span>
            </div>

            {isTotalValid ? (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Proporsi Valid
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                Wajib Tepat 100%
              </span>
            )}
          </div>

          {/* Quick Preset Format Buttons with Hover Animations */}
          {onSetPreset && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onSetPreset({ bobot_profesional: 35, bobot_personal: 25, bobot_sosial: 20, bobot_administratif: 20 })}
                className={`group inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                  isBakuActive
                    ? "bg-blue-600 dark:bg-blue-600 text-white shadow-md border border-blue-600"
                    : isDark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-xs border border-white/10"
                      : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-xs border border-slate-200/80"
                }`}
                title="Atur bobot baku resmi Diskominfo: 35% Prof, 25% Pers, 20% Sos, 20% Adm"
              >
                <Sparkles className={`w-3 h-3 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110 ${isBakuActive ? "text-amber-200" : "text-amber-500"}`} />
                Format Baku (35/25/20/20)
              </button>

              <button
                type="button"
                onClick={() => onSetPreset({ bobot_profesional: 25, bobot_personal: 25, bobot_sosial: 25, bobot_administratif: 25 })}
                className={`group inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                  isBagiRataActive
                    ? "bg-blue-600 dark:bg-blue-600 text-white shadow-md border border-blue-600"
                    : isDark
                      ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-xs border border-white/10"
                      : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:shadow-xs border border-slate-200/80"
                }`}
                title="Bagi rata 25% untuk setiap pilar"
              >
                <Equal className={`w-3 h-3 transition-transform duration-300 group-hover:scale-110 ${isBagiRataActive ? "text-sky-200" : "text-sky-500"}`} />
                Bagi Rata (25%)
              </button>
            </div>
          )}
        </div>

        {/* Segmented Progress Bar */}
        <div className="relative h-3.5 sm:h-4 w-full bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden flex shadow-inner p-0.5 gap-0.5">
          <div
            style={{ width: `${Math.max(0, bobot.bobot_profesional)}%` }}
            className="bg-gradient-to-r from-blue-700 via-blue-600 to-sky-500 transition-all duration-300 rounded-l-full relative flex items-center justify-center cursor-pointer"
            title={`Profesional: ${bobot.bobot_profesional}%`}
          >
            {bobot.bobot_profesional >= 10 && (
              <span className="text-[8.5px] font-black text-white drop-shadow-xs truncate px-0.5">
                {bobot.bobot_profesional}%
              </span>
            )}
          </div>
          <div
            style={{ width: `${Math.max(0, bobot.bobot_personal)}%` }}
            className="bg-gradient-to-r from-emerald-600 to-teal-400 transition-all duration-300 relative flex items-center justify-center cursor-pointer"
            title={`Personal: ${bobot.bobot_personal}%`}
          >
            {bobot.bobot_personal >= 10 && (
              <span className="text-[8.5px] font-black text-white drop-shadow-xs truncate px-0.5">
                {bobot.bobot_personal}%
              </span>
            )}
          </div>
          <div
            style={{ width: `${Math.max(0, bobot.bobot_sosial)}%` }}
            className="bg-gradient-to-r from-amber-500 to-orange-400 transition-all duration-300 relative flex items-center justify-center cursor-pointer"
            title={`Sosial: ${bobot.bobot_sosial}%`}
          >
            {bobot.bobot_sosial >= 10 && (
              <span className="text-[8.5px] font-black text-white drop-shadow-xs truncate px-0.5">
                {bobot.bobot_sosial}%
              </span>
            )}
          </div>
          <div
            style={{ width: `${Math.max(0, bobot.bobot_administratif)}%` }}
            className="bg-gradient-to-r from-purple-600 to-indigo-400 transition-all duration-300 rounded-r-full relative flex items-center justify-center cursor-pointer"
            title={`Administratif: ${bobot.bobot_administratif}%`}
          >
            {bobot.bobot_administratif >= 10 && (
              <span className="text-[8.5px] font-black text-white drop-shadow-xs truncate px-0.5">
                {bobot.bobot_administratif}%
              </span>
            )}
          </div>
        </div>

        {/* Legend Distribution Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
          <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/30 transition-all duration-200 hover:border-blue-300 dark:hover:border-blue-700">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate leading-none">
                I. Profesional
              </span>
              <span className="text-xs font-black text-blue-700 dark:text-blue-300 tabular-nums">
                {bobot.bobot_profesional}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/30 transition-all duration-200 hover:border-emerald-300 dark:hover:border-emerald-700">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate leading-none">
                II. Personal
              </span>
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 tabular-nums">
                {bobot.bobot_personal}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/30 transition-all duration-200 hover:border-amber-300 dark:hover:border-amber-700">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate leading-none">
                III. Sosial
              </span>
              <span className="text-xs font-black text-amber-700 dark:text-amber-300 tabular-nums">
                {bobot.bobot_sosial}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50/80 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-800/30 transition-all duration-200 hover:border-purple-300 dark:hover:border-purple-700">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block truncate leading-none">
                IV. Administratif
              </span>
              <span className="text-xs font-black text-purple-700 dark:text-purple-300 tabular-nums">
                {bobot.bobot_administratif}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars Full-Width Stacked Cards */}
      <div className="flex flex-col gap-4">
        {pilarList.map((item) => {
          const IconComponent = item.icon;
          const isAdding = addingKategori === item.kategoriKey;

          return (
            <div
              key={item.id}
              className={`flex flex-col rounded-2xl border p-4 sm:p-5 transition-all duration-200 shadow-2xs ${item.subCardBg}`}
            >
              <div className="space-y-3.5">
                {/* Header Sub-Block */}
                <div className="flex items-start sm:items-center justify-between gap-3 border-b pb-3 border-slate-200/70 dark:border-white/5">
                  <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl shadow-xs ${item.iconBg}`}
                    >
                      <IconComponent className="w-5 h-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${item.badgeBg}`}>
                          {item.pilar}
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 truncate">
                          {item.nama}
                        </h4>
                        {!item.isManual && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 shadow-2xs">
                            <Lock className="w-2.5 h-2.5" />
                            Otomatis Sistem
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {item.deskripsi}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="inline-flex items-baseline px-3 py-1 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-white/10 shadow-2xs">
                      <span className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tight ${item.textAccent}`}>
                        {item.nilai}
                      </span>
                      <span className="text-xs font-bold text-slate-400 ml-0.5">%</span>
                    </div>
                  </div>
                </div>

                {/* Slider & Stepper Controls Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-0.5">
                  {/* Steppers & Modern Custom Range Slider */}
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-1 min-w-0">
                    {/* Stepper Down with Hover Animation */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustValue(item.id, item.nilai, -5)}
                        className={`flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-[10.5px] font-black text-slate-600 dark:text-slate-300 ${item.stepperHoverClass} hover:-translate-y-0.5 hover:shadow-xs active:scale-90 transition-all duration-200 shadow-2xs`}
                        title="Kurangi 5%"
                      >
                        -5
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustValue(item.id, item.nilai, -1)}
                        className={`flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 ${item.stepperHoverClass} hover:-translate-y-0.5 hover:shadow-xs active:scale-90 transition-all duration-200 shadow-2xs`}
                        title="Kurangi 1%"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Modern Custom Range Slider with Dynamic Gradient & 3D Tactile Thumb */}
                    <div className="relative flex-1 flex items-center py-1">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={item.nilai}
                        onChange={(e) => updateField(item.id, e.target.value)}
                        style={{
                          background: `linear-gradient(to right, ${item.gradStart} 0%, ${item.gradEnd} ${item.nilai}%, ${isDark ? "#334155" : "#e2e8f0"} ${item.nilai}%, ${isDark ? "#334155" : "#e2e8f0"} 100%)`,
                        }}
                        className={`w-full cursor-pointer h-2.5 rounded-full appearance-none transition-all shadow-inner [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white dark:[&::-webkit-slider-thumb]:bg-slate-900 [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:active:cursor-grabbing [&::-webkit-slider-thumb]:hover:scale-115 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white dark:[&::-moz-range-thumb]:bg-slate-900 [&::-moz-range-thumb]:border-[3px] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:cursor-grab ${item.thumbBorder}`}
                      />
                    </div>

                    {/* Stepper Up with Hover Animation */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => adjustValue(item.id, item.nilai, 1)}
                        className={`flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 ${item.stepperHoverClass} hover:-translate-y-0.5 hover:shadow-xs active:scale-90 transition-all duration-200 shadow-2xs`}
                        title="Tambah 1%"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => adjustValue(item.id, item.nilai, 5)}
                        className={`flex h-7.5 w-7.5 cursor-pointer items-center justify-center rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-[10.5px] font-black text-slate-600 dark:text-slate-300 ${item.stepperHoverClass} hover:-translate-y-0.5 hover:shadow-xs active:scale-90 transition-all duration-200 shadow-2xs`}
                        title="Tambah 5%"
                      >
                        +5
                      </button>
                    </div>

                    {/* Direct Number Input */}
                    <div className="relative shrink-0">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={item.nilai}
                        onChange={(e) => updateField(item.id, e.target.value)}
                        className={`w-16 px-2 pr-5.5 py-1.5 rounded-lg border text-center font-black text-xs sm:text-sm tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none transition-all duration-200 focus:outline-hidden focus:ring-2 ${item.inputFocusClass} ${
                          isDark
                            ? "bg-slate-800 border-white/15 text-white"
                            : "bg-white border-slate-200 text-slate-900 shadow-2xs"
                        }`}
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 pointer-events-none select-none">
                        %
                      </span>
                    </div>
                  </div>

                  {/* Quick Preset Pills with Hover Animation */}
                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-0.5">
                      Preset:
                    </span>
                    {item.presets.map((pVal) => {
                      const isSelected = item.nilai === pVal;
                      return (
                        <button
                          key={pVal}
                          type="button"
                          onClick={() => updateField(item.id, pVal)}
                          className={`inline-flex cursor-pointer items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all duration-200 hover:-translate-y-0.5 active:scale-95 ${
                            isSelected
                              ? `${item.activePresetBg} font-black shadow-xs`
                              : isDark
                                ? "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white hover:shadow-xs"
                                : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:shadow-xs border border-slate-200/80 shadow-2xs"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          {pVal}%
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* BUTIR PENILAIAN SECTION */}
                <div className="space-y-2.5 pt-3 border-t border-slate-200/70 dark:border-white/5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                        Butir Indikator Penilaian ({item.items.length}):
                      </span>
                    </div>

                    {item.isManual && (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleStartAdd(item.kategoriKey)}
                          disabled={isAdding}
                          className={`group inline-flex cursor-pointer items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10.5px] font-bold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 ${item.btnAddClass} border border-slate-200 dark:border-white/10 shadow-2xs hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200`}
                          title="Tambah butir penilaian baru"
                        >
                          <Plus className={`w-3.5 h-3.5 ${item.addIconColor} transition-transform duration-300 group-hover:rotate-90 group-hover:scale-110`} />
                          Tambah Butir
                        </button>
                        <button
                          type="button"
                          onClick={() => handleResetIndikatorBaku(item.kategoriKey)}
                          className={`group inline-flex cursor-pointer items-center p-1.5 rounded-lg text-slate-400 ${item.btnResetClass} hover:-translate-y-0.5 hover:shadow-xs active:scale-90 transition-all duration-200`}
                          title="Kembalikan butir ke standar baku Diskominfo"
                        >
                          <RotateCcw className="w-3.5 h-3.5 transition-transform duration-500 group-hover:-rotate-180" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Inline Form Tambah Butir */}
                  {isAdding && (
                    <div className={`flex items-center gap-2 p-2.5 rounded-xl ${item.addFormBg} shadow-xs`}>
                      <input
                        type="text"
                        autoFocus
                        value={newTeks}
                        onChange={(e) => setNewTeks(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleConfirmAdd(item.kategoriKey);
                          if (e.key === "Escape") handleCancelAdd();
                        }}
                        placeholder="Ketik butir penilaian baru..."
                        className="w-full text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={() => handleConfirmAdd(item.kategoriKey)}
                        className={`flex h-7.5 w-7.5 shrink-0 cursor-pointer items-center justify-center rounded-lg ${item.addBtnSave} text-white hover:shadow-md hover:-translate-y-0.5 active:scale-90 transition-all duration-200 shadow-xs`}
                        title="Simpan Butir"
                      >
                        <Check className="w-4 h-4 stroke-[3]" />
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelAdd}
                        className="flex h-7.5 w-7.5 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 hover:shadow-xs hover:-translate-y-0.5 active:scale-90 transition-all duration-200"
                        title="Batal"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* List Items (Responsive 2-Column Clean Cards with Multi-line Wrapping) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.items.map((it, idx) => {
                      const isEditingThis =
                        editingItem &&
                        editingItem.kategori === item.kategoriKey &&
                        editingItem.id === it.id;

                      if (isEditingThis) {
                        return (
                          <div
                            key={it.id || idx}
                            className="col-span-1 sm:col-span-2 flex items-center gap-2 p-2 rounded-xl bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/60 shadow-xs"
                          >
                            <input
                              type="text"
                              autoFocus
                              value={editingItem.teks}
                              onChange={(e) =>
                                setEditingItem((prev) => ({
                                  ...prev,
                                  teks: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirmEdit();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                              className="w-full text-xs px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-hidden"
                            />
                            <button
                              type="button"
                              onClick={handleConfirmEdit}
                              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-md hover:-translate-y-0.5 active:scale-90 transition-all duration-200 shadow-xs"
                              title="Simpan Perubahan"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </button>
                            <button
                              type="button"
                              onClick={handleCancelEdit}
                              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-300 hover:shadow-xs hover:-translate-y-0.5 active:scale-90 transition-all duration-200"
                              title="Batal"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={it.id || idx}
                          className="group flex items-start justify-between gap-2 p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 hover:shadow-2xs transition-all duration-200"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] font-black border ${item.numberPill} mt-0.5`}>
                              {idx + 1}
                            </span>
                            <span className="text-[11.5px] font-medium text-slate-700 dark:text-slate-300 leading-snug break-words">
                              {it.teks}
                            </span>
                          </div>

                          {item.isManual && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(item.kategoriKey, it)}
                                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/60 text-slate-400 hover:text-blue-600 hover:-translate-y-0.5 hover:scale-110 active:scale-90 transition-all duration-200"
                                title="Edit butir penilaian"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteItem(item.kategoriKey, it.id, it.teks)}
                                className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md hover:bg-rose-100 dark:hover:bg-rose-900/60 text-slate-400 hover:text-rose-600 hover:-translate-y-0.5 hover:scale-110 active:scale-90 transition-all duration-200"
                                title="Hapus butir penilaian"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BobotFormCard;
