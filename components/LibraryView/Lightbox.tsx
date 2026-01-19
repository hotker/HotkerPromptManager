import React from 'react';
import { X } from 'lucide-react';

interface LightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-6 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
        onClick={onClose}
      >
        <X size={24} />
      </button>
      <img
        src={imageUrl}
        alt="Original"
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};
