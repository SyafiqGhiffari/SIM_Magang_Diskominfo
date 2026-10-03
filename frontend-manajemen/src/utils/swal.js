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

export const confirmDialog = (
  optionsOrTitle = "Yakin?",
  textArg = "",
  confirmTextArg = "Ya, lanjutkan",
  cancelTextArg = "Batal",
  iconArg = "question",
  dangerArg = false
) => {
  let title = "Yakin?";
  let text = "";
  let confirmText = "Ya, lanjutkan";
  let cancelText = "Batal";
  let icon = "question";
  let danger = false;
  let confirmButtonColor;
  let showCancelButton = true;

  if (typeof optionsOrTitle === "object" && optionsOrTitle !== null) {
    title = optionsOrTitle.title ?? "Yakin?";
    text = optionsOrTitle.text ?? "";
    confirmText =
      optionsOrTitle.confirmText ??
      optionsOrTitle.confirmButtonText ??
      "Ya, lanjutkan";
    cancelText =
      optionsOrTitle.cancelText ??
      optionsOrTitle.cancelButtonText ??
      "Batal";
    icon = optionsOrTitle.icon ?? "question";
    danger = optionsOrTitle.danger ?? false;
    confirmButtonColor = optionsOrTitle.confirmButtonColor;
    showCancelButton = optionsOrTitle.showCancelButton ?? true;
  } else if (typeof optionsOrTitle === "string") {
    title = optionsOrTitle;
    text = textArg || "";
    confirmText = confirmTextArg || "Ya, lanjutkan";
    cancelText = cancelTextArg || "Batal";
    icon = iconArg || "question";
    danger = dangerArg || false;
  }

  return baseSwal.fire({
    title,
    text,
    icon,
    iconColor: danger ? "#dc2626" : "#004f9f",
    showCancelButton,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: confirmButtonColor || (danger ? "#dc2626" : "#004f9f"),
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

export const toastInfo = (title = "Informasi") => {
  baseSwal.fire({
    toast: true,
    position: "top-end",
    icon: "info",
    iconColor: "#0284c7",
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export const toastWarning = (title = "Perhatian") => {
  baseSwal.fire({
    toast: true,
    position: "top-end",
    icon: "warning",
    iconColor: "#d97706",
    title,
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
  });
};

export const sessionExpiredDialog = ({
  title = "Sesi Kedaluwarsa",
  text = "Sesi Anda telah berakhir karena tidak ada aktivitas (idle timeout). Silakan login kembali untuk melanjutkan.",
} = {}) => {
  return baseSwal.fire({
    title,
    text,
    icon: "info",
    iconColor: "#004f9f",
    showCancelButton: false,
    confirmButtonText: "Login Kembali",
    confirmButtonColor: "#004f9f",
    allowOutsideClick: false,
    allowEscapeKey: false,
    customClass: {
      popup: "swal-popup-custom",
      title: "swal-title-custom",
      htmlContainer: "swal-text-custom",
      confirmButton: "swal-confirm-custom",
    },
  });
};

export const blockedActionDialog = ({ title = "Tidak dapat dilanjutkan", text = "" }) => {
  return baseSwal.fire({
    title,
    text,
    icon: "warning",
    iconColor: "#d97706",
    showCancelButton: false,
    confirmButtonText: "Mengerti",
    confirmButtonColor: "#0B1442",
    customClass: {
      popup: "swal-popup-custom swal-blocked-popup",
      title: "swal-title-custom",
      htmlContainer: "swal-text-custom",
      confirmButton: "swal-confirm-custom swal-blocked-confirm",
    },
  });
};


// Dialog pemilihan berbentuk kartu, dipakai aksi massal "Ubah kategori".
// opsi: [{ nilai, label, deskripsi, warna, inisial }]
export const pilihOpsiDialog = ({
  title = "Pilih nilai",
  text = "",
  opsi = [],
  confirmText = "Simpan",
  cancelText = "Batal",
  pesanKosong = "Pilihan wajib diisi",
}) => {
  let terpilih = null;

  const kartu = opsi
    .map(
      (o, i) => `
      <button type="button" class="swal-opsi" data-nilai="${o.nilai}" style="animation-delay:${i * 45}ms">
        <span class="swal-opsi-chip" style="background:${o.warna}1a;color:${o.warna}">${o.inisial || o.label.charAt(0)}</span>
        <span class="swal-opsi-teks">
          <span class="swal-opsi-judul">${o.label}</span>
          <span class="swal-opsi-ket">${o.deskripsi || ""}</span>
        </span>
        <span class="swal-opsi-tanda" style="--warna:${o.warna}"></span>
      </button>`
    )
    .join("");

  return baseSwal.fire({
    title,
    html: `<p class="swal-opsi-intro">${text}</p><div class="swal-opsi-grid">${kartu}</div>`,
    showCancelButton: true,
    confirmButtonText: confirmText,
    cancelButtonText: cancelText,
    confirmButtonColor: "#004f9f",
    cancelButtonColor: "#94a3b8",
    reverseButtons: true,
    focusConfirm: false,
    customClass: {
      popup: "swal-popup-custom swal-opsi-popup",
      title: "swal-title-custom",
      htmlContainer: "swal-text-custom",
      confirmButton: "swal-confirm-custom",
      cancelButton: "swal-cancel-custom",
    },
    didOpen: () => {
      const popup = Swal.getPopup();
      const semua = popup.querySelectorAll(".swal-opsi");
      semua.forEach((el) => {
        el.addEventListener("click", () => {
          semua.forEach((x) => x.classList.remove("terpilih"));
          el.classList.add("terpilih");
          terpilih = el.dataset.nilai;
          Swal.resetValidationMessage();
        });
        // Klik ganda langsung menyetujui pilihan
        el.addEventListener("dblclick", () => Swal.clickConfirm());
      });
    },
    preConfirm: () => {
      if (!terpilih) {
        Swal.showValidationMessage(pesanKosong);
        return false;
      }
      return terpilih;
    },
  });
};