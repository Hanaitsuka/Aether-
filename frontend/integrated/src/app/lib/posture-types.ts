/**
 * TypeScript type definitions for the posture detection library
 */

export interface PostureLandmarks {
  nose: MediaPipeLandmark;
  leftShoulder: MediaPipeLandmark;
  rightShoulder: MediaPipeLandmark;
  leftHip: MediaPipeLandmark;
  rightHip: MediaPipeLandmark;
  leftEar: MediaPipeLandmark;
  rightEar: MediaPipeLandmark;
}

export interface MediaPipeLandmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PostureMetrics {
  headShoulderRatio: number;
  shoulderAsymmetry: number;
  torsoAngle: number;
  neckAngle: number;
  forwardLean: number;
  shoulderWidth: number;
  timestamp: number;
}

export interface PostureAnalysis {
  isSlouching: boolean;
  issues: string[];
  severity: 'mild' | 'moderate' | 'severe';
  totalDeviation: string;
  currentMetrics: {
    headShoulder: string;
    shoulders: string;
    torso: string;
    neck: string;
    lean: string;
  };
}

export interface SlouchEvent {
  reason: string;
  severity: string;
  duration: number;
  deviation: string;
}

export interface CalibrationProgress {
  progress: number;
  framesCollected: number;
  framesRequired: number;
}

export interface PostureStats {
  sessionDuration: string;
  postureQuality: string;
  totalAlerts: number;
  currentState: 'SLOUCHED' | 'GOOD';
}

// Global declarations for MediaPipe (loaded via CDN)
declare global {
  class Pose {
    constructor(config: { locateFile: (file: string) => string });
    setOptions(options: Record<string, unknown>): void;
    onResults(callback: (results: PoseResults) => void): void;
    send(data: { image: HTMLVideoElement }): Promise<void>;
  }

  class Camera {
    constructor(
      video: HTMLVideoElement,
      config: { onFrame: () => Promise<void>; width: number; height: number }
    );
    start(): Promise<void>;
    stop(): void;
  }

  interface PoseResults {
    poseLandmarks?: MediaPipeLandmark[];
  }
}
