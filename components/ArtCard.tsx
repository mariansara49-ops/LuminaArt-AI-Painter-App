
import React from 'react';
import { GeneratedArt } from '../types';

interface ArtCardProps {
  art: GeneratedArt;
  onDelete: (id: string) => void;
}

const ArtCard: React.FC<ArtCardProps> = ({ art, onDelete }) => {
  const downloadImage = () => {
    const link = document.createElement('a');
    link.href = art.url;
    link.download = `lumina-art-${art.id}.png`;
    link.click();
  };

  return (
    <div className="group relative glass-panel rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20">
      <div className="aspect-square bg-slate-800 relative">
        <img 
          src={art.url} 
          alt={art.prompt} 
          className="w-full h-full object-cover transition-opacity duration-300"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="text-sm line-clamp-2 mb-3 text-slate-200">{art.prompt}</p>
          <div className="flex items-center gap-2">
            <button 
              onClick={downloadImage}
              className="flex-1 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <i className="fas fa-download"></i> Save
            </button>
            <button 
              onClick={() => onDelete(art.id)}
              className="p-2 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded-lg transition-colors"
            >
              <i className="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>
      </div>
      <div className="p-3 flex justify-between items-center text-[10px] uppercase tracking-wider text-slate-500 font-bold">
        <span>{art.model.includes('pro') ? 'PRO' : 'FLASH'}</span>
        <span>{art.aspectRatio}</span>
        <span>{new Date(art.timestamp).toLocaleDateString()}</span>
      </div>
    </div>
  );
};

export default ArtCard;
