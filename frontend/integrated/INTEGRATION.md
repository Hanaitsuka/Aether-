# AETHER × StudyPosture — Integration Guide

## What was done

The two projects have been merged into a single React (Vite + TypeScript) app.
StudyPosture's vanilla-JS posture-detection engine now runs **inside** the AETHER UI.

---

## File structure of the integrated project

```
integrated/
├── public/
│   └── src/app/lib/               ← BE scripts served at runtime (browser loads these)
│       ├── pose-detection.js
│       ├── calibration.js
│       └── calibrated-posture-monitor.js
│
├── src/app/
│   ├── lib/                       ← BE source files + TS types
│   │   ├── pose-detection.js
│   │   ├── calibration.js
│   │   ├── calibrated-posture-monitor.js
│   │   └── posture-types.ts       ← TypeScript types for all BE classes
│   │
│   ├── hooks/
│   │   └── usePostureMonitor.ts   ← React hook that wires up BE engine
│   │
│   ├── components/
│   │   └── PostureOverlay.tsx     ← Alert banner + "corrected" toast
│   │
│   └── screens/
│       ├── CalibrationScreen.tsx  ← REPLACED — full 2-step calibration flow
│       └── SanctuaryScreen.tsx    ← UPDATED — posture monitoring active during study
```

---

## How the integration works

### 1. CalibrationScreen (Aether) ← StudyPosture calibration.js

The existing AETHER calibration screen now runs a **2-step calibration**:

| Step | What happens |
|------|-------------|
| `align` | Camera starts, skeleton overlay shows, waits for pose detected |
| `good`  | `PostureCalibrator.startCalibration("good")` — 6 s of good posture captured |
| `bad`   | `PostureCalibrator.startCalibration("slouched")` — 6 s of slouch captured |
| `success` | `saveCalibration()` stores data to `localStorage`, navigates to Sanctuary |

**Graceful degradation:** If MediaPipe fails to load (network/CORS), the progress bars simulate
and the user still reaches Sanctuary — posture monitoring is silently disabled.

---

### 2. SanctuaryScreen (Aether) ← CalibratedPostureMonitor.js + PoseDetector.js

The `usePostureMonitor` hook runs in the background:

```tsx
// SanctuaryScreen.tsx (simplified)
const { slouching, slouchEvent, corrected, active } = usePostureMonitor();
```

- Creates a hidden `<video>` + `<canvas>` pair for camera access
- Loads `CalibratedPostureMonitor` with saved calibration
- Calls `processFrame()` on every MediaPipe result
- **15 seconds of slouching** → `<PostureOverlay>` appears (rose red banner at top)
- **2.5 seconds of good posture** → overlay dismisses + green toast shows
- Posture status pill (bottom-right corner) shows live state

---

## Running the project

```bash
cd integrated
npm install       # or pnpm install
npm run dev
```

Then open `http://localhost:5173`.

**Flow:**  Login → Calibration (2-step) → Sanctuary (posture monitored live)

---

## Known issues & next steps

### 1. Vite asset imports (`figma:asset/...`)
SanctuaryScreen imports background images using Figma's proprietary `figma:asset/...` protocol.
These **won't work outside Figma** — you'll see broken images.

**Fix:** Replace with real image paths:
```tsx
// Before (Figma-only)
import cozyEveningBg from "figma:asset/3219b9e23c240673f05a7a3b5f4196fbbb07efbf.png";

// After (standard Vite)
import cozyEveningBg from "../assets/cozy-evening.png";
```
The image files are already present at `src/assets/*.png` — just rename them.

### 2. MediaPipe CORS / CDN availability
MediaPipe loads from `cdn.jsdelivr.net` at runtime. In local dev this works fine.
If deploying offline or behind a strict CSP, self-host the MediaPipe bundle:

```bash
npm install @mediapipe/pose @mediapipe/camera_utils @mediapipe/drawing_utils
```
Then update the `locateFile` path in `pose-detection.js`.

### 3. Camera permissions
The app requests camera access on both CalibrationScreen AND SanctuaryScreen
(separate background stream). Browsers typically ask once per domain — both requests
re-use the same permission grant.

### 4. `react-webcam` peer dep
`package.json` lists `react-webcam: "^7.2.0"` as a dependency but React 18 as a
peer dependency. Run `npm install --legacy-peer-deps` if you hit peer dep warnings.

---

## Sensitivity tuning (StudyPosture BE)

Edit `src/app/lib/calibrated-posture-monitor.js`:

```js
this.requiredSlouchFrames = 100; // 15 s → lower = more sensitive
this.requiredGoodFrames   = 10;  // 2.5 s to dismiss → higher = stricter
```

And inside `analyzePostureVsCalibration()`:
```js
const headShoulderThreshold = goodPosture.headShoulderRatio * 0.20; // 20% tolerance
// Lower = stricter (0.15), Higher = forgiving (0.25)
```
