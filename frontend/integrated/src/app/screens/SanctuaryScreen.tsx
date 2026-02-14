import { useState } from "react";
import { useAesthetic } from "../context/AestheticContext";
import { motion } from "motion/react";
import { Navbar } from "../components/Navbar";
import { EnvironmentGallery } from "../components/EnvironmentGallery";
import { SonicTemporalWidget } from "../components/SonicTemporalWidget";
import { KnowledgeNexusWidget } from "../components/KnowledgeNexusWidget";
import { PostureOverlay, PostureCorrectedToast } from "../components/PostureOverlay";
import { usePostureMonitor } from "../hooks/usePostureMonitor";

import cozyEveningBg from "../../assets/908fc3f6eed6f65df50d0d5230e1034b883b6d42.png";
import beachStudioBg from "../../assets/9043200908ac0dfb46c82aaea44020cf45a6c178.png";
import winterStudioBg from "../../assets/3219b9e23c240673f05a7a3b5f4196fbbb07efbf.png";
import nightStudyBg from "../../assets/bcab8b830b4aec77c532a2d5ad5e88bf88b9b9b1.png";

type Environment = "cozy-evening" | "beach-studio" | "winter-studio" | "night-study";

export function SanctuaryScreen() {
  const { mode } = useAesthetic();
  const [selectedEnv, setSelectedEnv] = useState<Environment>("cozy-evening");
  const { slouching, slouchEvent, corrected, active } = usePostureMonitor();

  const getEnvironmentBackground = (env: Environment) => {
    const backgrounds = {
      "cozy-evening": cozyEveningBg,
      "beach-studio": beachStudioBg,
      "winter-studio": winterStudioBg,
      "night-study": nightStudyBg,
    };
    return backgrounds[env];
  };

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      {/* Posture Overlays */}
      <PostureOverlay visible={slouching} slouchEvent={slouchEvent} />
      <PostureCorrectedToast visible={corrected} />
      {/* Posture status pill */}
      {active && (
        <div className="fixed bottom-24 right-4 z-40">
          <div className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-md border font-medium transition-all ${
            slouching
              ? "bg-rose-500/80 border-rose-300/40 text-white"
              : "bg-emerald-500/80 border-emerald-300/40 text-white"
          }`}>
            {slouching ? "⚠ Fix posture" : "✓ Good posture"}
          </div>
        </div>
      )}
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 -z-10">
        <img
          src={getEnvironmentBackground(selectedEnv)}
          alt="Environment background"
          className="w-full h-full object-cover transition-opacity duration-700"
        />
        {/* Overlay based on mode */}
        <div className={`absolute inset-0 transition-all duration-700 ${
          mode === '3d'
            ? 'bg-black/30'
            : 'bg-white/20'
        }`}></div>
        
        {/* Additional lighting effects for 3D mode */}
        {mode === '3d' && (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30"></div>
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-amber-400/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"></div>
          </>
        )}
      </div>

      {/* Navbar */}
      <Navbar />

      {/* Main Content Area */}
      <div className="container mx-auto px-4 pt-24 pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Sonic & Temporal Widget */}
          <div className="lg:col-span-1">
            <SonicTemporalWidget mode={mode} />
          </div>

          {/* Middle/Right Column - Knowledge Nexus */}
          <div className="lg:col-span-2">
            <KnowledgeNexusWidget mode={mode} />
          </div>
        </div>
      </div>

      {/* Environment Gallery - Bottom */}
      <EnvironmentGallery
        selectedEnv={selectedEnv}
        onSelectEnv={setSelectedEnv}
        mode={mode}
      />
    </div>
  );
}
