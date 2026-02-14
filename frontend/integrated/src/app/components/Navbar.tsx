import { useAesthetic } from "../context/AestheticContext";
import { motion } from "motion/react";
import { Box, Palette, LogOut } from "lucide-react";
import { useNavigate } from "react-router";

export function Navbar() {
  const { mode, toggleMode } = useAesthetic();
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-white/10 border-b border-white/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className={`text-2xl ${mode === '3d' ? 'font-serif text-amber-200' : 'font-sans text-teal-600'}`}>
          AETHER
        </div>

        {/* Perspective Toggle - Centered */}
        <div className="absolute left-1/2 -translate-x-1/2">
          <motion.button
            onClick={toggleMode}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`px-6 py-2 rounded-full backdrop-blur-xl border-2 flex items-center gap-2 transition-all ${
              mode === '3d'
                ? 'bg-amber-500/20 border-amber-400/50 text-amber-200'
                : 'bg-teal-500/20 border-teal-400/50 text-teal-600'
            }`}
          >
            {mode === '3d' ? (
              <>
                <Box className="w-5 h-5" />
                <span>3D Cinematic</span>
              </>
            ) : (
              <>
                <Palette className="w-5 h-5" />
                <span>2D Lofi</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Right Side - Logout */}
        <motion.button
          onClick={handleLogout}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border transition-all ${
            mode === '3d'
              ? 'bg-red-500/20 border-red-400/50 text-red-200 hover:bg-red-500/30'
              : 'bg-red-400/20 border-red-300/50 text-red-600 hover:bg-red-400/30'
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </motion.button>
      </div>
    </nav>
  );
}