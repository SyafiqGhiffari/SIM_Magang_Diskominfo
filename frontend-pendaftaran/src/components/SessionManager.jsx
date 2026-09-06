import { useIdleTimeout } from "../hooks/useIdleTimeout";
import IdleTimeoutModal from "./IdleTimeoutModal";
import { sessionExpiredDialog } from "../utils/swal";
import api from "../services/api";

export default function SessionManager() {
  const token = sessionStorage.getItem("token_pendaftaran");

  const handleTimeout = async () => {
    try {
      await api.post("/pendaftaran/logout");
    } catch {
      // abaikan network error
    }
    sessionStorage.removeItem("token_pendaftaran");
    sessionStorage.removeItem("user_pendaftaran");

    await sessionExpiredDialog({
      title: "Sesi Kedaluwarsa",
      text: "Sesi pendaftaran Anda telah berakhir karena tidak ada aktivitas (idle timeout). Silakan login kembali.",
    });
    window.location.href = "/login";
  };

  const handleManualLogout = async () => {
    try {
      await api.post("/pendaftaran/logout");
    } catch {
      // abaikan error network
    }
    sessionStorage.removeItem("token_pendaftaran");
    sessionStorage.removeItem("user_pendaftaran");
    window.location.href = "/login";
  };

  const { showWarningModal, secondsRemaining, keepAlive } = useIdleTimeout({
    onTimeout: handleTimeout,
    warningSeconds: 120,
  });

  if (!token) return null;

  return (
    <IdleTimeoutModal
      show={showWarningModal}
      secondsRemaining={secondsRemaining}
      onKeepAlive={keepAlive}
      onLogout={handleManualLogout}
      maxWarningSeconds={120}
    />
  );
}
