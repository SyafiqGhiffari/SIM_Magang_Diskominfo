import Swal from "sweetalert2";

const baseSwal = Swal.mixin({
  customClass: {
    popup: "swal-popup-custom",
    title: "swal-title-custom",
    htmlContainer: "swal-text-custom",
    confirmButton: "swal-confirm-custom",
    cancelButton: "swal-cancel-custom",
  },
  buttonsStyling: true,
});

export const confirmDialog = ({
  title = "Yakin?",
  text = "",
  confirmText = "Ya, lanjutkan",
  cancelText = "Batal",
  icon = "question",
  danger = false,
}) => {
  return baseSwal.fire({
    title,
    text,
    icon,
    iconColor: danger ? "#dc2626" : "#004f9f",
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: danger ? "#dc2626" : "#004f9f",
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
    focusCancel: true,
  });
};

export const toastSuccess = (title = "Berhasil") => {
  baseSwal.fire({
    toast: true,
    position: "top-end",
    icon: "success",
    iconColor: "#059669",
    title,
    showConfirmButton: false,
    timer: 2500,
    timerProgressBar: true,
  });
};

export const toastError = (title = "Terjadi kesalahan") => {
  baseSwal.fire({
    toast: true,
    position: "top-end",
    icon: "error",
    iconColor: "#dc2626",
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};