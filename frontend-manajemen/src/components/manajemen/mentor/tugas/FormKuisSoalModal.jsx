import { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  NotebookPen,
  ArrowLeft,
  Send,
  RefreshCw,
  Sparkles,
  Check,
  Plus,
  Trash2,
  Copy,
  CopyCheck,
  ChevronUp,
  ChevronDown,
  Clock,
  Target,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  SlidersHorizontal,
  AlignLeft,
  Repeat,
  Eye,
  Info,
  List,
  ListTodo,
  ListChecks,
  TextInitial,
  Image as ImageIcon,
} from "lucide-react";
import {
  createTugasMentor,
  updateTugasMentor
} from "../../../../services/pembelajaranService";
import { toastSuccess, toastError } from "../../../../utils/swal";
import { ModalSisipkanGambarSoal } from "./ModalSisipkanGambarSoal";

export const FormKuisSoalModal = ({
  isOpen = false,
  isEditing = false,
  selectedTugas = null,
  kuisInfo = {},
  kuisConfig,
  setKuisConfig,
  onBackToInfo,
  onClose,
  onSuccess,
  isDark = false,
}) => {
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [dropdownPercobaanOpen, setDropdownPercobaanOpen] = useState(false);
  const dropdownPercobaanRef = useRef(null);

  // Refs untuk elemen DOM kartu butir soal & toolbar melayang (digunakan untuk animasi swap & auto-scroll)
  const cardRefs = useRef({});
  const toolbarRefs = useRef({});
  const isSwappingRef = useRef(false);
  const scrollContainerRef = useRef(null);

  // State highlight untuk soal yang baru saja diduplikasi atau ditambahkan/disisipkan
  const [justDuplicatedId, setJustDuplicatedId] = useState(null);
  const [justAddedId, setJustAddedId] = useState(null);

  // State untuk modal sisipkan/kelola gambar butir soal
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageTargetIndex, setImageTargetIndex] = useState(null);

  // State untuk melacak butir soal yang sedang aktif dipilih mentor
  const [activeSoalIndex, setActiveSoalIndex] = useState(0);

  // State untuk dropdown tipe soal (Pilihan Ganda / Pilihan Ganda Kompleks / Esai) per butir soal
  const [openTypeDropdownIndex, setOpenTypeDropdownIndex] = useState(null);

  // State untuk dropdown penambahan soal pertama di header
  const [headerDropdownOpen, setHeaderDropdownOpen] = useState(false);
  const headerDropdownRef = useRef(null);

  // State untuk menu melayang tambah soal pada kartu soal tertentu
  const [activeAddMenuIndex, setActiveAddMenuIndex] = useState(null);
  const floatingMenuRef = useRef(null);

  // Close custom dropdown saat klik di luar area
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownPercobaanRef.current &&
        !dropdownPercobaanRef.current.contains(e.target)
      ) {
        setDropdownPercobaanOpen(false);
      }
      if (
        headerDropdownRef.current &&
        !headerDropdownRef.current.contains(e.target)
      ) {
        setHeaderDropdownOpen(false);
      }
      if (
        floatingMenuRef.current &&
        !floatingMenuRef.current.contains(e.target)
      ) {
        setActiveAddMenuIndex(null);
      }
      if (!e.target.closest("[data-type-dropdown]")) {
        setOpenTypeDropdownIndex(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Buka modal gambar untuk soal tertentu
  const openImageModal = (index) => {
    setImageTargetIndex(index);
    setImageModalOpen(true);
  };

  // Handler simpan / terapkan gambar dari ModalSisipkanGambarSoal
  const handleApplyGambar = (url) => {
    if (imageTargetIndex !== null) {
      updateSoal(imageTargetIndex, "gambar", url);
      setImageModalOpen(false);
      if (url) {
        toastSuccess(`Gambar berhasil dipasang pada butir soal #${imageTargetIndex + 1}`);
      } else {
        toastSuccess(`Gambar pada butir soal #${imageTargetIndex + 1} berhasil dihapus`);
      }
    }
  };

  // Opsi percobaan (pilihan 1 kali telah dihapus karena sudah diwakili oleh toggle Hak Remedial)
  const opsiMaksPercobaan = useMemo(
    () => [
      { value: 2, label: "2 Kali Percobaan" },
      { value: 3, label: "3 Kali Percobaan" },
      { value: 4, label: "4 Kali Percobaan" },
      { value: 0, label: "Tak Terbatas (Hingga Tuntas)" },
    ],
    []
  );

  const currentPercobaanLabel = useMemo(() => {
    const val = kuisConfig.maks_percobaan ?? 2;
    const found = opsiMaksPercobaan.find((o) => o.value === val);
    return found ? found.label : `${val} Kali Percobaan`;
  }, [kuisConfig.maks_percobaan, opsiMaksPercobaan]);

  const handleToggleRemidi = () => {
    const nextVal = !kuisConfig?.izinkan_remidi;
    setKuisConfig((prev) => ({
      ...prev,
      izinkan_remidi: nextVal,
      maks_percobaan:
        nextVal && (!prev.maks_percobaan || prev.maks_percobaan < 2)
          ? 2
          : prev.maks_percobaan,
    }));
  };

  const daftarSoal = useMemo(
    () => kuisConfig.daftar_soal || [],
    [kuisConfig.daftar_soal]
  );
  const jumlahSoal = daftarSoal.length;
  const jumlahPG = daftarSoal.filter((s) => s.tipe === "pilihan_ganda").length;
  const jumlahPGKompleks = daftarSoal.filter(
    (s) => s.tipe === "pilihan_ganda_kompleks"
  ).length;
  const jumlahEsai = daftarSoal.filter((s) => s.tipe === "esai").length;

  // Indeks butir soal aktif yang aman (terhindar dari out-of-bounds)
  const safeActiveIndex = Math.min(
    Math.max(0, activeSoalIndex),
    Math.max(0, (daftarSoal.length || 1) - 1)
  );

  // Hitung total poin soal secara real-time
  const totalPoin = useMemo(() => {
    return daftarSoal.reduce(
      (sum, s) => sum + (parseInt(s.poin, 10) || 0),
      0
    );
  }, [daftarSoal]);

  // Hitung progres pengisian butir soal & evaluasi Tahap 2 secara real-time (50% -> 100%)
  const progressTahap2 = useMemo(() => {
    let prog = 50; // Dasar 50% karena Tahap 1 telah selesai

    if (!daftarSoal || daftarSoal.length === 0) {
      return 50;
    }

    // 1. Evaluasi Kelengkapan Pertanyaan (Maks 15%)
    const validQuestions = daftarSoal.filter(
      (s) => (s.pertanyaan || "").trim().length >= 3
    ).length;
    const rasioPertanyaan = validQuestions / daftarSoal.length;
    prog += Math.round(rasioPertanyaan * 15);

    // 2. Evaluasi Kelengkapan Opsi Jawaban (Maks 15%)
    let totalOpsiValidScore = 0;
    daftarSoal.forEach((s) => {
      if (s.tipe === "pilihan_ganda" || s.tipe === "pilihan_ganda_kompleks") {
        const opsi = s.opsi || [];
        if (opsi.length >= 2) {
          const opsiTerisi = opsi.filter(
            (o) => (o.teks || "").trim().length > 0
          ).length;
          // Ada opsi terisi & kunci jawaban valid
          const skorOpsi =
            (opsiTerisi / opsi.length) * (s.kunci_jawaban ? 1 : 0.8);
          totalOpsiValidScore += skorOpsi;
        }
      } else {
        // Untuk tipe esai, jika pertanyaan sudah ada maka opsi dianggap valid
        if ((s.pertanyaan || "").trim().length >= 3) {
          totalOpsiValidScore += 1;
        }
      }
    });
    const rasioOpsi = totalOpsiValidScore / daftarSoal.length;
    prog += Math.round(rasioOpsi * 15);

    // 3. Evaluasi Total Poin Soal (Target 100 Poin, Maks 20%)
    if (totalPoin > 0) {
      if (totalPoin === 100) {
        prog += 20;
      } else if (totalPoin < 100) {
        prog += Math.round((totalPoin / 100) * 18);
      } else {
        // Melebihi 100 poin
        prog += 15;
      }
    }

    // Cek apakah seluruh butir soal sudah 100% lengkap dan valid
    const semuaPertanyaanValid =
      daftarSoal.length > 0 &&
      daftarSoal.every((s) => (s.pertanyaan || "").trim().length > 0);
    const semuaOpsiValid = daftarSoal.every((s) => {
      if (s.tipe !== "pilihan_ganda" && s.tipe !== "pilihan_ganda_kompleks") return true;
      const opts = s.opsi || [];
      return (
        opts.length >= 2 &&
        opts.every((o) => (o.teks || "").trim().length > 0) &&
        !!s.kunci_jawaban
      );
    });

    if (semuaPertanyaanValid && semuaOpsiValid && totalPoin === 100) {
      return 100;
    }

    return Math.min(98, Math.max(50, prog));
  }, [daftarSoal, totalPoin]);

  // Handler update konfigurasi aturan kuis (durasi, kkm, remidi)
  const handleConfigChange = (field, value) => {
    setKuisConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Tambah butir soal baru (dapat disisipkan tepat di bawah soal aktif / afterIndex) dengan auto-scroll dan animasi muncul seperti duplikasi
  const tambahSoal = (tipe = "pilihan_ganda", afterIndex = null) => {
    const sisaPoin = Math.max(0, 100 - totalPoin);
    const defaultPoin = sisaPoin > 0 && sisaPoin <= 50 ? sisaPoin : 20;

    const isChoiceType =
      tipe === "pilihan_ganda" || tipe === "pilihan_ganda_kompleks";

    const newId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newQuestion = {
      id: newId,
      pertanyaan: "",
      tipe,
      poin: defaultPoin,
      gambar: "",
      // Saat awal tambah pilihan ganda / kompleks, sediakan 1 pilihan jawaban saja
      opsi: isChoiceType
        ? [
            { key: "A", teks: "" },
          ]
        : [],
      kunci_jawaban: isChoiceType ? "A" : "",
      pembahasan: "",
      petunjuk_penilaian: "",
    };

    const currentList = kuisConfig.daftar_soal || [];

    // Jika belum ada butir soal sama sekali (0 butir), langsung tambahkan kartu perdana
    if (currentList.length === 0) {
      setKuisConfig((prev) => ({
        ...prev,
        daftar_soal: [newQuestion],
      }));
      setActiveSoalIndex(0);
      setJustAddedId(newId);

      setTimeout(() => {
        setJustAddedId((curr) => (curr === newId ? null : curr));
      }, 2400);

      if (errors?.kuis) {
        setErrors((prev) => ({ ...prev, kuis: null }));
      }
      return;
    }

    const isInsert =
      afterIndex !== null && afterIndex >= 0 && afterIndex < currentList.length;
    const targetIndex = isInsert ? afterIndex + 1 : currentList.length;
    const referenceIndex = isInsert ? afterIndex : currentList.length - 1;
    const referenceCard = cardRefs.current[referenceIndex];

    // 1. Gulir viewport ke bawah terlebih dahulu ke posisi tempat kartu baru akan muncul
    if (scrollContainerRef.current) {
      const scrollAmount = referenceCard
        ? Math.min(Math.max(referenceCard.offsetHeight * 0.75, 260), 420)
        : 300;
      scrollContainerRef.current.scrollBy({
        top: scrollAmount,
        behavior: "smooth",
      });
    } else if (referenceCard) {
      referenceCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // 2. Beri jeda (350ms) agar viewport selesai auto-scroll ke bawah, BARU kemudian sisipkan kartu soal baru
    setTimeout(() => {
      setKuisConfig((prev) => {
        const list = [...(prev.daftar_soal || [])];
        if (isInsert) {
          list.splice(afterIndex + 1, 0, newQuestion);
        } else {
          list.push(newQuestion);
        }
        return { ...prev, daftar_soal: list };
      });

      // Pindahkan fokus aktif ke soal yang baru dibuat
      setActiveSoalIndex(targetIndex);
      setJustAddedId(newId);

      // Pastikan kartu baru terfokus rapi di viewport
      setTimeout(() => {
        const newCard = cardRefs.current[targetIndex];
        if (newCard) {
          newCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 60);

      // Hapus status highlight setelah 2.4 detik
      setTimeout(() => {
        setJustAddedId((curr) => (curr === newId ? null : curr));
      }, 2400);
    }, 350);

    if (errors?.kuis) {
      setErrors((prev) => ({ ...prev, kuis: null }));
    }
  };

  // Duplikasi soal dengan auto-scroll dan animasi muncul
  // Duplikasi soal: auto-scroll ke bawah dulu, baru kartu duplikasi muncul
  const handleDuplikasiAnimasi = (index) => {
    const target = kuisConfig.daftar_soal[index];
    if (!target) return;
    const newId = `q-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const duplicated = {
      ...target,
      id: newId,
      opsi: target.opsi ? target.opsi.map((o) => ({ ...o })) : [],
    };

    const currentCard = cardRefs.current[index];

    // 1. Gulir viewport ke bawah terlebih dahulu ke posisi tempat kartu baru akan muncul
    if (scrollContainerRef.current) {
      const scrollAmount = currentCard
        ? Math.min(Math.max(currentCard.offsetHeight * 0.75, 260), 420)
        : 300;
      scrollContainerRef.current.scrollBy({
        top: scrollAmount,
        behavior: "smooth",
      });
    } else if (currentCard) {
      currentCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    // 2. Beri jeda (360ms) agar viewport selesai auto-scroll ke bawah, BARU kemudian sisipkan kartu duplikasi
    setTimeout(() => {
      setKuisConfig((prev) => {
        const nextList = [...prev.daftar_soal];
        nextList.splice(index + 1, 0, duplicated);
        return { ...prev, daftar_soal: nextList };
      });
      setActiveSoalIndex(index + 1);
      setJustDuplicatedId(newId);

      // Pastikan kartu baru terfokus rapi
      setTimeout(() => {
        const newCard = cardRefs.current[index + 1];
        if (newCard) {
          newCard.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 60);

      // Hapus status highlight setelah 2.4 detik
      setTimeout(() => {
        setJustDuplicatedId((curr) => (curr === newId ? null : curr));
      }, 2400);
    }, 360);
  };

  // Geser urutan soal dengan urutan animasi:
  // 1. Toolbar mengambang hilang dulu dengan animasi (fade + scale out)
  // 2. Kolom soal terangkat dan bertukar posisi (swap)
  // 3. Setelah kolom mendarat di posisi baru, toolbar muncul kembali dengan animasi pop-in
  const handleGeserAnimasi = (index, arah) => {
    const newIndex = index + arah;
    if (
      newIndex < 0 ||
      newIndex >= kuisConfig.daftar_soal.length ||
      isSwappingRef.current
    ) {
      return;
    }

    const cardBoxFrom = cardRefs.current[index];
    const cardBoxTo = cardRefs.current[newIndex];
    const toolbarFrom = toolbarRefs.current[index];

    if (!cardBoxFrom || !cardBoxTo) {
      geserSoal(index, arah);
      return;
    }

    isSwappingRef.current = true;
    setActiveAddMenuIndex(null);
    setOpenTypeDropdownIndex(null);

    // Durasi per fase animasi (ultra-smooth & responsif)
    const FADE_OUT_MS = 140;
    const SWAP_MS = 480;
    const EASING_CURVE = "cubic-bezier(0.22, 1, 0.36, 1)";

    // ── FASE 1: Button mengambang menghilang dulu dengan animasi ──
    if (toolbarFrom) {
      toolbarFrom.style.transition = `opacity ${FADE_OUT_MS}ms cubic-bezier(0.4, 0, 0.2, 1), transform ${FADE_OUT_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`;
      toolbarFrom.style.opacity = "0";
      toolbarFrom.style.transform = "scale(0.8)";
    }

    // ── FASE 2: Setelah button mengambang hilang, jalankan animasi kolom soal terangkat & viewport ikut meluncur ──
    setTimeout(() => {
      const fromRect = cardBoxFrom.getBoundingClientRect();
      const toRect = cardBoxTo.getBoundingClientRect();
      const distance = toRect.top - fromRect.top;

      // Row containers untuk mengisolasi stacking context z-index
      const rowFrom = cardBoxFrom.closest(".group\\/soal") || cardBoxFrom.parentElement;
      const rowTo = cardBoxTo.closest(".group\\/soal") || cardBoxTo.parentElement;

      if (rowFrom) rowFrom.style.zIndex = "30";
      if (rowTo) rowTo.style.zIndex = "10";

      // 1. Kolom/kotak soal yang aktif: HANYA KOTAK INI YANG KEANGKAT (scale lembut menjauh dari toolbar + bayangan melayang Kominfo)
      const shadowStyle = isDark
        ? "0 22px 42px -8px rgba(0, 165, 236, 0.35), 0 10px 22px -4px rgba(0, 0, 0, 0.5)"
        : "0 22px 42px -8px rgba(0, 79, 159, 0.28), 0 10px 20px -4px rgba(15, 23, 42, 0.1)";

      cardBoxFrom.style.transformOrigin = "left center";
      cardBoxFrom.style.transition = `transform ${SWAP_MS}ms ${EASING_CURVE}, box-shadow ${SWAP_MS}ms ${EASING_CURVE}`;
      cardBoxFrom.style.zIndex = "30";
      cardBoxFrom.style.boxShadow = shadowStyle;
      cardBoxFrom.style.transform = `translateY(${distance}px) scale(1.018)`;

      // 2. Kolom/kotak soal lawan: mengalah di bawah (meredup halus dan sedikit menyusut)
      cardBoxTo.style.transition = `transform ${SWAP_MS}ms ${EASING_CURVE}, opacity ${SWAP_MS}ms ease`;
      cardBoxTo.style.zIndex = "10";
      cardBoxTo.style.opacity = "0.7";
      cardBoxTo.style.transform = `translateY(${-distance}px) scale(0.985)`;

      // 3. Viewport scroll: Ikut bergerak meluncur secara real-time bersama kartu yang bergeser
      const container = scrollContainerRef.current;
      let scrollDelta = 0;
      if (container) {
        const containerRect = container.getBoundingClientRect();
        const viewportHeight = container.clientHeight;
        const maxScroll = container.scrollHeight - viewportHeight;

        // Jarak target slot kartu baru terhadap batas atas viewport container
        const targetTopInViewport = toRect.top - containerRect.top;

        // Ideal padding atas agar kartu tujuan mendarat nyaman di pandangan mentor
        const idealTop = 25;
        let targetDelta = targetTopInViewport - idealTop;

        // Jika kartu bergeser ke bawah dan tingginya muat utuh di viewport, pastikan bawahnya tidak terpotong
        if (arah > 0 && toRect.height < viewportHeight - 50) {
          const projectedBottom = idealTop + toRect.height;
          if (projectedBottom > viewportHeight - 30) {
            targetDelta += (projectedBottom - (viewportHeight - 30));
          }
        }

        // Batasi targetDelta dengan kapasitas scroll container
        if (targetDelta > 0) {
          const availableDown = Math.max(0, maxScroll - container.scrollTop);
          scrollDelta = Math.min(targetDelta, availableDown);
        } else if (targetDelta < 0) {
          scrollDelta = Math.max(targetDelta, -container.scrollTop);
        }

        // Jalankan animasi scroll container real-time sinkron dengan durasi swap kartu (SWAP_MS)
        if (scrollDelta !== 0) {
          const startScrollTop = container.scrollTop;
          let startTime = null;

          const stepScroll = (now) => {
            if (startTime === null) startTime = now;
            const elapsed = now - startTime;
            const progress = Math.min(1, elapsed / SWAP_MS);
            const ease = 1 - Math.pow(1 - progress, 3);
            container.scrollTop = startScrollTop + scrollDelta * ease;
            if (progress < 1) {
              requestAnimationFrame(stepScroll);
            }
          };
          requestAnimationFrame(stepScroll);
        }
      }

      // ── FASE 3: Setelah berhasil terangkat & mendarat di posisi baru, swap state & munculkan toolbar lagi ──
      setTimeout(() => {
        // Reset style inline kartu
        cardBoxFrom.style.transition = "none";
        cardBoxFrom.style.transform = "";
        cardBoxFrom.style.boxShadow = "";
        cardBoxFrom.style.zIndex = "";
        cardBoxFrom.style.transformOrigin = "";

        cardBoxTo.style.transition = "none";
        cardBoxTo.style.transform = "";
        cardBoxTo.style.opacity = "";
        cardBoxTo.style.zIndex = "";

        if (rowFrom) rowFrom.style.zIndex = "";
        if (rowTo) rowTo.style.zIndex = "";

        // Reset inline style pada toolbar awal
        if (toolbarFrom) {
          toolbarFrom.style.transition = "none";
          toolbarFrom.style.opacity = "";
          toolbarFrom.style.transform = "";
        }

        // Mutasi urutan di state React
        setKuisConfig((prev) => {
          const copy = [...prev.daftar_soal];
          const temp = copy[index];
          copy[index] = copy[newIndex];
          copy[newIndex] = temp;
          return { ...prev, daftar_soal: copy };
        });
        setActiveSoalIndex(newIndex);

        // Pastikan posisi scroll benar-benar berada di kartu tujuan (soal baru) dan munculkan toolbar
        requestAnimationFrame(() => {
          const targetCard = cardRefs.current[newIndex];
          if (targetCard && container) {
            const cRect = container.getBoundingClientRect();
            const cardR = targetCard.getBoundingClientRect();
            if (cardR.bottom > cRect.bottom - 20) {
              container.scrollTop += (cardR.bottom - (cRect.bottom - 20));
            } else if (cardR.top < cRect.top + 20) {
              container.scrollTop -= ((cRect.top + 20) - cardR.top);
            }
          }

          const newToolbar = toolbarRefs.current[newIndex] || toolbarFrom;
          if (newToolbar) {
            newToolbar.style.transition = "none";
            newToolbar.style.opacity = "0";
            newToolbar.style.transform = "scale(0.8)";

            requestAnimationFrame(() => {
              newToolbar.style.transition =
                "opacity 180ms cubic-bezier(0.16, 1, 0.3, 1), transform 180ms cubic-bezier(0.16, 1, 0.3, 1)";
              newToolbar.style.opacity = "1";
              newToolbar.style.transform = "scale(1)";

              setTimeout(() => {
                newToolbar.style.transition = "";
                newToolbar.style.opacity = "";
                newToolbar.style.transform = "";
                isSwappingRef.current = false;
              }, 190);
            });
          } else {
            isSwappingRef.current = false;
          }
        });
      }, SWAP_MS);
    }, FADE_OUT_MS);
  };

  // Toggle kunci jawaban untuk pilihan ganda kompleks (multi jawaban)
  const toggleKunciKompleks = (soalIndex, key) => {
    setKuisConfig((prev) => {
      const copy = [...prev.daftar_soal];
      const q = copy[soalIndex];
      const currentKeys = (q.kunci_jawaban || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

      let newKeys;
      if (currentKeys.includes(key)) {
        newKeys = currentKeys.filter((k) => k !== key);
      } else {
        newKeys = [...currentKeys, key];
      }
      newKeys.sort();
      copy[soalIndex] = { ...q, kunci_jawaban: newKeys.join(",") };
      return { ...prev, daftar_soal: copy };
    });
  };

  // Hapus soal
  const hapusSoal = (index) => {
    setKuisConfig((prev) => ({
      ...prev,
      daftar_soal: (prev.daftar_soal || []).filter((_, i) => i !== index),
    }));
    setActiveSoalIndex((prev) => {
      if (prev >= index) {
        return Math.max(0, prev - 1);
      }
      return prev;
    });
  };

  // Geser urutan soal
  const geserSoal = (index, arah) => {
    const newIndex = index + arah;
    if (newIndex < 0 || newIndex >= kuisConfig.daftar_soal.length) return;
    setKuisConfig((prev) => {
      const copy = [...prev.daftar_soal];
      const temp = copy[index];
      copy[index] = copy[newIndex];
      copy[newIndex] = temp;
      return { ...prev, daftar_soal: copy };
    });
    setActiveSoalIndex(newIndex);
  };

  // Update properti soal tertentu
  const updateSoal = (index, field, value) => {
    setKuisConfig((prev) => {
      const copy = [...prev.daftar_soal];
      copy[index] = { ...copy[index], [field]: value };
      return { ...prev, daftar_soal: copy };
    });
    if (errors?.kuis) {
      setErrors((prev) => ({ ...prev, kuis: null }));
    }
  };

  // Tambah opsi pilihan ganda
  const tambahOpsi = (soalIndex) => {
    setKuisConfig((prev) => {
      const copy = [...prev.daftar_soal];
      const q = copy[soalIndex];
      const currentOpts = q.opsi || [];
      if (currentOpts.length >= 6) return prev;
      const alphabet = "ABCDEF";
      const nextKey = alphabet[currentOpts.length] || "X";
      copy[soalIndex] = {
        ...q,
        opsi: [...currentOpts, { key: nextKey, teks: "" }],
      };
      return { ...prev, daftar_soal: copy };
    });
  };

  // Hapus opsi pilihan ganda
  const hapusOpsi = (soalIndex, optIndex) => {
    setKuisConfig((prev) => {
      const copy = [...prev.daftar_soal];
      const q = copy[soalIndex];
      if ((q.opsi || []).length <= 1) return prev;
      const alphabet = "ABCDEF";
      const filtered = q.opsi.filter((_, i) => i !== optIndex).map((o, idx) => ({
        ...o,
        key: alphabet[idx] || o.key,
      }));
      let newKunci = q.kunci_jawaban;
      if (!filtered.some((o) => o.key === newKunci)) {
        newKunci = filtered[0]?.key || "A";
      }
      copy[soalIndex] = {
        ...q,
        opsi: filtered,
        kunci_jawaban: newKunci,
      };
      return { ...prev, daftar_soal: copy };
    });
  };

  // Update teks opsi
  const updateOpsiTeks = (soalIndex, optIndex, teks) => {
    setKuisConfig((prev) => {
      const copy = [...prev.daftar_soal];
      const q = copy[soalIndex];
      const opts = [...(q.opsi || [])];
      opts[optIndex] = { ...opts[optIndex], teks };
      copy[soalIndex] = { ...q, opsi: opts };
      return { ...prev, daftar_soal: copy };
    });
    if (errors?.kuis) {
      setErrors((prev) => ({ ...prev, kuis: null }));
    }
  };

  // Submit Final Penugasan Kuis
  const handleSubmitKuis = async (e) => {
    e.preventDefault();

    if (jumlahSoal === 0) {
      toastError("Tambahkan minimal 1 butir pertanyaan kuis sebelum menerbitkan tugas.");
      return;
    }

    // Validasi akumulasi bobot poin harus tepat 100 poin
    if (totalPoin !== 100) {
      toastError(
        totalPoin < 100
          ? `Total akumulasi poin butir soal saat ini masih ${totalPoin} / 100 poin. Total poin harus tepat 100 poin (kurang ${100 - totalPoin} poin) untuk dapat menyimpan kuis.`
          : `Total akumulasi poin butir soal saat ini mencapai ${totalPoin} / 100 poin. Total poin tidak boleh melebihi 100 poin (kelebihan ${totalPoin - 100} poin) untuk dapat menyimpan kuis.`
      );
      return;
    }

    // Validasi butir soal
    for (let i = 0; i < daftarSoal.length; i++) {
      const s = daftarSoal[i];
      if (!s.pertanyaan || !s.pertanyaan.trim()) {
        toastError(`Pertanyaan nomor ${i + 1} masih kosong. Harap isi pertanyaan terlebih dahulu.`);
        return;
      }

      if (s.tipe === "pilihan_ganda" || s.tipe === "pilihan_ganda_kompleks") {
        const opsiKosong = (s.opsi || []).some((o) => !o.teks || !o.teks.trim());
        if (opsiKosong) {
          toastError(`Ada opsi jawaban nomor ${i + 1} yang masih kosong.`);
          return;
        }
        if (!s.kunci_jawaban || !s.kunci_jawaban.trim()) {
          toastError(
            s.tipe === "pilihan_ganda_kompleks"
              ? `Pilih minimal satu kunci jawaban benar untuk nomor ${i + 1}.`
              : `Tentukan kunci jawaban yang benar untuk nomor ${i + 1}.`
          );
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("tipe_tugas", "kuis");
      formData.append("judul", (kuisInfo.judul || "").trim());
      formData.append("deskripsi", (kuisInfo.deskripsi || "").trim());

      let targetPesertaVal = "semua_bimbingan";
      let targetJenjangVal = "semua";
      if (kuisInfo.sasaranPenerima === "spesifik") {
        targetPesertaVal = "spesifik";
        (kuisInfo.pesertaTerpilih || []).forEach((id) => {
          formData.append("peserta_ids[]", id);
        });
      } else if (kuisInfo.sasaranPenerima === "mahasiswa") {
        targetJenjangVal = "mahasiswa";
      } else if (kuisInfo.sasaranPenerima === "siswa") {
        targetJenjangVal = "siswa";
      }

      formData.append("target_peserta", targetPesertaVal);
      formData.append("target_jenjang", targetJenjangVal);

      if (kuisInfo.tenggatWaktu) {
        formData.append("tenggat_waktu", kuisInfo.tenggatWaktu);
      }
      formData.append("bobot_nilai", String(totalPoin || 100));

      // Simpan seluruh konfigurasi kuis (durasi, kkm, remidi, butir soal) ke format JSON
      const payloadKuis = {
        durasi_menit: kuisConfig.durasi_menit ?? 30,
        kkm: kuisConfig.kkm ?? 75,
        izinkan_remidi: !!kuisConfig.izinkan_remidi,
        maks_percobaan: kuisConfig.maks_percobaan ?? 2,
        tampilkan_pembahasan: !!kuisConfig.tampilkan_pembahasan,
        total_soal: jumlahSoal,
        total_poin: totalPoin,
        daftar_soal: daftarSoal,
      };

      formData.append("kuis_data", JSON.stringify(payloadKuis));

      if (isEditing && selectedTugas) {
        await updateTugasMentor(selectedTugas.id, formData);
        toastSuccess("Tugas kuis interaktif berhasil diperbarui");
      } else {
        await createTugasMentor(formData);
        toastSuccess("Penugasan kuis baru berhasil diterbitkan untuk peserta");
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error("Gagal menerbitkan tugas kuis:", err);
      const msg =
        err.response?.data?.message || "Terjadi kesalahan saat menyimpan kuis";
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs overflow-y-auto"
      onClick={() => {
        if (imageModalOpen) {
          setImageModalOpen(false);
        } else if (!submitting) {
          onClose();
        }
      }}
    >
      {/* ── KOTAK MODAL UTAMA RANCANG BUTIR SOAL (SEMBUNYI SAAT MODAL GAMBAR TERBUKA) ── */}
      <div
        className={`relative w-full max-w-5xl my-auto rounded-3xl shadow-2xl flex-col max-h-[92vh] overflow-hidden border-0 ${
          imageModalOpen
            ? "hidden"
            : "flex animate-[modalFadeUp_0.25s_ease-out]"
        } ${
          isDark
            ? "bg-[#141a24] text-slate-100 shadow-black/60"
            : "bg-white text-slate-900 shadow-slate-900/25"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER MODAL SIGNATURE KOMINFO ── */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#0B1442] via-[#101F5C] to-[#1E3A8A] px-6 py-4 sm:px-8 sm:py-5 shrink-0 border-0">
          {/* Ambient Glow */}
          <div className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-[#00A5EC]/20 blur-2xl pointer-events-none" />

          {/* Watermark Icon NotebookPen */}
          <NotebookPen
            className="absolute right-8 top-1/2 -translate-y-1/2 w-24 h-24 opacity-[0.07] text-sky-300 pointer-events-none rotate-6"
            strokeWidth={1}
          />

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <span className="relative flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md shadow-sm">
                <NotebookPen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                <span className="absolute -inset-0.5 rounded-2xl border border-[#00A5EC]/40 animate-pulse" />
              </span>
              <div>
                <div className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-[#00A5EC] mb-0.5 bg-white/10 border border-white/10 rounded-full px-2.5 py-0.5">
                  <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                  <span>
                    {isEditing ? "Perbarui Penugasan Kuis" : "Tahap 2 dari 2: Aturan Evaluasi & Butir Soal"}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white leading-tight">
                  {isEditing ? "Edit Aturan & Soal Kuis" : "Rancang Butir Soal & Evaluasi"}
                </h3>
                <p className="text-[11px] sm:text-xs text-white/75 mt-0.5 truncate max-w-md">
                  Tugas: <span className="font-semibold text-white">{kuisInfo.judul || "Kuis Interaktif"}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300 cursor-pointer shrink-0 disabled:opacity-50"
              title="Tutup (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── STEP PROGRESS INDICATOR ── */}
        <div className="px-6 sm:px-8 py-3.5 border-b border-slate-100 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-3 text-xs shrink-0">
          {/* Step 1: Selesai */}
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 rounded-xl bg-emerald-500 text-white text-xs font-black items-center justify-center shadow-md shadow-emerald-500/20 ring-2 ring-emerald-400/30 shrink-0">
              <Check className="w-4 h-4 stroke-[3]" />
            </span>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Selesai
              </span>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">
                Informasi &amp; Sasaran
              </p>
            </div>
          </div>

          {/* Progress Bar Connector Tengah */}
          <div className="flex-1 max-w-[140px] sm:max-w-[200px] md:max-w-xs mx-2 sm:mx-4 flex flex-col items-center gap-1">
            <div className="w-full flex items-center justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 px-0.5">
              <span className="text-[#004F9F] dark:text-[#00A5EC] font-semibold">
                Langkah 2 dari 2
              </span>
              <span
                className={`font-black ${
                  progressTahap2 === 100
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-[#004F9F] dark:text-[#00A5EC]"
                }`}
              >
                {progressTahap2}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-white/10 p-0.5 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full relative transition-all duration-500 ease-out shadow-xs ${
                  progressTahap2 === 100
                    ? "bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400"
                    : "bg-gradient-to-r from-emerald-500 via-[#004F9F] to-[#00A5EC]"
                }`}
                style={{ width: `${progressTahap2}%` }}
              >
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-xs" />
              </div>
            </div>
          </div>

          {/* Step 2: Aktif / Siap Terbit */}
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-7 w-7 rounded-xl text-white text-xs font-black items-center justify-center shadow-md shrink-0 transition-all duration-300 ${
                progressTahap2 === 100
                  ? "bg-emerald-500 shadow-emerald-500/25 ring-2 ring-emerald-400/30"
                  : "bg-gradient-to-tr from-[#004F9F] to-[#00A5EC] shadow-[#004F9F]/25 ring-2 ring-[#00A5EC]/30"
              }`}
            >
              {progressTahap2 === 100 ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : (
                2
              )}
            </span>
            <div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[10px] font-black uppercase tracking-wider ${
                    progressTahap2 === 100
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-[#004F9F] dark:text-[#00A5EC]"
                  }`}
                >
                  {progressTahap2 === 100 ? "Siap Terbit" : "Tahap 2"}
                </span>
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${
                    progressTahap2 === 100 ? "bg-emerald-500" : "bg-[#00A5EC]"
                  }`}
                />
              </div>
              <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight">
                Aturan &amp; Butir Soal
              </p>
            </div>
          </div>
        </div>

        {/* ── BODY FORMULIR PEMBUAT SOAL (SCROLLABLE) ── */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5 sm:p-7 custom-modal-scrollbar space-y-6"
        >
          {/* ── 1. PANEL PENGATURAN KUIS & REMIDI (Modern Card with SlidersHorizontal) ── */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 shadow-xs space-y-4 ${
              isDark
                ? "bg-white/[0.02] border-white/10"
                : "bg-slate-50/70 border-slate-200/90 shadow-slate-900/5"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#004F9F]/10 to-[#00A5EC]/15 dark:from-[#00A5EC]/20 dark:to-[#00A5EC]/5 border border-[#00A5EC]/20 text-[#004F9F] dark:text-[#00A5EC] shadow-2xs shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                    Aturan Evaluasi &amp; Batas Remidi Kuis
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Konfigurasikan durasi, standar kelulusan KKM, dan hak remedial peserta magang
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#00A5EC]/10 text-[#004F9F] dark:text-[#00A5EC] border border-[#00A5EC]/20 shrink-0">
                Konfigurasi
              </span>
            </div>

            <div className="flex flex-col md:flex-row gap-3.5 items-stretch">
              {/* Durasi Pengerjaan */}
              <div
                className={`p-3.5 rounded-2xl border transition-[flex-grow,flex-shrink,border-color,background-color] duration-300 ease-out md:flex-1 md:min-w-0 flex flex-col justify-between ${
                  isDark
                    ? "bg-slate-900/60 border-white/5 hover:border-white/10"
                    : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/50">
                        <Clock className="w-3.5 h-3.5" />
                      </span>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Durasi Kuis
                      </label>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      max="240"
                      value={kuisConfig.durasi_menit ?? 30}
                      onChange={(e) =>
                        handleConfigChange(
                          "durasi_menit",
                          Math.max(0, parseInt(e.target.value, 10) || 0)
                        )
                      }
                      className={`w-full h-9 pl-3 pr-12 text-xs font-black rounded-xl border ${
                        isDark
                          ? "bg-slate-900 border-white/10 text-white"
                          : "bg-slate-50/80 border-slate-200 text-slate-800"
                      } focus:outline-none focus:ring-2 focus:ring-[#00A5EC]/30 focus:border-[#00A5EC] transition-all`}
                    />
                    <span className="absolute right-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                      Menit
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 truncate">Isi 0 untuk tanpa batas waktu</p>
              </div>

              {/* Batas Kelulusan (KKM) */}
              <div
                className={`p-3.5 rounded-2xl border transition-[flex-grow,flex-shrink,border-color,background-color] duration-300 ease-out md:flex-1 md:min-w-0 flex flex-col justify-between ${
                  isDark
                    ? "bg-slate-900/60 border-white/5 hover:border-white/10"
                    : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/50">
                        <Target className="w-3.5 h-3.5" />
                      </span>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Batas Kelulusan (KKM)
                      </label>
                    </div>
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={kuisConfig.kkm ?? 75}
                      onChange={(e) =>
                        handleConfigChange(
                          "kkm",
                          Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 75))
                        )
                      }
                      className={`w-full h-9 pl-3 pr-12 text-xs font-black rounded-xl border ${
                        isDark
                          ? "bg-slate-900 border-white/10 text-white"
                          : "bg-slate-50/80 border-slate-200 text-slate-800"
                      } focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 transition-all`}
                    />
                    <span className="absolute right-3 text-[11px] font-bold text-slate-400 pointer-events-none">
                      Poin
                    </span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 truncate">Skor &lt; KKM berstatus Perlu Remidi</p>
              </div>

              {/* Hak Remedial */}
              <div
                className={`p-3.5 rounded-2xl border transition-[flex-grow,flex-shrink,border-color,background-color] duration-300 ease-out md:flex-1 md:min-w-0 flex flex-col justify-between ${
                  isDark
                    ? "bg-slate-900/60 border-white/5 hover:border-white/10"
                    : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/50">
                        <RotateCcw className="w-3.5 h-3.5" />
                      </span>
                      <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                        Hak Remedial
                      </label>
                    </div>
                  </div>
                  <div
                    className={`w-full h-9 pl-3 pr-2 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                      kuisConfig.izinkan_remidi
                        ? "bg-emerald-50/60 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-2xs"
                        : isDark
                        ? "bg-slate-900 border-white/10 text-slate-400"
                        : "bg-slate-50/80 border-slate-200 text-slate-600"
                    }`}
                  >
                    <span className="text-[11px] truncate select-none">
                      {kuisConfig.izinkan_remidi ? "Boleh Remidi" : "1x Saja (Final)"}
                    </span>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={kuisConfig.izinkan_remidi}
                      onClick={handleToggleRemidi}
                      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/30 hover:opacity-95 ${
                        kuisConfig.izinkan_remidi ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                      }`}
                      title={kuisConfig.izinkan_remidi ? "Matikan hak remedial" : "Aktifkan hak remedial"}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs pointer-events-none ${
                          kuisConfig.izinkan_remidi ? "translate-x-4.5" : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 truncate">Peserta boleh mengulang</p>
              </div>

              {/* Maksimal Percobaan (Smooth Horizontal Expansion Without Height Fluctuation) */}
              <div
                style={{
                  transition: "flex 280ms cubic-bezier(0.4, 0, 0.2, 1), max-width 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 200ms ease, margin 280ms cubic-bezier(0.4, 0, 0.2, 1)",
                  flex: kuisConfig.izinkan_remidi ? "1 1 0%" : "0 0 0%",
                  maxWidth: kuisConfig.izinkan_remidi ? "380px" : "0px",
                  marginLeft: kuisConfig.izinkan_remidi ? "0px" : "-14px",
                  opacity: kuisConfig.izinkan_remidi ? 1 : 0,
                  pointerEvents: kuisConfig.izinkan_remidi ? "auto" : "none",
                }}
                className={`min-w-0 ${
                  dropdownPercobaanOpen ? "overflow-visible z-30" : "overflow-hidden"
                }`}
              >
                <div
                  className={`w-full min-w-[200px] p-3.5 rounded-2xl border transition-colors duration-200 h-full flex flex-col justify-between ${
                    isDark
                      ? "bg-slate-900/60 border-white/5 hover:border-white/10"
                      : "bg-white border-slate-200/90 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/50">
                          <Repeat className="w-3.5 h-3.5" />
                        </span>
                        <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          Maks. Percobaan
                        </label>
                      </div>
                    </div>

                    {/* Custom Animated Dropdown */}
                    <div className="relative" ref={dropdownPercobaanRef}>
                      <button
                        type="button"
                        onClick={() => setDropdownPercobaanOpen((prev) => !prev)}
                        className={`w-full h-9 pl-3 pr-2.5 text-xs font-bold rounded-xl border flex items-center justify-between transition-all duration-200 cursor-pointer ${
                          dropdownPercobaanOpen
                            ? "border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/40 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200"
                            : isDark
                            ? "bg-slate-900 border-white/10 text-white hover:border-white/20"
                            : "bg-slate-50/80 border-slate-200 text-slate-800 hover:border-slate-300"
                        }`}
                      >
                        <span className="truncate whitespace-nowrap">{currentPercobaanLabel}</span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 text-amber-500 transition-transform duration-200 shrink-0 ml-1.5 ${
                            dropdownPercobaanOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {/* Animated Dropdown Menu List (Lebih lebar agar teks tidak wrap ke baris 2) */}
                      {dropdownPercobaanOpen && (
                        <div
                          className={`absolute right-0 mt-1.5 p-1.5 rounded-2xl border shadow-xl z-30 min-w-full w-[220px] sm:w-[235px] animate-[dropdownPop_0.18s_cubic-bezier(0.16,1,0.3,1)] origin-top-right backdrop-blur-md ${
                            isDark
                              ? "bg-[#18202F] border-white/10 shadow-black/60"
                              : "bg-white border-slate-200 shadow-slate-900/15"
                          }`}
                        >
                          <div className="space-y-0.5">
                            {opsiMaksPercobaan.map((opt) => {
                              const isSelected =
                                (kuisConfig.maks_percobaan ?? 2) === opt.value;
                              return (
                                <button
                                  key={opt.value}
                                  type="button"
                                  onClick={() => {
                                    handleConfigChange("maks_percobaan", opt.value);
                                    setDropdownPercobaanOpen(false);
                                  }}
                                  className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected
                                      ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 font-black"
                                      : isDark
                                      ? "text-slate-300 hover:bg-white/5 hover:text-white"
                                      : "text-slate-700 hover:bg-amber-50/70 hover:text-amber-800"
                                  }`}
                                >
                                  <span className="whitespace-nowrap">{opt.label}</span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 ml-2" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1.5 truncate">Batas repetisi pengerjaan kuis</p>
                </div>
              </div>
            </div>

            {/* Baris Tambahan: Tampilkan Pembahasan (Interactive Banner dengan Warna Biru Kominfo #004F9F) */}
            <div
              onClick={() => handleConfigChange("tampilkan_pembahasan", !kuisConfig.tampilkan_pembahasan)}
              className={`p-3 sm:px-4 sm:py-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-all duration-200 cursor-pointer ${
                kuisConfig.tampilkan_pembahasan
                  ? "bg-[#004F9F]/10 dark:bg-[#004F9F]/20 border-[#004F9F]/35 dark:border-[#004F9F]/50 shadow-xs"
                  : "bg-slate-50/60 dark:bg-white/[0.02] border-slate-200/80 dark:border-white/5 hover:border-[#004F9F]/40 dark:hover:border-[#004F9F]/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-xl border shrink-0 transition-all duration-200 ${
                    kuisConfig.tampilkan_pembahasan
                      ? "bg-[#004F9F] text-white border-transparent shadow-xs"
                      : "bg-slate-200/70 dark:bg-white/10 text-slate-400 border-slate-300/60 dark:border-white/10"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </span>
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    Tampilkan Kunci Jawaban &amp; Pembahasan Setelah Kuis Selesai
                  </p>
                  <p className="text-[10.5px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Peserta magang dapat melihat koreksi butir pertanyaan dan catatan pembahasan setelah mengirim kuis
                  </p>
                </div>
              </div>

              {/* iOS Style Switch Toggle (Biru Kominfo #004F9F) */}
              <div
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
                  kuisConfig.tampilkan_pembahasan
                    ? "bg-[#004F9F]"
                    : "bg-slate-300 dark:bg-slate-600"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform duration-200 shadow-xs ${
                    kuisConfig.tampilkan_pembahasan ? "translate-x-4.5" : "translate-x-1"
                  }`}
                />
              </div>
            </div>
          </div>

          {/* ── 2. PANEL PEMBUAT BUTIR SOAL KUIS (Modern Card Container) ── */}
          <div
            className={`p-4 sm:p-5 rounded-3xl border transition-all duration-200 shadow-xs space-y-4 ${
              isDark
                ? "bg-white/[0.02] border-white/10"
                : "bg-slate-50/70 border-slate-200/90 shadow-slate-900/5"
            }`}
          >
            {/* Header Panel Butir Soal */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-slate-200/70 dark:border-white/5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#004F9F]/10 to-[#00A5EC]/15 dark:from-[#00A5EC]/20 dark:to-[#00A5EC]/5 border border-[#00A5EC]/20 text-[#004F9F] dark:text-[#00A5EC] shadow-2xs shrink-0">
                  <List className="w-4 h-4" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                      Daftar Butir Soal Kuis
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#004F9F]/10 text-[#004F9F] dark:bg-[#00A5EC]/20 dark:text-[#00A5EC] border border-[#00A5EC]/20">
                      {jumlahSoal} Butir
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {jumlahPG} Pilihan Ganda • {jumlahPGKompleks} Pilihan Ganda Kompleks • {jumlahEsai} Isian/Esai
                  </p>
                </div>
              </div>

              {/* Action: Bobot Akumulasi & Tombol Dropdown Tambah Soal */}
              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                {/* Bobot Badge */}
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors duration-200 shadow-2xs ${
                    totalPoin === 100
                      ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                      : "bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                  }`}
                >
                  {totalPoin === 100 ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  )}
                  <span className="text-[11px] whitespace-nowrap">
                    Akumulasi Bobot: <strong className="font-black">{totalPoin}</strong> / 100 Poin
                  </span>
                </div>

                {/* Tombol Dropdown Tambah Soal (HANYA MUNCUL KETIKA BELUM ADA SOAL / 0 Butir) */}
                {daftarSoal.length === 0 && (
                  <div className="relative" ref={headerDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setHeaderDropdownOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#004F9F] text-white shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                      <span>Tambah Soal</span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${
                          headerDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {/* Menu Dropdown Pilihan */}
                    {headerDropdownOpen && (
                      <div
                        className={`absolute right-0 mt-2 w-64 rounded-2xl border p-1.5 shadow-xl z-30 transition-all animate-[modalFadeUp_0.15s_ease-out] ${
                          isDark
                            ? "bg-[#18202f] border-white/10 text-slate-200"
                            : "bg-white border-slate-200 text-slate-800 shadow-slate-900/15"
                        }`}
                      >
                        <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                          Pilih Jenis Soal
                        </div>
                        {/* 1. Pilihan Ganda Tunggal */}
                        <button
                          type="button"
                          onClick={() => {
                            tambahSoal("pilihan_ganda");
                            setHeaderDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group/item hover:bg-[#004F9F]/5 dark:hover:bg-[#00A5EC]/10 hover:translate-x-1 active:scale-[0.98]"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 group-hover/item:bg-[#004F9F] group-hover/item:text-white dark:group-hover/item:bg-[#00A5EC] dark:group-hover/item:text-slate-900 group-hover/item:border-[#004F9F] dark:group-hover/item:border-[#00A5EC] group-hover/item:scale-105 transition-all duration-200 shadow-2xs shrink-0">
                            <ListTodo className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover/item:text-[#004F9F] dark:group-hover/item:text-[#00A5EC] transition-colors duration-200">
                              Pilihan Ganda
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors duration-200">
                              Satu kunci jawaban benar (A, B, C, D)
                            </div>
                          </div>
                        </button>
                        {/* 2. Pilihan Ganda Kompleks */}
                        <button
                          type="button"
                          onClick={() => {
                            tambahSoal("pilihan_ganda_kompleks");
                            setHeaderDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group/item hover:bg-[#004F9F]/5 dark:hover:bg-[#00A5EC]/10 hover:translate-x-1 active:scale-[0.98]"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 group-hover/item:bg-[#004F9F] group-hover/item:text-white dark:group-hover/item:bg-[#00A5EC] dark:group-hover/item:text-slate-900 group-hover/item:border-[#004F9F] dark:group-hover/item:border-[#00A5EC] group-hover/item:scale-105 transition-all duration-200 shadow-2xs shrink-0">
                            <ListChecks className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover/item:text-[#004F9F] dark:group-hover/item:text-[#00A5EC] transition-colors duration-200">
                              Pilihan Ganda Kompleks
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors duration-200">
                              Bisa memilih lebih dari 1 kunci jawaban
                            </div>
                          </div>
                        </button>
                        {/* 3. Isian / Esai */}
                        <button
                          type="button"
                          onClick={() => {
                            tambahSoal("esai");
                            setHeaderDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-200 cursor-pointer group/item hover:bg-[#004F9F]/5 dark:hover:bg-[#00A5EC]/10 hover:translate-x-1 active:scale-[0.98]"
                        >
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 group-hover/item:bg-[#004F9F] group-hover/item:text-white dark:group-hover/item:bg-[#00A5EC] dark:group-hover/item:text-slate-900 group-hover/item:border-[#004F9F] dark:group-hover/item:border-[#00A5EC] group-hover/item:scale-105 transition-all duration-200 shadow-2xs shrink-0">
                            <TextInitial className="w-4 h-4" />
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover/item:text-[#004F9F] dark:group-hover/item:text-[#00A5EC] transition-colors duration-200">
                              Isian / Esai
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 group-hover/item:text-slate-600 dark:group-hover/item:text-slate-300 transition-colors duration-200">
                              Jawaban uraian / teks bebas
                            </div>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* List Soal Cards */}
            <div className="space-y-3.5 pb-72 sm:pb-80">
              {daftarSoal.length === 0 ? (
                <div
                  className={`py-12 px-6 rounded-3xl border border-dashed flex flex-col items-center justify-center text-center transition-all ${
                    isDark
                      ? "border-white/10 bg-slate-900/30"
                      : "border-slate-200/90 bg-white/70 shadow-xs"
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#004F9F]/10 to-[#00A5EC]/15 dark:from-[#00A5EC]/20 dark:to-[#00A5EC]/5 border border-[#00A5EC]/20 text-[#004F9F] dark:text-[#00A5EC] flex items-center justify-center mb-3.5 shadow-2xs">
                    <List className="w-6 h-6" />
                  </div>
                  <h5 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 mb-1.5">
                    Belum Ada Butir Soal Kuis
                  </h5>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
                    Silakan gunakan tombol dropdown <strong className="text-[#004F9F] dark:text-[#00A5EC] font-bold">Tambah Soal</strong> di pojok kanan atas untuk memilih jenis soal dan mulai menyusun butir kuis.
                  </p>
                </div>
              ) : (
                daftarSoal.map((soal, sIndex) => {
                  const isPG = soal.tipe === "pilihan_ganda";
                  const isPGKompleks = soal.tipe === "pilihan_ganda_kompleks";
                  const isChoice = isPG || isPGKompleks;
                  const isEsai = soal.tipe === "esai";
                  const isActive = sIndex === safeActiveIndex;
                  const isJustDuplicated = soal.id === justDuplicatedId;
                  const isJustAdded = soal.id === justAddedId;

                  return (
                    <div
                      key={soal.id || sIndex}
                      onClick={() => setActiveSoalIndex(sIndex)}
                      onFocusCapture={() => setActiveSoalIndex(sIndex)}
                      className="relative flex items-start gap-2.5 sm:gap-3 group/soal"
                    >
                      {/* Kartu Konten Soal Utama (Aktif memiliki aksen border kiri & shadow tegas) */}
                      <div
                        ref={(el) => {
                          cardRefs.current[sIndex] = el;
                        }}
                        className={`flex-1 min-w-0 p-5 rounded-3xl border transition-all duration-300 shadow-xs relative ${
                          isJustDuplicated
                            ? "ring-2 ring-emerald-500/70 shadow-lg shadow-emerald-500/20 animate-[modalFadeUp_0.35s_ease-out]"
                            : isJustAdded
                            ? "ring-2 ring-[#00A5EC]/80 shadow-lg shadow-[#00A5EC]/25 animate-[modalFadeUp_0.35s_ease-out]"
                            : ""
                        } ${
                          isActive
                            ? isDark
                              ? `bg-[#161b22] border-[#00A5EC]/60 border-l-[6px] border-l-[#00A5EC] shadow-md ${
                                  !isJustDuplicated && !isJustAdded
                                    ? "ring-1 ring-[#00A5EC]/20"
                                    : ""
                                } opacity-100`
                              : `bg-white border-[#004F9F]/50 border-l-[6px] border-l-[#004F9F] shadow-md ${
                                  !isJustDuplicated && !isJustAdded
                                    ? "ring-1 ring-[#004F9F]/15"
                                    : ""
                                } opacity-100`
                            : isDark
                            ? "bg-[#161b22]/70 border-white/10 hover:border-white/20 opacity-85 hover:opacity-100 cursor-pointer"
                            : "bg-white/80 border-slate-200/90 hover:border-slate-300 opacity-85 hover:opacity-100 cursor-pointer"
                        }`}
                      >
                        {/* Badge Animasi jika kartu baru saja diduplikasi */}
                        {isJustDuplicated && (
                          <div className="absolute -top-3 right-5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-md shadow-emerald-500/30 animate-bounce">
                            <CopyCheck className="w-3.5 h-3.5" />
                            <span>Hasil Duplikasi Baru</span>
                          </div>
                        )}

                        {/* Badge Animasi jika kartu baru saja ditambahkan / disisipkan */}
                        {isJustAdded && (
                          <div className="absolute -top-3 right-5 z-10 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-[#004F9F] to-[#00A5EC] text-white shadow-md shadow-[#004F9F]/30 animate-bounce">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Butir Soal Baru</span>
                          </div>
                        )}

                        {/* Header Kartu Soal */}
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`flex h-7 w-7 items-center justify-center rounded-xl text-xs font-black border transition-colors ${
                                isActive
                                  ? "bg-[#004F9F] text-white border-[#004F9F] dark:bg-[#00A5EC] dark:text-slate-900 dark:border-[#00A5EC]"
                                  : "bg-[#004F9F]/10 dark:bg-[#00A5EC]/20 text-[#004F9F] dark:text-[#00A5EC] border-[#00A5EC]/20"
                              }`}
                            >
                              #{sIndex + 1}
                            </span>

                            {/* Dropdown Tipe Soal (Pilihan Ganda / PG Kompleks / Isian Esai) */}
                            <div className="relative" data-type-dropdown>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenTypeDropdownIndex(
                                    openTypeDropdownIndex === sIndex ? null : sIndex
                                  );
                                }}
                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all duration-200 cursor-pointer shadow-2xs bg-[#004F9F]/10 border-[#004F9F]/20 text-[#004F9F] dark:bg-[#00A5EC]/15 dark:border-[#00A5EC]/30 dark:text-[#00A5EC] hover:bg-[#004F9F]/15 dark:hover:bg-[#00A5EC]/25 hover:border-[#004F9F]/40"
                              >
                                {isPG && (
                                  <>
                                    <ListTodo className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
                                    <span>Pilihan Ganda</span>
                                  </>
                                )}
                                {isPGKompleks && (
                                  <>
                                    <ListChecks className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
                                    <span>PG Kompleks (Multi)</span>
                                  </>
                                )}
                                {isEsai && (
                                  <>
                                    <TextInitial className="w-3.5 h-3.5 text-[#004F9F] dark:text-[#00A5EC] shrink-0" />
                                    <span>Isian / Esai</span>
                                  </>
                                )}
                                <ChevronDown
                                  className={`w-3 h-3 text-[#004F9F]/70 dark:text-[#00A5EC]/70 transition-transform duration-200 ${
                                    openTypeDropdownIndex === sIndex ? "rotate-180" : ""
                                  }`}
                                />
                              </button>

                              {/* Menu Dropdown Tipe Soal (3 Pilihan) */}
                              {openTypeDropdownIndex === sIndex && (
                                <div
                                  className={`absolute left-0 top-full mt-1.5 w-60 rounded-2xl border p-1.5 shadow-xl z-30 transition-all animate-[modalFadeUp_0.15s_ease-out] ${
                                    isDark
                                      ? "bg-[#18202f] border-white/10 text-slate-200 shadow-black/40"
                                      : "bg-white border-slate-200 text-slate-800 shadow-slate-900/15"
                                  }`}
                                >
                                  {/* 1. Pilihan Ganda Tunggal */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSoal(sIndex, "tipe", "pilihan_ganda");
                                      if (!soal.opsi || soal.opsi.length === 0) {
                                        updateSoal(sIndex, "opsi", [{ key: "A", teks: "" }]);
                                        updateSoal(sIndex, "kunci_jawaban", "A");
                                      } else {
                                        const firstKey =
                                          (soal.kunci_jawaban || "").split(",")[0]?.trim() || "A";
                                        updateSoal(sIndex, "kunci_jawaban", firstKey);
                                      }
                                      setOpenTypeDropdownIndex(null);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-200 cursor-pointer group/opt ${
                                      isPG
                                        ? "bg-[#004F9F]/10 dark:bg-[#00A5EC]/15 text-[#004F9F] dark:text-[#00A5EC] font-bold"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-[#004F9F] dark:hover:text-[#00A5EC]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <ListTodo
                                        className={`w-4 h-4 shrink-0 transition-colors ${
                                          isPG
                                            ? "text-[#004F9F] dark:text-[#00A5EC]"
                                            : "text-slate-500 dark:text-slate-400 group-hover/opt:text-[#004F9F] dark:group-hover/opt:text-[#00A5EC]"
                                        }`}
                                      />
                                      <div>
                                        <div
                                          className={`text-xs ${
                                            isPG
                                              ? "font-bold text-[#004F9F] dark:text-[#00A5EC]"
                                              : "font-semibold text-slate-700 dark:text-slate-200 group-hover/opt:text-[#004F9F] dark:group-hover/opt:text-[#00A5EC]"
                                          }`}
                                        >
                                          Pilihan Ganda
                                        </div>
                                        <div
                                          className={`text-[10px] ${
                                            isPG
                                              ? "text-[#004F9F]/70 dark:text-[#00A5EC]/80"
                                              : "text-slate-400 dark:text-slate-500"
                                          }`}
                                        >
                                          1 kunci jawaban benar
                                        </div>
                                      </div>
                                    </div>
                                    {isPG && (
                                      <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#004F9F] dark:text-[#00A5EC]" />
                                    )}
                                  </button>

                                  {/* 2. Pilihan Ganda Kompleks */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSoal(sIndex, "tipe", "pilihan_ganda_kompleks");
                                      if (!soal.opsi || soal.opsi.length === 0) {
                                        updateSoal(sIndex, "opsi", [{ key: "A", teks: "" }]);
                                        updateSoal(sIndex, "kunci_jawaban", "A");
                                      }
                                      setOpenTypeDropdownIndex(null);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-200 cursor-pointer group/opt ${
                                      isPGKompleks
                                        ? "bg-[#004F9F]/10 dark:bg-[#00A5EC]/15 text-[#004F9F] dark:text-[#00A5EC] font-bold"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-[#004F9F] dark:hover:text-[#00A5EC]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <ListChecks
                                        className={`w-4 h-4 shrink-0 transition-colors ${
                                          isPGKompleks
                                            ? "text-[#004F9F] dark:text-[#00A5EC]"
                                            : "text-slate-500 dark:text-slate-400 group-hover/opt:text-[#004F9F] dark:group-hover/opt:text-[#00A5EC]"
                                        }`}
                                      />
                                      <div>
                                        <div
                                          className={`text-xs ${
                                            isPGKompleks
                                              ? "font-bold text-[#004F9F] dark:text-[#00A5EC]"
                                              : "font-semibold text-slate-700 dark:text-slate-200 group-hover/opt:text-[#004F9F] dark:group-hover/opt:text-[#00A5EC]"
                                          }`}
                                        >
                                          Pilihan Ganda Kompleks
                                        </div>
                                        <div
                                          className={`text-[10px] ${
                                            isPGKompleks
                                              ? "text-[#004F9F]/70 dark:text-[#00A5EC]/80"
                                              : "text-slate-400 dark:text-slate-500"
                                          }`}
                                        >
                                          Multi kunci jawaban benar
                                        </div>
                                      </div>
                                    </div>
                                    {isPGKompleks && (
                                      <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#004F9F] dark:text-[#00A5EC]" />
                                    )}
                                  </button>

                                  {/* 3. Isian / Esai */}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateSoal(sIndex, "tipe", "esai");
                                      setOpenTypeDropdownIndex(null);
                                    }}
                                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all duration-200 cursor-pointer group/opt ${
                                      isEsai
                                        ? "bg-[#004F9F]/10 dark:bg-[#00A5EC]/15 text-[#004F9F] dark:text-[#00A5EC] font-bold"
                                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-white/5 hover:text-[#004F9F] dark:hover:text-[#00A5EC]"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <TextInitial
                                        className={`w-4 h-4 shrink-0 transition-colors ${
                                          isEsai
                                            ? "text-[#004F9F] dark:text-[#00A5EC]"
                                            : "text-slate-500 dark:text-slate-400 group-hover/opt:text-[#004F9F] dark:group-hover/opt:text-[#00A5EC]"
                                        }`}
                                      />
                                      <div>
                                        <div
                                          className={`text-xs ${
                                            isEsai
                                              ? "font-bold text-[#004F9F] dark:text-[#00A5EC]"
                                              : "font-semibold text-slate-700 dark:text-slate-200 group-hover/opt:text-[#004F9F] dark:group-hover/opt:text-[#00A5EC]"
                                          }`}
                                        >
                                          Isian / Esai
                                        </div>
                                        <div
                                          className={`text-[10px] ${
                                            isEsai
                                              ? "text-[#004F9F]/70 dark:text-[#00A5EC]/80"
                                              : "text-slate-400 dark:text-slate-500"
                                          }`}
                                        >
                                          Jawaban teks bebas mentor
                                        </div>
                                      </div>
                                    </div>
                                    {isEsai && (
                                      <Check className="w-3.5 h-3.5 stroke-[2.5] text-[#004F9F] dark:text-[#00A5EC]" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Bobot Poin Soal */}
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-1 rounded-xl border border-slate-200 dark:border-white/10">
                            <span className="text-[11px] font-bold text-slate-500">Poin:</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={soal.poin ?? 20}
                              onChange={(e) =>
                                updateSoal(
                                  sIndex,
                                  "poin",
                                  Math.max(1, parseInt(e.target.value, 10) || 1)
                                )
                              }
                              className={`w-14 h-7 text-center text-xs font-black rounded-lg border ${
                                isDark
                                  ? "bg-slate-900 border-white/10 text-white"
                                  : "bg-white border-slate-200 text-[#004F9F]"
                              } focus:outline-none focus:ring-1 focus:ring-[#00A5EC]`}
                            />
                          </div>
                        </div>

                        {/* Input Pertanyaan Soal */}
                        <div className="space-y-3">
                          <div>
                            <textarea
                              rows={2}
                              required
                              value={soal.pertanyaan}
                              onChange={(e) => updateSoal(sIndex, "pertanyaan", e.target.value)}
                              placeholder={`Ketikkan pertanyaan soal #${sIndex + 1}...`}
                              className={`w-full p-3 text-xs rounded-2xl border font-medium transition-all ${
                                isDark
                                  ? "bg-slate-900/60 border-white/10 text-white placeholder:text-slate-500 focus:border-[#00A5EC]"
                                  : "bg-slate-50/70 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F] focus:bg-white"
                              } focus:outline-none focus:ring-2 focus:ring-[#00A5EC]/20`}
                            />
                          </div>

                          {/* Preview Gambar Soal jika terpasang (Ukuran Kompak & Bernuansa Studio) */}
                          {soal.gambar && (
                            <div className="relative group/imgpreview rounded-2xl overflow-hidden border border-slate-200/90 dark:border-white/10 bg-white/90 dark:bg-slate-900/80 p-2 shadow-2xs hover:shadow-md transition-all duration-300 max-w-sm sm:max-w-md animate-[modalFadeUp_0.2s_ease-out]">
                              {/* Viewport Kanvas Studio Ramping & Ringkas */}
                              <div
                                onClick={() => openImageModal(sIndex)}
                                title="Klik untuk mengelola / memperbesar gambar visual"
                                className="relative rounded-xl overflow-hidden h-32 sm:h-36 w-full flex items-center justify-center bg-slate-100/90 dark:bg-[#0c121e] border border-slate-200/60 dark:border-white/5 select-none cursor-pointer group/canvas"
                              >
                                {/* Texture grid dot-matrix studio */}
                                <div
                                  className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none"
                                  style={{
                                    backgroundImage: "radial-gradient(#94a3b8 1.25px, transparent 1.25px)",
                                    backgroundSize: "12px 12px",
                                  }}
                                />

                                {/* Ambient lighting vignette */}
                                <div className="absolute inset-0 bg-radial from-white/60 via-transparent to-slate-200/40 dark:from-sky-500/5 dark:via-transparent dark:to-black/50 pointer-events-none" />

                                {/* Framed Picture Card */}
                                <div className="relative z-10 max-h-28 sm:max-h-32 max-w-[90%] flex items-center justify-center rounded-lg p-1 bg-white dark:bg-slate-900 shadow-md shadow-slate-900/10 dark:shadow-black/60 ring-1 ring-slate-900/10 dark:ring-white/15 transition-transform duration-300 ease-out group-hover/canvas:scale-[1.02]">
                                  <img
                                    src={soal.gambar}
                                    alt={`Ilustrasi Soal #${sIndex + 1}`}
                                    className="max-h-26 sm:max-h-30 w-auto max-w-full object-contain rounded-md"
                                  />
                                </div>

                                {/* Floating Badge Pojok Kiri Atas */}
                                <div className="absolute top-2 left-2 z-20 flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 dark:bg-black/80 backdrop-blur-md text-white text-[9px] font-bold shadow-xs border border-white/10 pointer-events-none">
                                  <ImageIcon className="w-2.5 h-2.5 text-[#00A5EC]" />
                                  <span>Visual #{sIndex + 1}</span>
                                </div>

                                {/* Floating Quick Action Buttons Pojok Kanan Atas */}
                                <div
                                  className="absolute top-2 right-2 z-20 flex items-center gap-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => openImageModal(sIndex)}
                                    title="Ganti atau perbesar gambar"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/95 dark:bg-slate-800/95 hover:bg-white text-[#004F9F] dark:text-[#00A5EC] text-[9.5px] font-bold shadow-xs border border-slate-200/90 dark:border-white/15 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  >
                                    <ImageIcon className="w-2.5 h-2.5" />
                                    <span>Ganti</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => updateSoal(sIndex, "gambar", "")}
                                    title="Hapus gambar visual ini"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/95 dark:bg-slate-800/95 hover:bg-rose-50 text-rose-600 dark:text-rose-400 text-[9.5px] font-bold shadow-xs border border-rose-200/90 dark:border-rose-900/40 hover:border-rose-300 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </div>

                              {/* Footer Status Bar Ramping */}
                              <div className="flex items-center justify-between px-1.5 pt-1.5 text-[10px]">
                                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Gambar visual aktif</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => openImageModal(sIndex)}
                                  className="text-[10px] font-bold text-[#004F9F] dark:text-[#00A5EC] hover:underline cursor-pointer"
                                >
                                  Kelola Visual &rarr;
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Konten Spesifik: Pilihan Ganda & Pilihan Ganda Kompleks */}
                          {isChoice && (
                            <div className="space-y-2.5 pt-1">
                              {/* Header Pilihan Jawaban dengan petunjuk */}
                              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
                                <span className="flex items-center gap-1.5 flex-wrap">
                                  <span>Pilihan Jawaban</span>
                                  <span className="text-[10.5px] text-slate-400 font-normal">
                                    {isPGKompleks
                                      ? "(Klik kotak centang di sebelah kiri opsi untuk memilih satu atau beberapa Kunci Jawaban Benar)"
                                      : "(Klik lingkaran huruf di sebelah kiri opsi untuk menetapkan Kunci Jawaban Benar)"}
                                  </span>
                                </span>
                              </div>

                              {/* Daftar Opsi Jawaban */}
                              <div className="space-y-2">
                                {soal.opsi?.map((opsi, oIndex) => {
                                  const keysArray = (soal.kunci_jawaban || "")
                                    .split(",")
                                    .map((k) => k.trim())
                                    .filter(Boolean);
                                  const isKunci = isPGKompleks
                                    ? keysArray.includes(opsi.key)
                                    : soal.kunci_jawaban === opsi.key;

                                  return (
                                    <div
                                      key={opsi.key}
                                      className={`flex items-center gap-2 p-2 rounded-2xl border transition-all ${
                                        isKunci
                                          ? "bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/30 dark:border-emerald-700/60 ring-1 ring-emerald-500/20"
                                          : isDark
                                          ? "bg-slate-900/40 border-white/5"
                                          : "bg-slate-50/60 border-slate-200/70"
                                      }`}
                                    >
                                      {/* Tombol Kunci Jawaban: Checkbox untuk Kompleks / Lingkaran untuk PG Tunggal */}
                                      {isPGKompleks ? (
                                        <button
                                          type="button"
                                          onClick={() => toggleKunciKompleks(sIndex, opsi.key)}
                                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black transition-all cursor-pointer ${
                                            isKunci
                                              ? "bg-emerald-600 text-white shadow-xs scale-105"
                                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 hover:text-slate-800"
                                          }`}
                                          title={
                                            isKunci
                                              ? `Hapus ${opsi.key} dari kunci jawaban`
                                              : `Tambahkan ${opsi.key} sebagai salah satu kunci jawaban benar`
                                          }
                                        >
                                          {isKunci ? <Check className="w-4 h-4 stroke-[3]" /> : opsi.key}
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => updateSoal(sIndex, "kunci_jawaban", opsi.key)}
                                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black transition-all cursor-pointer ${
                                            isKunci
                                              ? "bg-emerald-600 text-white shadow-xs scale-105"
                                              : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 hover:text-slate-800"
                                          }`}
                                          title={`Pilih ${opsi.key} sebagai kunci jawaban benar`}
                                        >
                                          {isKunci ? <Check className="w-4 h-4 stroke-[3]" /> : opsi.key}
                                        </button>
                                      )}

                                      {/* Teks Opsi Input */}
                                      <input
                                        type="text"
                                        required
                                        value={opsi.teks}
                                        onChange={(e) => updateOpsiTeks(sIndex, oIndex, e.target.value)}
                                        placeholder={`Pilihan jawaban ${opsi.key}...`}
                                        className={`flex-1 h-8 px-3 text-xs rounded-xl border font-medium ${
                                          isDark
                                            ? "bg-slate-900 border-white/10 text-white placeholder:text-slate-500"
                                            : "bg-white border-slate-200 text-slate-800 placeholder:text-slate-400"
                                        } focus:outline-none focus:ring-1 focus:ring-[#00A5EC]`}
                                      />

                                      {/* Label Kunci Badge */}
                                      {isKunci && (
                                        <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 shrink-0">
                                          Kunci Benar
                                        </span>
                                      )}

                                      {/* Tombol Hapus Opsi jika lebih dari 1 */}
                                      {soal.opsi.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => hapusOpsi(sIndex, oIndex)}
                                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer shrink-0"
                                          title="Hapus opsi ini"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  );
                                })}

                                {/* Baris Tambah Opsi di Bawah Pilihan Jawaban */}
                                {soal.opsi?.length < 6 && (
                                  <button
                                    type="button"
                                    onClick={() => tambahOpsi(sIndex)}
                                    className={`w-full flex items-center gap-2 p-2 rounded-2xl border-2 border-dashed transition-all cursor-pointer group/addopt ${
                                      isDark
                                        ? "border-slate-800 bg-slate-900/20 hover:border-[#00A5EC]/50 hover:bg-[#00A5EC]/5 text-slate-400"
                                        : "border-slate-200 bg-slate-50/40 hover:border-[#004F9F]/50 hover:bg-[#004F9F]/5 text-slate-500 hover:text-[#004F9F]"
                                    }`}
                                  >
                                    <span
                                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl text-xs font-black border border-dashed transition-all duration-200 ${
                                        isDark
                                          ? "border-slate-700 bg-slate-800/80 text-slate-400 group-hover/addopt:border-[#00A5EC] group-hover/addopt:text-[#00A5EC] group-hover/addopt:bg-[#00A5EC]/10"
                                          : "border-slate-300 bg-white text-slate-400 group-hover/addopt:border-[#004F9F] group-hover/addopt:text-[#004F9F] group-hover/addopt:bg-[#004F9F]/10"
                                      }`}
                                    >
                                      <Plus className="w-3.5 h-3.5 transition-transform duration-200 group-hover/addopt:scale-125" />
                                    </span>
                                    <div
                                      className={`flex-1 h-8 px-3 rounded-xl border border-dashed flex items-center justify-between text-xs font-medium transition-all ${
                                        isDark
                                          ? "border-slate-800/80 bg-slate-900/30 text-slate-500 group-hover/addopt:border-[#00A5EC]/40 group-hover/addopt:text-slate-300"
                                          : "border-slate-200 bg-white/70 text-slate-400 group-hover/addopt:border-[#004F9F]/30 group-hover/addopt:text-slate-700"
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        <span className="font-bold text-[#004F9F] dark:text-[#00A5EC]">
                                          + Tambah Opsi {String.fromCharCode(65 + (soal.opsi?.length || 0))}
                                        </span>
                                        <span className="text-[11px] opacity-75 hidden sm:inline">
                                          (Klik untuk menambah butir pilihan baru)
                                        </span>
                                      </span>
                                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#004F9F]/10 dark:bg-[#00A5EC]/15 text-[#004F9F] dark:text-[#00A5EC]">
                                        Tambah
                                      </span>
                                    </div>
                                  </button>
                                )}
                              </div>

                              {/* Pembahasan / Penjelasan Jawaban (Opsional) */}
                              <div className="pt-2">
                                <label className="flex items-center gap-1 text-[10.5px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                                  <AlignLeft className="w-3 h-3 text-[#00A5EC]" />
                                  <span>Pembahasan / Penjelasan Kunci Jawaban (Opsional):</span>
                                </label>
                                <input
                                  type="text"
                                  value={soal.pembahasan || ""}
                                  onChange={(e) => updateSoal(sIndex, "pembahasan", e.target.value)}
                                  placeholder="Berikan penjelasan singkat mengapa jawaban tersebut benar..."
                                  className={`w-full h-8 px-3 text-xs rounded-xl border font-medium ${
                                    isDark
                                      ? "bg-slate-900/40 border-white/5 text-slate-300 placeholder:text-slate-600"
                                      : "bg-slate-50/80 border-slate-200/80 text-slate-700 placeholder:text-slate-400"
                                  } focus:outline-none focus:ring-1 focus:ring-[#00A5EC]`}
                                />
                              </div>
                            </div>
                          )}

                          {/* Konten Spesifik: Soal Esai */}
                          {!isChoice && (
                            <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-tr from-[#004F9F]/5 to-[#00A5EC]/10 dark:from-[#00A5EC]/15 dark:to-[#00A5EC]/5 border border-[#00A5EC]/25 dark:border-[#00A5EC]/30 space-y-2 shadow-2xs">
                              <div className="flex items-center gap-2 text-[#004F9F] dark:text-[#00A5EC] text-xs font-bold">
                                <span className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#004F9F]/10 dark:bg-[#00A5EC]/20 text-[#004F9F] dark:text-[#00A5EC]">
                                  <Info className="w-3.5 h-3.5 shrink-0" />
                                </span>
                                <span>Pedoman Penilaian Esai Mentor</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                                Soal esai akan dijawab peserta secara tertulis dan dinilai secara manual oleh mentor saat pengumpulan dengan rentang skor 0 hingga {soal.poin || 20} poin.
                              </p>
                              <div className="pt-1">
                                <label className="block text-[10.5px] font-bold text-slate-700 dark:text-slate-200 mb-1">
                                  Kata Kunci / Kriteria Jawaban Ideal (Opsional):
                                </label>
                                <textarea
                                  rows={2}
                                  value={soal.petunjuk_penilaian || ""}
                                  onChange={(e) => updateSoal(sIndex, "petunjuk_penilaian", e.target.value)}
                                  placeholder="Catat kata kunci atau rubrik penilaian untuk memudahkan saat mengoreksi..."
                                  className={`w-full p-2.5 text-xs rounded-xl border font-medium ${
                                    isDark
                                      ? "bg-slate-900/90 border-white/10 text-white placeholder:text-slate-500 focus:border-[#00A5EC]/60"
                                      : "bg-white border-[#00A5EC]/30 text-slate-800 placeholder:text-slate-400 focus:border-[#004F9F]"
                                  } focus:outline-none focus:ring-2 focus:ring-[#004F9F]/20 dark:focus:ring-[#00A5EC]/30 transition-all`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ── TOOLBAR / BUTTON YANG MELAYANG DI SISI KANAN (HANYA 1 TOOLBAR DI SOAL AKTIF) ── */}
                      <div className="w-11 sm:w-12 shrink-0 flex justify-center">
                        {isActive && (
                          <div
                            ref={(el) => {
                              toolbarRefs.current[sIndex] = el;
                            }}
                            className="sticky top-4 z-20 shrink-0 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl border shadow-lg bg-white/95 dark:bg-[#18202f]/95 border-slate-200/90 dark:border-white/10 backdrop-blur-sm animate-[toolbarPopIn_0.2s_cubic-bezier(0.16,1,0.3,1)]"
                          >
                            {/* 1. Tambah Soal Popover (Menyisipkan di bawah soal aktif ini) */}
                            <div className="relative">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveAddMenuIndex(
                                    activeAddMenuIndex === sIndex ? null : sIndex
                                  );
                                }}
                                className={`p-2 rounded-xl transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 shadow-2xs ${
                                  activeAddMenuIndex === sIndex
                                    ? "bg-[#003870] text-white rotate-45"
                                    : "bg-[#004F9F] hover:bg-[#003870] text-white hover:shadow-xs"
                                }`}
                                title="Tambah Soal Baru di Bawah Ini"
                              >
                                <Plus className="w-4 h-4 transition-transform duration-200" />
                              </button>

                              {/* Popover Pilihan Jenis Soal Baru */}
                              {activeAddMenuIndex === sIndex && (
                                <div
                                  ref={floatingMenuRef}
                                  className={`absolute right-full top-0 mr-2.5 w-60 rounded-2xl border p-1.5 shadow-xl z-30 transition-all animate-[modalFadeUp_0.15s_ease-out] ${
                                    isDark
                                      ? "bg-[#18202f] border-white/10 text-slate-200 shadow-black/40"
                                      : "bg-white border-slate-200 text-slate-800 shadow-slate-900/15"
                                  }`}
                                >
                                  <div className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Sisipkan Soal #{sIndex + 2}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      tambahSoal("pilihan_ganda", sIndex);
                                      setActiveAddMenuIndex(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 cursor-pointer group/opt hover:bg-[#004F9F]/5 dark:hover:bg-[#00A5EC]/10 hover:translate-x-1 active:scale-[0.98]"
                                  >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 group-hover/opt:bg-[#004F9F] group-hover/opt:text-white dark:group-hover/opt:bg-[#00A5EC] dark:group-hover/opt:text-slate-900 group-hover/opt:border-[#004F9F] dark:group-hover/opt:border-[#00A5EC] group-hover/opt:scale-105 transition-all duration-200 shadow-2xs shrink-0">
                                      <ListTodo className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover/opt:text-[#004F9F] dark:group-hover/opt:text-[#00A5EC] transition-colors duration-200">
                                      Pilihan Ganda
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      tambahSoal("pilihan_ganda_kompleks", sIndex);
                                      setActiveAddMenuIndex(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 cursor-pointer group/opt hover:bg-[#004F9F]/5 dark:hover:bg-[#00A5EC]/10 hover:translate-x-1 active:scale-[0.98]"
                                  >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 group-hover/opt:bg-[#004F9F] group-hover/opt:text-white dark:group-hover/opt:bg-[#00A5EC] dark:group-hover/opt:text-slate-900 group-hover/opt:border-[#004F9F] dark:group-hover/opt:border-[#00A5EC] group-hover/opt:scale-105 transition-all duration-200 shadow-2xs shrink-0">
                                      <ListChecks className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover/opt:text-[#004F9F] dark:group-hover/opt:text-[#00A5EC] transition-colors duration-200">
                                      Pilihan Ganda Kompleks
                                    </span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      tambahSoal("esai", sIndex);
                                      setActiveAddMenuIndex(null);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all duration-200 cursor-pointer group/opt hover:bg-[#004F9F]/5 dark:hover:bg-[#00A5EC]/10 hover:translate-x-1 active:scale-[0.98]"
                                  >
                                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-white/10 group-hover/opt:bg-[#004F9F] group-hover/opt:text-white dark:group-hover/opt:bg-[#00A5EC] dark:group-hover/opt:text-slate-900 group-hover/opt:border-[#004F9F] dark:group-hover/opt:border-[#00A5EC] group-hover/opt:scale-105 transition-all duration-200 shadow-2xs shrink-0">
                                      <TextInitial className="w-3.5 h-3.5" />
                                    </span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover/opt:text-[#004F9F] dark:group-hover/opt:text-[#00A5EC] transition-colors duration-200">
                                      Isian / Esai
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* 2. Duplikat Soal Ini (Animasi auto scroll & muncul) */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDuplikasiAnimasi(sIndex);
                              }}
                              className="group/btn p-2 rounded-xl text-slate-500 hover:text-[#004F9F] hover:bg-[#004F9F]/10 dark:text-slate-400 dark:hover:text-[#00A5EC] dark:hover:bg-[#00A5EC]/20 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 hover:shadow-xs"
                              title="Duplikasi Soal Ini"
                            >
                              <Copy className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                            </button>

                            {/* 3. Sisipkan / Kelola Gambar Soal */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openImageModal(sIndex);
                              }}
                              className={`group/btn p-2 rounded-xl relative transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 hover:shadow-xs ${
                                soal.gambar
                                  ? "text-[#004F9F] bg-[#004F9F]/15 dark:text-[#00A5EC] dark:bg-[#00A5EC]/20 shadow-2xs"
                                  : "text-slate-500 hover:text-[#004F9F] hover:bg-[#004F9F]/10 dark:text-slate-400 dark:hover:text-[#00A5EC] dark:hover:bg-[#00A5EC]/20"
                              }`}
                              title={
                                soal.gambar
                                  ? "Kelola / Ganti Gambar Butir Soal Ini"
                                  : "Sisipkan Gambar pada Butir Soal Ini"
                              }
                            >
                              <ImageIcon className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                              {soal.gambar && (
                                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                              )}
                            </button>

                            {/* 4. Geser Atas (Animasi Melompat / Swap) */}
                            <button
                              type="button"
                              disabled={sIndex === 0}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGeserAnimasi(sIndex, -1);
                              }}
                              className="group/btn p-2 rounded-xl text-slate-500 hover:text-[#004F9F] hover:bg-[#004F9F]/10 dark:text-slate-400 dark:hover:text-[#00A5EC] dark:hover:bg-[#00A5EC]/20 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-transparent transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 hover:shadow-xs"
                              title="Geser Soal ke Atas (Melompati Soal di Atasnya)"
                            >
                              <ChevronUp className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                            </button>

                            {/* 5. Geser Bawah (Animasi Melompat / Swap) */}
                            <button
                              type="button"
                              disabled={sIndex === daftarSoal.length - 1}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGeserAnimasi(sIndex, 1);
                              }}
                              className="group/btn p-2 rounded-xl text-slate-500 hover:text-[#004F9F] hover:bg-[#004F9F]/10 dark:text-slate-400 dark:hover:text-[#00A5EC] dark:hover:bg-[#00A5EC]/20 disabled:opacity-25 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:bg-transparent transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 hover:shadow-xs"
                              title="Geser Soal ke Bawah (Melompati Soal di Bawahnya)"
                            >
                              <ChevronDown className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                            </button>

                            <div className="w-5 h-px bg-slate-200 dark:bg-white/10 my-0.5" />

                            {/* 6. Hapus Soal Ini */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                hapusSoal(sIndex);
                              }}
                              className="group/btn p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/30 transition-all duration-200 cursor-pointer hover:-translate-y-0.5 active:scale-90 hover:shadow-xs"
                              title="Hapus Butir Soal Ini"
                            >
                              <Trash2 className="w-4 h-4 transition-transform duration-200 group-hover/btn:scale-110" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── FOOTER MODAL ── */}
        <div
          className={`p-4 sm:px-8 sm:py-4.5 border-t flex items-center justify-between gap-4 shrink-0 flex-wrap sm:flex-nowrap ${
            isDark ? "border-white/10 bg-[#141a24]" : "border-slate-100 bg-white"
          }`}
        >
          <button
            type="button"
            onClick={onBackToInfo}
            disabled={submitting}
            className={`group/back inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold rounded-2xl border cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:scale-95 ${
              isDark
                ? "border-white/10 bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 hover:border-white/20"
                : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs"
            }`}
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover/back:-translate-x-1.5" />
            <span>Kembali ke Info Kuis</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 mr-1">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {jumlahSoal} Soal Terdaftar
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                  totalPoin === 100
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40 shadow-2xs"
                    : totalPoin > 100
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/40 animate-pulse shadow-2xs"
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40 shadow-2xs"
                }`}
              >
                {totalPoin === 100 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
                )}
                <span>
                  {totalPoin} / 100 Poin
                  {totalPoin === 100
                    ? " (Pas)"
                    : totalPoin > 100
                    ? ` (+${totalPoin - 100})`
                    : ` (-${100 - totalPoin})`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSubmitKuis}
              disabled={submitting}
              title={
                totalPoin !== 100
                  ? `Total poin harus pas 100 poin untuk menyimpan kuis (saat ini ${totalPoin} / 100 poin)`
                  : isEditing
                  ? "Simpan Perubahan Kuis"
                  : "Terbitkan Tugas Kuis"
              }
              className={`group/btn inline-flex items-center justify-center gap-2 px-6 py-2.5 text-xs font-black rounded-2xl transition-all duration-200 border-0 ${
                totalPoin !== 100
                  ? "bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-pointer hover:bg-slate-300/80 active:scale-95"
                  : "bg-gradient-to-r from-[#0B1442] via-[#101F5C] to-[#1E3A8A] text-white shadow-md shadow-[#0B1442]/20 hover:shadow-lg hover:shadow-[#0B1442]/30 hover:-translate-y-0.5 active:scale-95 cursor-pointer"
              }`}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Menerbitkan Kuis...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                  <span>{isEditing ? "Simpan Perubahan Kuis" : "Terbitkan Tugas Kuis"}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>

      {/* ── MODAL SISIPKAN GAMBAR BUTIR SOAL (KOMPONEN MANDIRI) ── */}
      {imageModalOpen && (
        <ModalSisipkanGambarSoal
          key={`modal-gambar-${imageTargetIndex}-${kuisConfig.daftar_soal[imageTargetIndex]?.gambar || ""}`}
          isOpen={imageModalOpen}
          onClose={() => setImageModalOpen(false)}
          soalIndex={imageTargetIndex}
          initialImageUrl={
            imageTargetIndex !== null
              ? kuisConfig.daftar_soal[imageTargetIndex]?.gambar || ""
              : ""
          }
          onApply={handleApplyGambar}
          isDark={isDark}
        />
      )}
    </div>
  );
};

export default FormKuisSoalModal;
