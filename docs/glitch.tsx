import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function GlitchEffect() {
  const [isGlitching, setIsGlitching] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 3000);
    }, Math.floor(Math.random() * 5000) + 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen w-full bg-black flex items-center justify-center text-yellow-400 overflow-hidden font-mono">
      {/* Animated Background - Digital Rain Effect */}
      <div className="absolute inset-0 w-full h-full opacity-30 overflow-hidden">
        {[...Array(80)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-full bg-yellow-500"
            style={{ left: `${Math.random() * 100}%`, opacity: 0.3 }}
            animate={{ y: ["-100%", "100%"], opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: Math.random() * 2 + 1, repeat: Infinity }}
          />
        ))}
      </div>

      {/* Background Glitch Overlay */}
      <motion.div
        className={`absolute inset-0 bg-black transition-all duration-500 ${isGlitching ? "opacity-90" : "opacity-0"}`}
        animate={{ opacity: isGlitching ? 1 : 0 }}
      />

      {/* Main Title - Futuristic Glitching Effect */}
      {!showSecret && (
        <motion.h1
          className={`text-6xl font-extrabold tracking-widest relative ${isGlitching ? "text-neon-yellow" : "text-yellow-400"}`}
          animate={isGlitching ? { x: [0, -8, 8, 0], textShadow: ["0px 0px 12px #ff0", "0px 0px 20px #ff0"] } : {}}
          transition={{ duration: 0.1, repeat: Infinity }}
        >
          ██ CYBER RESTRICTED ██
        </motion.h1>
      )}

      {/* Flickering Intrusion Warning */}
      {isGlitching && !showSecret && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-red-500 font-mono text-2xl backdrop-blur-lg"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.2, repeat: 8 }}
        >
          <p>** INTRUSION DETECTED **</p>
          <p>ENCRYPTION OVERRIDE IN PROGRESS...</p>
          <Button
            className="mt-4 border border-red-500 bg-black text-red-500 px-6 py-3 hover:bg-red-700 shadow-neon-red"
            onClick={() => setShowSecret(true)}
          >
            EXECUTE BACKDOOR
          </Button>
        </motion.div>
      )}

      {/* Secret Hacking Console with Enhanced Glitch Lines */}
      {showSecret && (
        <div className="absolute inset-0 bg-black text-green-400 flex flex-col items-center justify-center p-10 animate-pulse border border-neon-green shadow-neon">
          <div className="absolute inset-0 opacity-50 overflow-hidden">
            {[...Array(200)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-lg font-bold text-green-500"
                style={{ top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%` }}
                animate={{ opacity: [0.2, 1, 0.2], x: [0, -4, 4, 0] }}
                transition={{ duration: Math.random() * 3 + 1, repeat: Infinity }}
              >
                {Math.random() < 0.5 ? "010101010101" : "101010101010"}
              </motion.div>
            ))}
          </div>
          <motion.h2 
            className="text-6xl font-extrabold mb-6 tracking-wide z-10 text-green-500"
            animate={{ x: [0, -5, 5, 0], textShadow: ["0px 0px 12px #0f0", "0px 0px 20px #0f0"] }}
            transition={{ duration: 0.1, repeat: Infinity }}
          >
            ** ACCESS GRANTED **
          </motion.h2>
          <p className="text-xl text-center font-mono leading-relaxed z-10">
            "Data stream decrypted. You have entered the black zone.<br/>
            The system is compromised. Escape is an illusion.<br/>
            The ghost in the machine watches. Every command is logged."
          </p>
          <Button className="mt-6 border border-green-400 bg-black text-green-400 px-8 py-4 hover:bg-green-700 shadow-neon-green text-xl z-10" onClick={() => setShowSecret(false)}>
            TERMINATE CONNECTION
          </Button>
        </div>
      )}
    </div>
  );
}
