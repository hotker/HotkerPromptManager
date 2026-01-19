import React, { useEffect, useCallback } from 'react';
import { ModuleType } from '../../types';
import { translations } from '../../translations';
import {
  Box, ChevronLeft, ChevronRight, Maximize, Minimize, Terminal, Copy
} from 'lucide-react';
import { ImmersiveModeProps } from './types';

const getTypeStyles = (type: ModuleType) => {
  switch (type) {
    case ModuleType.ROLE: return { badge: 'bg-[#DEE9FF] text-[#4A84FF]' };
    case ModuleType.CONTEXT: return { badge: 'bg-[#F3E8FF] text-[#A855F7]' };
    case ModuleType.TASK: return { badge: 'bg-[#DCFCE7] text-[#16A34A]' };
    case ModuleType.CONSTRAINT: return { badge: 'bg-[#FFE4E6] text-[#E11D48]' };
    case ModuleType.FORMAT: return { badge: 'bg-[#FFEDD5] text-[#D97706]' };
    default: return { badge: 'bg-slate-100 text-slate-600' };
  }
};

export const ImmersiveMode: React.FC<ImmersiveModeProps> = ({
  modules,
  currentIndex,
  lang,
  onNext,
  onPrev,
  onExit,
  onViewImage,
  onCopy,
}) => {
  const t = translations[lang];
  const currentModule = modules[currentIndex];

  // 键盘导航
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrev();
    if (e.key === 'Escape') onExit();
  }, [onNext, onPrev, onExit]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!currentModule) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#020617] text-white flex flex-col animate-in fade-in duration-300">
      {/* Top Bar */}
      <div className="shrink-0 h-20 px-8 flex items-center justify-between z-20">
        <div className="flex items-center gap-3 opacity-60">
          <Box size={20} />
          <span className="text-xs font-bold tracking-[0.2em] uppercase">{t.library.immersiveMode}</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-xs font-mono opacity-40">{currentIndex + 1} / {modules.length}</span>
          <button onClick={onExit} className="p-2 hover:bg-white/10 rounded-full transition-all">
            <Minimize size={24} className="opacity-60 hover:opacity-100" />
          </button>
        </div>
      </div>

      {/* Main Stage */}
      <div className="flex-1 overflow-hidden relative flex items-center justify-center">
        {/* Navigation Left */}
        <button
          onClick={onPrev}
          className="absolute left-8 z-10 p-4 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white/40 hover:text-white/90 transition-all group"
        >
          <ChevronLeft size={40} className="group-active:-translate-x-1 transition-transform" />
        </button>

        {/* Navigation Right */}
        <button
          onClick={onNext}
          className="absolute right-8 z-10 p-4 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white/40 hover:text-white/90 transition-all group"
        >
          <ChevronRight size={40} className="group-active:translate-x-1 transition-transform" />
        </button>

        {/* Content Card */}
        <div className="w-[85%] max-w-[1200px] h-[80%] bg-[#0f172a] rounded-[3rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/5 flex flex-col lg:flex-row relative">
          {/* Visual Side */}
          {currentModule.imageUrl ? (
            <div className="lg:w-1/2 h-[40%] lg:h-full relative bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 group">
              <img
                src={currentModule.imageUrl}
                alt="Visual"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-linear hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0f172a]/80" />
              <button
                onClick={() => onViewImage(currentModule.imageUrl!)}
                className="absolute bottom-6 left-6 p-3 bg-black/40 backdrop-blur-md rounded-xl text-white/70 hover:text-white hover:bg-black/60 transition-all opacity-0 group-hover:opacity-100"
              >
                <Maximize size={20} />
              </button>
            </div>
          ) : (
            <div className="lg:w-1/3 h-[20%] lg:h-full bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-b lg:border-b-0 lg:border-r border-white/5 flex items-center justify-center p-12">
              <Terminal size={64} className="text-white/10" />
            </div>
          )}

          {/* Text Side */}
          <div className="flex-1 p-10 lg:p-14 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-bold px-3 py-1 rounded-lg ${getTypeStyles(currentModule.type).badge}`}>
                  {t.moduleType[currentModule.type as keyof typeof t.moduleType] || currentModule.type}
                </span>
                {currentModule.tags.map(tag => (
                  <span key={tag} className="text-[10px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                    {tag}
                  </span>
                ))}
              </div>

              <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                {currentModule.title}
              </h2>

              {currentModule.description && (
                <p className="text-white/50 text-base leading-relaxed">
                  {currentModule.description}
                </p>
              )}

              <div className="h-px bg-white/5 w-full my-6" />

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase text-blue-400/80 mb-2">
                  <span>{t.library.labelContent}</span>
                  <button
                    onClick={() => onCopy(currentModule.content)}
                    className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                  >
                    <Copy size={12} /> {t.builder.copy}
                  </button>
                </div>
                <div className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap bg-black/20 p-6 rounded-2xl border border-white/5 selection:bg-blue-500/30">
                  {currentModule.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Hints */}
      <div className="h-16 flex items-center justify-center gap-8 text-[10px] font-bold text-white/20 tracking-widest uppercase">
        <span className="flex items-center gap-2"><kbd className="px-2 py-1 bg-white/10 rounded">←</kbd> {t.library.prev}</span>
        <span className="flex items-center gap-2"><kbd className="px-2 py-1 bg-white/10 rounded">ESC</kbd> {t.library.exitImmersive}</span>
        <span className="flex items-center gap-2"><kbd className="px-2 py-1 bg-white/10 rounded">→</kbd> {t.library.next}</span>
      </div>
    </div>
  );
};
