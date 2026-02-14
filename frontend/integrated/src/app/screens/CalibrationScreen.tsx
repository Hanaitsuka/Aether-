import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import Webcam from "react-webcam";
import { Check, AlertCircle, Wifi, WifiOff } from "lucide-react";
import type { PostureMetrics, CalibrationProgress } from "../lib/posture-types";

// ─── MediaPipe CDN scripts ───────────────────────────────────────────────────
const MEDIAPIPE_SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js",
];

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.crossOrigin = "anonymous";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

// ─── Calibration step machine ────────────────────────────────────────────────
type CalibStep = "loading" | "align" | "good" | "bad" | "success" | "error";

const STEP_LABEL: Record<CalibStep, string> = {
  loading: "Initialising camera…",
  align:   "Align yourself in frame",
  good:    "Hold your BEST posture",
  bad:     "Now slouch naturally",
  success: "Calibration complete!",
  error:   "Camera unavailable",
};

export function CalibrationScreen() {
  const navigate = useNavigate();
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef   = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calibratorRef = useRef<any>(null);

  const [step,      setStep]      = useState<CalibStep>("loading");
  const [progress,  setProgress]  = useState(0);
  const [poseOk,    setPoseOk]    = useState(false);
  const [scriptsOk, setScriptsOk] = useState(false);

  // ── 1. Load MediaPipe + BE vanilla-JS classes ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        for (const src of MEDIAPIPE_SCRIPTS) await loadScript(src);

        // Inject BE scripts as plain <script> tags so their classes land on window
        const beFiles = [
          "/src/app/lib/pose-detection.js",
          "/src/app/lib/calibration.js",
          "/src/app/lib/calibrated-posture-monitor.js",
        ];
        for (const src of beFiles) {
          await new Promise<void>((res) => {
            if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
            const s = document.createElement("script");
            s.src = src;
            s.onload = () => res();
            s.onerror = () => res(); // silent — graceful degradation
            document.head.appendChild(s);
          });
        }

        setScriptsOk(true);
      } catch {
        setScriptsOk(false);
        setStep("align");
      }
    })();
  }, []);

  // ── 2. Init PoseDetector after scripts + webcam mount ───────────────────
  const initDetector = useCallback(async () => {
    const video = webcamRef.current?.video;
    if (!video || !canvasRef.current) return;

    video.id             = "calibrationWebcam";
    canvasRef.current.id = "calibrationCanvas";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PD = (window as any).PoseDetector;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PC = (window as any).PostureCalibrator;

    if (!PD || !PC) { setStep("align"); return; }   // graceful degradation

    detectorRef.current   = new PD();
    calibratorRef.current = new PC();

    const ok = await detectorRef.current.initialize("calibrationWebcam", "calibrationCanvas");
    if (ok) {
      setStep("align");
      await detectorRef.current.start((results: { poseLandmarks?: unknown[] }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const landmarks = PD.extractLandmarks(results as any);
        if (!landmarks) { setPoseOk(false); return; }
        setPoseOk(true);

        if (calibratorRef.current?.isCalibrating) {
          const metrics: PostureMetrics = PD.calculatePostureMetrics(landmarks);
          if (metrics) {
            const info: CalibrationProgress = calibratorRef.current.addCalibrationFrame(metrics);
            if (info) setProgress(info.progress);
          }
        }
      });
    } else {
      setStep("error");
    }
  }, []);

  useEffect(() => {
    if (scriptsOk) {
      const t = setTimeout(initDetector, 800);
      return () => clearTimeout(t);
    }
  }, [scriptsOk, initDetector]);

  // ── 3. Simulate progress when detector not available ────────────────────
  const simulateProgress = (onDone: () => void) => {
    let p = 0;
    const iv = setInterval(() => {
      p += 1.7;
      setProgress(p);
      if (p >= 100) { clearInterval(iv); setProgress(100); onDone(); }
    }, 40);
  };

  // ── 4. Calibration step actions ──────────────────────────────────────────
  const startGoodPosture = () => {
    setProgress(0);
    setStep("good");
    if (calibratorRef.current) {
      calibratorRef.current.startCalibration("good");
    } else {
      simulateProgress(() => { setProgress(0); setStep("bad"); });
    }
  };

  // Progress watcher — advance steps when detector drives it to 100
  useEffect(() => {
    if (progress < 100) return;
    if (step === "good") {
      setProgress(0);
      setStep("bad");
      if (calibratorRef.current) calibratorRef.current.startCalibration("slouched");
    } else if (step === "bad") {
      if (calibratorRef.current) calibratorRef.current.saveCalibration();
      setStep("success");
      sessionStorage.setItem("postureCalibrated", JSON.stringify({ calibratedAt: Date.now() }));
      setTimeout(() => navigate("/sanctuary"), 1800);
    }
  }, [progress, step, navigate]);

  // ── Cleanup ───────────────────────────────────────────────────────────────
  useEffect(() => () => { detectorRef.current?.stop?.(); }, []);

  // ── UI helpers ───────────────────────────────────────────────────────────
  const canProceed = step === "align" && (poseOk || !scriptsOk);
  const buttonLabel = () => {
    if (step === "loading")                      return "Setting up…";
    if (step === "align" && !poseOk && scriptsOk) return "Waiting for pose…";
    if (step === "align")                        return "Start Calibration";
    if (step === "good")                         return "Hold this pose…";
    if (step === "bad")                          return "Slouch naturally…";
    if (step === "error")                        return "Retry";
    return "Done";
  };

  const ringColor =
    step === "good"    ? "border-cyan-400/70   shadow-cyan-500/30"
    : step === "bad"  ? "border-orange-400/70 shadow-orange-500/30"
    : step === "success" ? "border-green-400/70 shadow-green-500/30"
    : "border-cyan-500/30 shadow-cyan-500/20";

  const barGradient =
    step === "bad" ? "from-orange-400 to-rose-400" : "from-cyan-400 to-teal-400";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
      </div>

      {/* Hidden canvas for MediaPipe */}
      <canvas ref={canvasRef} className="hidden" width={640} height={480} />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 relative z-10"
      >
        <h1 className="text-3xl font-serif text-white mb-2">The Calibration Chamber</h1>
        <p className="text-lg text-cyan-400">{STEP_LABEL[step]}</p>
      </motion.div>

      {/* Webcam circle */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 mb-10"
      >
        <div className={`relative w-[420px] h-[420px] rounded-full overflow-hidden backdrop-blur-xl bg-white/5 border-4 shadow-2xl transition-colors duration-500 ${ringColor}`}>
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            className="w-full h-full object-cover"
            videoConstraints={{ width: 420, height: 420, facingMode: "user" }}
          />

          {/* Skeleton guide */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg viewBox="0 0 200 300" className="w-40 h-60 opacity-35" fill="none">
              <circle cx="100" cy="40" r="28" stroke="#06b6d4" strokeWidth="2.5" />
              <line x1="100" y1="68"  x2="100" y2="175" stroke="#06b6d4" strokeWidth="2.5" />
              <line x1="100" y1="88"  x2="62"  y2="108" stroke="#06b6d4" strokeWidth="2.5" />
              <line x1="100" y1="88"  x2="138" y2="108" stroke="#06b6d4" strokeWidth="2.5" />
              <line x1="62"  y1="108" x2="52"  y2="158" stroke="#06b6d4" strokeWidth="2.5" />
              <line x1="138" y1="108" x2="148" y2="158" stroke="#06b6d4" strokeWidth="2.5" />
              <circle cx="100" cy="88"  r="4" fill="#06b6d4" />
              <circle cx="100" cy="130" r="4" fill="#06b6d4" />
              <circle cx="100" cy="170" r="4" fill="#06b6d4" />
            </svg>
          </div>

          {/* Pose detected indicator */}
          <div className="absolute top-4 right-4">
            {poseOk
              ? <Wifi    className="w-5 h-5 text-green-400 drop-shadow" />
              : <WifiOff className="w-5 h-5 text-slate-400 drop-shadow" />
            }
          </div>

          {/* Success overlay */}
          <AnimatePresence>
            {step === "success" && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center bg-green-500/20 backdrop-blur-sm"
              >
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.6 }}
                  className="w-28 h-28 rounded-full bg-green-500 flex items-center justify-center"
                >
                  <Check className="w-14 h-14 text-white" strokeWidth={3} />
                </motion.div>
              </motion.div>
            )}
            {step === "error" && (
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="absolute inset-0 flex items-center justify-center bg-red-900/60 backdrop-blur-sm"
              >
                <AlertCircle className="w-16 h-16 text-red-400" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Idle pulse ring */}
        {step === "align" && (
          <motion.div
            animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 rounded-full border-4 border-cyan-400/50 -z-10"
          />
        )}
      </motion.div>

      {/* Progress bar */}
      <AnimatePresence>
        {(step === "good" || step === "bad") && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="w-[420px] mb-6 relative z-10"
          >
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>{step === "good" ? "Capturing good posture" : "Capturing slouched posture"}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${barGradient}`}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Step hint text */}
      <AnimatePresence mode="wait">
        {step === "align" && (
          <motion.p key="a" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-slate-400 text-sm mb-6 text-center max-w-xs relative z-10"
          >
            Make sure your <span className="text-cyan-400">head, shoulders & torso</span> are visible.
            {scriptsOk && " The green icon confirms pose is detected."}
          </motion.p>
        )}
        {step === "good" && (
          <motion.p key="g" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-slate-400 text-sm mb-6 text-center max-w-xs relative z-10"
          >
            Sit <span className="text-cyan-400">tall, shoulders back</span>, chin level. Hold ~6 s.
          </motion.p>
        )}
        {step === "bad" && (
          <motion.p key="b" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="text-slate-400 text-sm mb-6 text-center max-w-xs relative z-10"
          >
            <span className="text-orange-400">Slouch forward</span> as you naturally do when tired. Hold ~6 s.
          </motion.p>
        )}
      </AnimatePresence>

      {/* CTA button */}
      <motion.button
        onClick={
          step === "align" ? startGoodPosture
          : step === "error" ? () => window.location.reload()
          : undefined
        }
        disabled={
          step === "loading" || step === "good" || step === "bad" ||
          step === "success" || (step === "align" && !canProceed)
        }
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        whileHover={canProceed || step === "error" ? { scale: 1.05 } : {}}
        whileTap  ={canProceed || step === "error" ? { scale: 0.95 } : {}}
        className={`relative z-10 px-12 py-4 rounded-full text-lg font-medium transition-all ${
          canProceed
            ? "bg-cyan-500 hover:bg-cyan-400 text-white shadow-lg shadow-cyan-500/50"
            : step === "error"
            ? "bg-red-500 hover:bg-red-400 text-white shadow-lg"
            : "bg-cyan-500/30 cursor-not-allowed text-white/60"
        }`}
      >
        {step === "loading" ? (
          <span className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
            Initialising…
          </span>
        ) : buttonLabel()}
      </motion.button>

      {/* Skip link */}
      {(step === "align" || step === "error") && (
        <button
          onClick={() => navigate("/sanctuary")}
          className="mt-4 text-xs text-slate-500 hover:text-slate-300 transition-colors relative z-10 underline underline-offset-2"
        >
          Skip calibration (posture detection uses defaults)
        </button>
      )}
    </div>
  );
}
