import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, Check } from "lucide-react";
import type { SlouchEvent } from "../lib/posture-types";

interface PostureOverlayProps {
  visible: boolean;
  slouchEvent: SlouchEvent | null;
  onDismiss?: () => void;
}

export function PostureOverlay({ visible, slouchEvent }: PostureOverlayProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="postureOverlay"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm pointer-events-none"
        >
          <div className="mx-4 backdrop-blur-2xl bg-rose-500/90 border border-rose-300/40 rounded-2xl p-4 shadow-2xl shadow-rose-500/30">
            <div className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Posture Alert</p>
                <p id="slouchReason" className="text-rose-100 text-xs mt-0.5">
                  {slouchEvent?.reason ?? "Slouching detected — sit up straight!"}
                </p>
                {slouchEvent?.severity && (
                  <span className={`inline-block mt-1.5 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    slouchEvent.severity === "severe"   ? "bg-red-700/60 text-red-100"
                    : slouchEvent.severity === "moderate" ? "bg-orange-600/60 text-orange-100"
                    : "bg-yellow-600/60 text-yellow-100"
                  }`}>
                    {slouchEvent.severity} — fix your posture to dismiss
                  </span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface PostureCorrectedToastProps {
  visible: boolean;
}

export function PostureCorrectedToast({ visible }: PostureCorrectedToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
        >
          <div className="backdrop-blur-2xl bg-emerald-500/90 border border-emerald-300/40 rounded-2xl px-5 py-3 shadow-2xl shadow-emerald-500/30 flex items-center gap-2">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
            <p className="text-white text-sm font-semibold">Great posture! Keep it up.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
