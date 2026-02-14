/**
 * usePostureMonitor
 * ------------------
 * Wires up the StudyPosture vanilla-JS backend classes (PoseDetector,
 * PostureCalibrator, CalibratedPostureMonitor) with React state so any
 * component can react to posture events.
 *
 * Usage:
 *   const { slouching, slouchEvent, stats } = usePostureMonitor();
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { SlouchEvent, PostureStats } from "../lib/posture-types";

const MEDIAPIPE_SCRIPTS = [
  "https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/control_utils/control_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js",
  "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js",
];

function ensureScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // silent degrade
    document.head.appendChild(s);
  });
}

export interface UsePostureMonitorReturn {
  /** Is the user currently slouching? */
  slouching: boolean;
  /** Details of the latest slouch event */
  slouchEvent: SlouchEvent | null;
  /** Whether posture was just corrected (auto-clears after 3 s) */
  corrected: boolean;
  /** Running session stats */
  stats: PostureStats | null;
  /** Whether posture monitoring is active */
  active: boolean;
}

export function usePostureMonitor(): UsePostureMonitorReturn {
  const [slouching,    setSlouching]    = useState(false);
  const [slouchEvent,  setSlouchEvent]  = useState<SlouchEvent | null>(null);
  const [corrected,    setCorrected]    = useState(false);
  const [stats,        setStats]        = useState<PostureStats | null>(null);
  const [active,       setActive]       = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const detectorRef  = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const monitorRef   = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const calibratorRef = useRef<any>(null);
  const correctedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const start = useCallback(async () => {
    // ── Load MediaPipe + BE scripts if not already present ─────────────────
    for (const src of MEDIAPIPE_SCRIPTS) await ensureScript(src);
    await ensureScript("/src/app/lib/pose-detection.js");
    await ensureScript("/src/app/lib/calibration.js");
    await ensureScript("/src/app/lib/calibrated-posture-monitor.js");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PD  = (window as any).PoseDetector;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const PC  = (window as any).PostureCalibrator;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const CPM = (window as any).CalibratedPostureMonitor;

    if (!PD || !PC || !CPM) {
      console.warn("[usePostureMonitor] BE classes not found — monitoring disabled");
      return;
    }

    // Re-use existing calibration if saved
    calibratorRef.current = new PC();
    calibratorRef.current.loadCalibration();

    if (!calibratorRef.current.hasCalibration()) {
      console.warn("[usePostureMonitor] No calibration data — monitoring disabled");
      return;
    }

    monitorRef.current = new CPM(calibratorRef.current);
    monitorRef.current.onSlouch((event: SlouchEvent) => {
      setSlouching(true);
      setSlouchEvent(event);
    });
    monitorRef.current.onCorrection(() => {
      setSlouching(false);
      setSlouchEvent(null);
      setCorrected(true);
      if (correctedTimer.current) clearTimeout(correctedTimer.current);
      correctedTimer.current = setTimeout(() => setCorrected(false), 3000);
    });

    // Create a hidden video element for background detection
    let video = document.getElementById("__postureVideo") as HTMLVideoElement | null;
    let canvas = document.getElementById("__postureCanvas") as HTMLCanvasElement | null;

    if (!video) {
      video = document.createElement("video");
      video.id = "__postureVideo";
      video.style.cssText = "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;";
      document.body.appendChild(video);
    }
    if (!canvas) {
      canvas = document.createElement("canvas");
      canvas.id = "__postureCanvas";
      canvas.style.cssText = "position:fixed;opacity:0;pointer-events:none;width:1px;height:1px;";
      document.body.appendChild(canvas);
    }

    detectorRef.current = new PD();
    const ok = await detectorRef.current.initialize("__postureVideo", "__postureCanvas");
    if (!ok) return;

    monitorRef.current.start();
    setActive(true);

    await detectorRef.current.start((results: { poseLandmarks?: unknown[] }) => {
      const landmarks = PD.extractLandmarks(results);
      if (!landmarks) return;
      const metrics = PD.calculatePostureMetrics(landmarks);
      if (metrics) monitorRef.current.processFrame(metrics);
    });

    // Update stats every 30 s
    const statsInterval = setInterval(() => {
      if (monitorRef.current) setStats(monitorRef.current.getStats());
    }, 30_000);

    return () => clearInterval(statsInterval);
  }, []);

  useEffect(() => {
    // Only start monitoring if we were calibrated this session
    const calibrated = sessionStorage.getItem("postureCalibrated");
    if (calibrated) start();

    return () => {
      detectorRef.current?.stop?.();
      monitorRef.current?.stop?.();
      if (correctedTimer.current) clearTimeout(correctedTimer.current);
      // Clean up injected elements
      document.getElementById("__postureVideo")?.remove();
      document.getElementById("__postureCanvas")?.remove();
    };
  }, [start]);

  return { slouching, slouchEvent, corrected, stats, active };
}
