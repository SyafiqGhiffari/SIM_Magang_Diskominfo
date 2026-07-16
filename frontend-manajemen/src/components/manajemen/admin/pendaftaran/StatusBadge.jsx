const statusStyle = {
  menunggu: { label: "Menunggu Review", cls: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/60", pulse: true },
  revisi: { label: "Perlu Revisi", cls: "bg-orange-50 text-orange-700 ring-1 ring-orange-200/60", pulse: true },
  diterima: { label: "Pendaftaran Diterima", cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60", pulse: true },
  ditolak: { label: "Pendaftaran Ditolak", cls: "bg-red-50 text-red-700 ring-1 ring-red-200/60", pulse: true },
};

const StatusBadge = ({ status, className = "" }) => {
  const s = statusStyle[status] || statusStyle.menunggu;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[10.5px] font-bold ${s.cls} ${className}`}>
      <span className="relative flex h-2 w-2 shrink-0">
        {s.pulse && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-75" style={{ animationDuration: "1.2s" }} />}
        <span className="relative inline-flex h-2 w-2 rounded-full bg-current" />
      </span>
      {s.label}
    </span>
  );
};

export default StatusBadge;