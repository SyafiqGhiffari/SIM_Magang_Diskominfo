import { useIdleTimeout } from "../../../../hooks/useIdleTimeout";
import IdleTimeoutModal from "./IdleTimeoutModal";
import { getToken, clearAuthData } from "../../../../utils/authStorage";
import { sessionExpiredDialog } from "../../../../utils/swal";
import api from "../../../../services/api";

export default function SessionManager() {
  const token = getToken();

  const handleTimeout = async () => {
    try {
      await api.post("/manajemen/logout");
    } catch {
      // abaikan error network jika offline
    }
    await sessionExpiredDialog({
      title: "Sesi Kedaluwarsa",
      text: "Sesi Anda telah berakhir karena tidak ada aktivitas selama 30 menit. Silakan login kembali untuk melanjutkan.",
    });
    clearAuthData();
    window.location.href = "/login";
  };

  const handleManualLogout = async () => {
    try {
      await api.post("/manajemen/logout");
    } catch {
      // abaikan error network
    }
    clearAuthData();
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
