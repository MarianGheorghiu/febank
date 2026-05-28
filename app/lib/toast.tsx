import { toast } from "sonner";
import { Landmark, Users, X, ShieldAlert } from "lucide-react";

interface ToastProps {
  title: string;
  description: string;
  category: "institutional" | "social";
  isUrgent?: boolean;
  router: any; // Adăugăm router-ul ca parametru pentru navigare SPA
}

export const showMbankToast = ({
  title,
  description,
  category,
  isUrgent = false,
  router,
}: ToastProps) => {
  toast.custom(
    (t) => {
      const isBank = category === "institutional";

      const handleToastClick = () => {
        // 1. Trimitem utilizatorul instant către centrul de notificări
        router.push("/dashboard/notifications");
        // 2. Închidem toast-ul de pe ecran după click
        toast.dismiss(t);
      };

      return (
        <div
          onClick={handleToastClick} // Click-ul pe tot cardul declanșează navigarea
          className={`w-full p-4 sm:p-5 backdrop-blur-xl border flex flex-col gap-3 shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-300 pointer-events-auto cursor-pointer hover:scale-[1.01] active:scale-[0.99] sm:rounded-2xl 
          ${
            isBank
              ? isUrgent
                ? "bg-red-950/40 border-red-500/30 shadow-[inset_0_1px_1px_rgba(239,68,68,0.2)]"
                : "bg-[#070d19]/80 border-cyan-500/30 shadow-[inset_0_1px_1px_rgba(34,211,238,0.2)]"
              : "bg-[#0b0a1a]/80 border-purple-500/30 shadow-[inset_0_1px_1px_rgba(168,85,247,0.2)]"
          }
        `}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              {/* Iconiță */}
              <div
                className={`p-2 rounded-xl border shrink-0 shadow-lg ${
                  isBank
                    ? isUrgent
                      ? "bg-red-500/20 border-red-500/40 text-red-400"
                      : "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                    : "bg-purple-500/10 border-purple-500/30 text-purple-400"
                }`}
              >
                {/* REPARAT: Acum avem structura completă: condiție ? (if_true ? x : y) : if_false */}
                {isBank ? (
                  isUrgent ? (
                    <ShieldAlert size={16} />
                  ) : (
                    <Landmark size={16} />
                  )
                ) : (
                  <Users size={16} />
                )}
              </div>

              {/* Text conținut */}
              <div className="space-y-0.5 min-w-0">
                <span
                  className={`text-[9px] uppercase tracking-widest font-black block ${isBank ? (isUrgent ? "text-red-400" : "text-cyan-400") : "text-purple-400"}`}
                >
                  {isBank
                    ? isUrgent
                      ? "CRITICAL SYSTEM"
                      : "BANK ALERTER"
                    : "P2P SOCIAL SIGNAL"}
                </span>
                <h4 className="text-xs sm:text-sm font-black text-white uppercase tracking-wide truncate">
                  {title}
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                  {description}
                </p>
              </div>
            </div>

            {/* Buton de închidere (Dismiss) */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // CRITIC: Oprește navigarea dacă se apasă doar pe X
                toast.dismiss(t);
              }}
              className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5 shrink-0 cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      );
    },
    {
      duration: isUrgent ? 8000 : 4500,
    },
  );
};
