import { motion } from "motion/react";
import { Moon, Waves, Snowflake, Coffee } from "lucide-react";

type Environment = "cozy-evening" | "beach-studio" | "winter-studio" | "night-study";

interface EnvironmentGalleryProps {
  selectedEnv: Environment;
  onSelectEnv: (env: Environment) => void;
  mode: '3d' | '2d';
}

const environments = [
  { id: "cozy-evening" as Environment, name: "Cozy Evening", icon: Coffee, color3d: "from-purple-500 to-orange-600", color2d: "from-purple-300 to-orange-400" },
  { id: "beach-studio" as Environment, name: "Beach Studio", icon: Waves, color3d: "from-blue-500 to-cyan-600", color2d: "from-blue-300 to-cyan-400" },
  { id: "winter-studio" as Environment, name: "Winter Studio", icon: Snowflake, color3d: "from-slate-500 to-blue-600", color2d: "from-slate-300 to-blue-400" },
  { id: "night-study" as Environment, name: "Night Study", icon: Moon, color3d: "from-amber-600 to-green-700", color2d: "from-amber-300 to-green-400" }
];

export function EnvironmentGallery({ selectedEnv, onSelectEnv, mode }: EnvironmentGalleryProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div className="backdrop-blur-2xl bg-white/10 border border-white/20 rounded-full px-6 py-3 shadow-2xl">
        <div className="flex items-center gap-3">
          {environments.map((env) => {
            const Icon = env.icon;
            const isSelected = selectedEnv === env.id;
            
            return (
              <motion.button
                key={env.id}
                onClick={() => onSelectEnv(env.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                    isSelected
                      ? `bg-gradient-to-br ${mode === '3d' ? env.color3d : env.color2d} shadow-lg`
                      : 'bg-white/20 hover:bg-white/30'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : mode === '3d' ? 'text-amber-200' : 'text-teal-600'}`} />
                </div>
                
                {/* Selection Ring */}
                {isSelected && (
                  <motion.div
                    layoutId="selection-ring"
                    className={`absolute inset-0 rounded-full border-2 ${
                      mode === '3d' ? 'border-amber-400' : 'border-teal-400'
                    }`}
                    transition={{ type: "spring", duration: 0.6 }}
                  />
                )}

                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {env.name}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}