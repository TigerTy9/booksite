import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function GlitchEffect() {
  const [isGlitching, setIsGlitching] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 3000); // Glitch lasts for 3s
    }, Math.floor(Math.random() * 30000) + 10000); // 30-60s interval
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen w-full bg-black flex items-center justify-center text-white overflow-hidden">
      {/* Background effect */}
      <motion.div
        className={`absolute inset-0 bg-black transition-all duration-500 ${isGlitching ? "opacity-30" : "opacity-0"}`}
        animate={{ opacity: isGlitching ? 1 : 0 }}
      />

      {/* Main text */}
      <h1 className={`text-4xl font-bold ${isGlitching ? "text-red-500" : "text-white"}`}>Cyber Restricted</h1>
      
      {/* Glitch overlay */}
      {isGlitching && (
        <motion.div
          className="absolute inset-0 text-center text-red-500 font-mono text-xl"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.2, repeat: 5 }}
        >
          <p>WARNING: DATA BREACH DETECTED</p>
          <p>Click to access restricted files...</p>
          <Button
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            onClick={() => setShowSecret(true)}
          >
            ACCESS FILES
          </Button>
        </motion.div>
      )}

      {/* Secret page */}
      {showSecret && (
        <div className="absolute inset-0 bg-gray-900 text-white flex flex-col items-center justify-center p-10">
          <h2 className="text-3xl font-bold mb-4">CLASSIFIED FILES UNLOCKED</h2>
          <p className="text-lg">"The government isn’t just watching… They’re controlling. The Implant is more than a tool—it’s a cage."</p>
          <Button className="mt-4" onClick={() => setShowSecret(false)}>Close</Button>
        </div>
      )}
    </div>
  );
}
