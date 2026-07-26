import { CheckCircle2, Clock, FileText, HeartPulse, UserX, MinusCircle, CircleDashed } from "lucide-react";
import { statusInfo } from "../../../../constants/presensiStatus";

const ICONS = {
  hadir: CheckCircle2,
  terlambat: Clock,
  izin: FileText,
  sakit: HeartPulse,
  alfa: UserX,
  libur: MinusCircle,
  belum: CircleDashed,
};

const PresensiStatusBadge = ({ status, className = "" }) => {
  const key = status || "belum";
  const info = statusInfo(key);
  const Icon = ICONS[key] || CircleDashed;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm ${info.badge} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0" />
      {info.label}
    </span>
  );
};

export default PresensiStatusBadge;