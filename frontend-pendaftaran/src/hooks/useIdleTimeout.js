import { useEffect, useRef, useState, useCallback } from "react";
import api from "../services/api";

const DURASI_IDLE_PENDAFTARAN = 120 * 60 * 1000; // 120 Menit (2 Jam)
const DEFAULT_WARNING_SECONDS = 120; // 2 Menit peringatan sebelum sesi habis

export const useIdleTimeout = ({
  onTimeout,
  warningSeconds = DEFAULT_WARNING_SECONDS,
} = {}) => {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(warningSeconds);

  // Inisialisasi dengan 0 agar pure saat render, diisi Date.now() di dalam effect/event
  const lastActivityRef = useRef(0);
  const timerIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  // Perpanjang sesi (Keep-Alive)
  const keepAlive = useCallback(async () => {
    setShowWarningModal(false);
    resetActivity();
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    try {
      await api.post("/pendaftaran/ping");
    } catch {
      // Jika ping gagal (server menolak karena sudah kadaluarsa), interceptor akan menangani
    }
  }, [resetActivity]);

  // Logout langsung
  const logoutNow = useCallback(async () => {
    setShowWarningModal(false);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (onTimeout) {
      onTimeout();
    }
  }, [onTimeout]);

  useEffect(() => {
    const token = sessionStorage.getItem("token_pendaftaran");
    if (!token) return;

    // Set awal waktu aktivitas saat komponen terpasang
    if (!lastActivityRef.current) {
      lastActivityRef.current = Date.now();
    }

    const EVENTS = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "wheel",
    ];

    const handleUserActivity = () => {
      // Hanya reset otomatis jika modal peringatan belum muncul
      if (!showWarningModal) {
        lastActivityRef.current = Date.now();
      }
    };

    EVENTS.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Loop pengecekan idle setiap 1 detik
    timerIntervalRef.current = setInterval(() => {
      const currentToken = sessionStorage.getItem("token_pendaftaran");
      if (!currentToken) return;

      const totalTimeoutMs = DURASI_IDLE_PENDAFTARAN;
      const warningThresholdMs = totalTimeoutMs - warningSeconds * 1000;
      const elapsedMs = Date.now() - lastActivityRef.current;

      if (elapsedMs >= totalTimeoutMs) {
        // Waktu habis total
        logoutNow();
      } else if (elapsedMs >= warningThresholdMs && !showWarningModal) {
        // Masuk ke fase peringatan (2 menit terakhir)
        setShowWarningModal(true);
        const sisaDetik = Math.max(1, Math.ceil((totalTimeoutMs - elapsedMs) / 1000));
        setSecondsRemaining(sisaDetik);
      }
    }, 1000);

    return () => {
      EVENTS.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarningModal, warningSeconds, logoutNow]);

  // Hitung mundur visual saat modal peringatan aktif
  useEffect(() => {
    if (showWarningModal) {
      countdownIntervalRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            logoutNow();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [showWarningModal, logoutNow]);

  return {
    showWarningModal,
    secondsRemaining,
    keepAlive,
    logoutNow,
  };
};
