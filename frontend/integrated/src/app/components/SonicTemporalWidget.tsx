import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Maximize2, Minimize2, Timer, PlayCircle, PauseCircle, RotateCcw, Music } from "lucide-react";

interface SonicTemporalWidgetProps {
  mode: '3d' | '2d';
}

type PomodoroPreset = 'custom' | '25-5' | '50-10';

export function SonicTemporalWidget({ mode }: SonicTemporalWidgetProps) {
  // Minimize/Maximize States
  const [isMusicMinimized, setIsMusicMinimized] = useState(false);
  const [isTimerMinimized, setIsTimerMinimized] = useState(false);

  // Pomodoro Timer State
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'break'>('work');
  const [pomodoroPreset, setPomodoroPreset] = useState<PomodoroPreset>('25-5');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerRunning) {
      interval = setInterval(() => {
        if (seconds === 0) {
          if (minutes === 0) {
            // Timer finished - play alarm
            playAlarm();
            handleTimerComplete();
          } else {
            setMinutes(minutes - 1);
            setSeconds(59);
          }
        } else {
          setSeconds(seconds - 1);
        }
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isTimerRunning, minutes, seconds]);

  const playAlarm = () => {
    // Create alarm sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 1);

    // Play multiple beeps
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 800;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1);
      osc2.start(audioContext.currentTime);
      osc2.stop(audioContext.currentTime + 1);
    }, 300);
  };

  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    
    if (pomodoroPreset !== 'custom') {
      // Auto-switch for pomodoro modes
      if (pomodoroMode === 'work') {
        setPomodoroMode('break');
        const breakTime = pomodoroPreset === '25-5' ? 5 : 10;
        setMinutes(breakTime);
        setSeconds(0);
      } else {
        setPomodoroMode('work');
        const workTime = pomodoroPreset === '25-5' ? 25 : 50;
        setMinutes(workTime);
        setSeconds(0);
      }
    } else {
      setMinutes(0);
      setSeconds(0);
    }
  };

  const formatTime = () => {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    if (pomodoroPreset === '25-5') {
      setMinutes(pomodoroMode === 'work' ? 25 : 5);
    } else if (pomodoroPreset === '50-10') {
      setMinutes(pomodoroMode === 'work' ? 50 : 10);
    } else {
      setMinutes(25);
    }
    setSeconds(0);
  };

  const handlePresetChange = (preset: PomodoroPreset) => {
    setPomodoroPreset(preset);
    setIsTimerRunning(false);
    setPomodoroMode('work');
    setSeconds(0);
    
    if (preset === '25-5') {
      setMinutes(25);
    } else if (preset === '50-10') {
      setMinutes(50);
    } else {
      setMinutes(25);
    }
  };

  return (
    <div className="space-y-4">
      {/* Spotify Music Player */}
      <AnimatePresence mode="wait">
        {isMusicMinimized ? (
          <motion.div
            key="music-mini"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`backdrop-blur-2xl rounded-2xl p-3 border cursor-pointer ${
              mode === '3d'
                ? 'bg-black/30 border-amber-500/30 shadow-lg'
                : 'bg-white/60 border-teal-400/40 shadow-lg'
            }`}
            onClick={() => setIsMusicMinimized(false)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Music className={`w-4 h-4 ${mode === '3d' ? 'text-amber-300' : 'text-teal-600'}`} />
                <span className={`text-xs ${mode === '3d' ? 'text-amber-200' : 'text-teal-700'}`}>
                  Music Player
                </span>
              </div>
              <Maximize2 className={`w-3 h-3 ${mode === '3d' ? 'text-amber-300' : 'text-teal-600'}`} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="music-full"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`backdrop-blur-2xl rounded-3xl p-6 border ${
              mode === '3d'
                ? 'bg-black/30 border-amber-500/30 shadow-2xl shadow-black/50'
                : 'bg-white/60 border-teal-400/40 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl ${
                mode === '3d' ? 'font-serif text-amber-200' : 'font-sans text-teal-700'
              }`}>
                Sonic Flow
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsMusicMinimized(true)}
                className={`p-2 rounded-full transition-colors ${
                  mode === '3d' ? 'hover:bg-amber-500/20 text-amber-200' : 'hover:bg-teal-200 text-teal-700'
                }`}
              >
                <Minimize2 className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Spotify Embed */}
            <div className="rounded-2xl overflow-hidden">
              <iframe
                style={{ borderRadius: '12px' }}
                src="https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0"
                width="100%"
                height="352"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              ></iframe>
            </div>

            <p className={`text-xs mt-3 ${mode === '3d' ? 'text-amber-300/60' : 'text-teal-700/60'}`}>
              Full Spotify access - browse and play any track
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pomodoro Timer */}
      <AnimatePresence mode="wait">
        {isTimerMinimized ? (
          <motion.div
            key="timer-mini"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className={`backdrop-blur-2xl rounded-2xl p-3 border cursor-pointer ${
              mode === '3d'
                ? 'bg-black/30 border-orange-500/30 shadow-lg'
                : 'bg-white/60 border-pink-400/40 shadow-lg'
            }`}
            onClick={() => setIsTimerMinimized(false)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Timer className={`w-4 h-4 ${mode === '3d' ? 'text-orange-300' : 'text-pink-600'}`} />
                <span className={`text-sm font-mono ${mode === '3d' ? 'text-orange-200' : 'text-pink-700'}`}>
                  {formatTime()}
                </span>
              </div>
              <Maximize2 className={`w-3 h-3 ${mode === '3d' ? 'text-orange-300' : 'text-pink-600'}`} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="timer-full"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className={`backdrop-blur-2xl rounded-3xl p-6 border ${
              mode === '3d'
                ? 'bg-black/30 border-orange-500/30 shadow-2xl shadow-black/50'
                : 'bg-white/60 border-pink-400/40 shadow-xl'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-xl ${
                mode === '3d' ? 'font-serif text-orange-200' : 'font-sans text-pink-700'
              }`}>
                Temporal Flow
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsTimerMinimized(true)}
                className={`p-2 rounded-full transition-colors ${
                  mode === '3d' ? 'hover:bg-orange-500/20 text-orange-200' : 'hover:bg-pink-200 text-pink-700'
                }`}
              >
                <Minimize2 className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Pomodoro Preset Selector */}
            <div className={`flex gap-2 mb-4 p-1 rounded-xl ${
              mode === '3d' ? 'bg-orange-900/30' : 'bg-pink-100'
            }`}>
              <button
                onClick={() => handlePresetChange('custom')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  pomodoroPreset === 'custom'
                    ? mode === '3d'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-pink-500 text-white shadow-lg'
                    : mode === '3d'
                      ? 'text-orange-300 hover:bg-orange-800/30'
                      : 'text-pink-600 hover:bg-pink-200'
                }`}
              >
                Custom
              </button>
              <button
                onClick={() => handlePresetChange('25-5')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  pomodoroPreset === '25-5'
                    ? mode === '3d'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-pink-500 text-white shadow-lg'
                    : mode === '3d'
                      ? 'text-orange-300 hover:bg-orange-800/30'
                      : 'text-pink-600 hover:bg-pink-200'
                }`}
              >
                25-5 Pomodoro
              </button>
              <button
                onClick={() => handlePresetChange('50-10')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  pomodoroPreset === '50-10'
                    ? mode === '3d'
                      ? 'bg-orange-500 text-white shadow-lg'
                      : 'bg-pink-500 text-white shadow-lg'
                    : mode === '3d'
                      ? 'text-orange-300 hover:bg-orange-800/30'
                      : 'text-pink-600 hover:bg-pink-200'
                }`}
              >
                50-10 Pomodoro
              </button>
            </div>

            {/* Mode Indicator */}
            {pomodoroPreset !== 'custom' && (
              <div className={`text-center text-sm mb-2 ${
                mode === '3d' ? 'text-orange-300' : 'text-pink-600'
              }`}>
                {pomodoroMode === 'work' ? '🎯 Focus Time' : '☕ Break Time'}
              </div>
            )}

            {/* Custom Time Input */}
            {pomodoroPreset === 'custom' && !isTimerRunning && (
              <div className="flex gap-3 mb-4">
                <div className="flex-1">
                  <label className={`block text-xs mb-1 ${
                    mode === '3d' ? 'text-orange-300' : 'text-pink-600'
                  }`}>
                    Minutes
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={minutes}
                    onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                    className={`w-full px-3 py-2 rounded-lg text-center ${
                      mode === '3d'
                        ? 'bg-orange-900/30 border border-orange-500/20 text-orange-100'
                        : 'bg-pink-50 border border-pink-300 text-pink-900'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <label className={`block text-xs mb-1 ${
                    mode === '3d' ? 'text-orange-300' : 'text-pink-600'
                  }`}>
                    Seconds
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={seconds}
                    onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                    className={`w-full px-3 py-2 rounded-lg text-center ${
                      mode === '3d'
                        ? 'bg-orange-900/30 border border-orange-500/20 text-orange-100'
                        : 'bg-pink-50 border border-pink-300 text-pink-900'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Timer Display */}
            <div className={`text-6xl text-center mb-6 font-mono ${
              mode === '3d' ? 'text-orange-100' : 'text-pink-700'
            }`}>
              {formatTime()}
            </div>

            {/* Timer Controls */}
            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                  mode === '3d'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-gradient-to-r from-pink-400 to-purple-500 text-white shadow-lg'
                }`}
              >
                {isTimerRunning ? (
                  <>
                    <PauseCircle className="w-5 h-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayCircle className="w-5 h-5" />
                    Start
                  </>
                )}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetTimer}
                className={`px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-colors ${
                  mode === '3d'
                    ? 'bg-orange-500/20 text-orange-200 hover:bg-orange-500/30'
                    : 'bg-pink-200 text-pink-700 hover:bg-pink-300'
                }`}
              >
                <RotateCcw className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
