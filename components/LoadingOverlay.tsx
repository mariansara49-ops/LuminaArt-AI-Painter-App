
import React, { useState, useEffect } from 'react';

const messages = [
  "Mixing the digital pigments...",
  "Sketching your imagination...",
  "Applying deep learning brushstrokes...",
  "Harmonizing color palettes...",
  "Capturing the essence of light...",
  "Refining artistic textures...",
  "Waiting for the AI muse..."
];

const LoadingOverlay: React.FC = () => {
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx((prev) => (prev + 1) % messages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-xl">
      <div className="relative w-24 h-24 mb-8">
        <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-purple-500 border-r-pink-500 rounded-full animate-spin"></div>
        <div className="absolute inset-4 bg-slate-900 rounded-full flex items-center justify-center">
          <i className="fas fa-palette text-2xl text-purple-400 animate-pulse"></i>
        </div>
      </div>
      <h2 className="text-xl font-outfit font-bold text-white mb-2 animate-bounce">
        LuminaArt is Painting...
      </h2>
      <p className="text-slate-400 font-medium animate-pulse">
        {messages[msgIdx]}
      </p>
      
      <div className="mt-12 w-64 h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-[loading_2s_ease-in-out_infinite]"></div>
      </div>

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default LoadingOverlay;
