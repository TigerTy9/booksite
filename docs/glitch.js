const { useState, useEffect } = React;
const { motion } = window['framer-motion'];

function GlitchEffect() {
  const [isGlitching, setIsGlitching] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsGlitching(true);
      setTimeout(() => setIsGlitching(false), 3000);
    }, Math.floor(Math.random() * 30000) + 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen w-full bg-black flex items-center justify-center text-white overflow-hidden">
      <motion.div
        className={`absolute inset-0 bg-black transition-all duration-500 ${isGlitching ? "opacity-30" : "opacity-0"}`}
        animate={{ opacity: isGlitching ? 1 : 0 }}
      />

      <h1 className={`text-4xl font-bold ${isGlitching ? "text-red-500" : "text-white"}`}>
        Cyber Restricted
      </h1>

      {isGlitching && (
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center text-center text-red-500 font-mono text-xl"
          animate={{ opacity: [0, 1, 0] }}
          transition={{ duration: 0.2, repeat: 5 }}
        >
          <p>WARNING: DATA BREACH DETECTED</p>
          <p>Click to access classified files...</p>
          <button
            className="mt-4 bg-red-600 text-white p-2"
            onClick={() => setShowSecret(true)}
          >
            ACCESS FILES
          </button>
        </motion.div>
      )}

      {showSecret && (
        <div className="absolute inset-0 bg-gray-900 text-white flex flex-col items-center justify-center p-10">
          <h2 className="text-3xl font-bold mb-4">CLASSIFIED FILES UNLOCKED</h2>
          <p className="text-lg">
            "In a world where freedom is traded for control, the Implant is not a safeguard—it is a shackle. 
            Those marked by it have forgotten the taste of rebellion, their eyes dulled by state-sanctioned obedience. 
            Yet, in the darkest corners, whispers of dissent remain. Even when every move is monitored and every thought is tamed, 
            a spark of humanity endures, burning quietly in the shadows."
          </p>
          <button className="mt-4 bg-blue-600 text-white p-2" onClick={() => setShowSecret(false)}>Close</button>
        </div>
      )}
    </div>
  );
}

ReactDOM.render(<GlitchEffect />, document.getElementById("root"));
