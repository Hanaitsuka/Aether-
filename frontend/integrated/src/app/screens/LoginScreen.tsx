import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Sparkles } from "lucide-react";

export function LoginScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate("/calibration");
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-rose-100 via-amber-50 to-sky-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-2xl bg-white/30 border border-white/50 rounded-3xl p-8 shadow-2xl">
          {/* Logo/Title */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-400 to-rose-400 rounded-full mb-4"
            >
              <Sparkles className="w-8 h-8 text-white" />
            </motion.div>
            <h1 className="text-4xl font-serif mb-2 text-gray-800">AETHER</h1>
            <p className="text-sm text-gray-600">
              {isSignup ? "Create Your Sanctuary" : "Enter Your Sanctuary"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignup && (
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-gray-400"
                  required={isSignup}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Sanctuary Key
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@sanctuary.com"
                className="w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-gray-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-2">
                Entry Code
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl backdrop-blur-xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all placeholder:text-gray-400"
                required
              />
            </div>

            {/* CTA Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-400 to-rose-400 text-white font-medium shadow-lg shadow-amber-400/30 hover:shadow-xl hover:shadow-amber-400/40 transition-all"
            >
              {isSignup ? "Create Sanctuary" : "Enter Sanctuary"}
            </motion.button>
          </form>

          {/* Toggle between Login/Signup */}
          <div className="text-center mt-6">
            <button
              onClick={() => setIsSignup(!isSignup)}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isSignup ? (
                <>
                  Already have an account?{" "}
                  <span className="text-amber-600 font-medium">Login</span>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <span className="text-amber-600 font-medium">Sign up</span>
                </>
              )}
            </button>
          </div>

          {/* Footer Text */}
          <p className="text-center text-xs text-gray-500 mt-6">
            Your journey to mindful productivity begins here
          </p>
          
          {/* Demo Note */}
          <div className="text-center text-xs text-gray-400 mt-2 italic">
            Demo: Use any email and password to enter
          </div>
        </div>
      </motion.div>
    </div>
  );
}