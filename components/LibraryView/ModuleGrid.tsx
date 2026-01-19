import React from 'react';
import { ModuleType } from '../../types';
import { translations } from '../../translations';
import { Copy, Trash2, Maximize, Clock, Share2, Terminal } from 'lucide-react';
import { ModuleGridProps } from './types';

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

export const ModuleGrid: React.FC<ModuleGridProps> = ({
  modules,
  lang,
  currentUser,
  onEdit,
  onDelete,
  onCopy,
  onViewImage,
  onVersionHistory,
  onShare,
}) => {
  const t = translations[lang];

  if (modules.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-300">
        <p className="font-bold tracking-widest uppercase text-[10px]">{t.library.noModulesFound}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {modules.map(module => {
        const typeStyle = getTypeStyles(module.type);

        return (
          <div
            key={module.id}
            className="group flex flex-col h-[440px] bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 relative"
            onClick={() => onEdit(module)}
          >
            {/* Image/Media Area */}
            <div className="relative h-[65%] shrink-0 overflow-hidden bg-slate-50">
              {module.imageUrl ? (
                <img
                  src={module.imageUrl}
                  alt={module.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full p-6 flex flex-col bg-slate-50 overflow-hidden relative">
                  <Terminal size={14} className="text-slate-300 mb-2" />
                  <div className="font-mono text-[10px] leading-relaxed text-slate-400 opacity-60">
                    {module.content}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent" />
                </div>
              )}

              {/* Type Badge */}
              <div className="absolute top-5 left-5 z-10">
                <span className={`text-[10px] font-bold px-4 py-1.5 rounded-xl shadow-sm ${typeStyle.badge}`}>
                  {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                </span>
              </div>

              {/* Quick Actions (Hover Only) */}
              <div className="absolute top-5 right-5 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                {currentUser && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onVersionHistory(module.id); }}
                    className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-yellow-600 hover:text-white transition-all"
                    title={t.library.versionHistory}
                  >
                    <Clock size={16} />
                  </button>
                )}
                {currentUser && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onShare(module); }}
                    className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                    title={t.library.share}
                  >
                    <Share2 size={16} />
                  </button>
                )}
                {module.imageUrl && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onViewImage(module.imageUrl!); }}
                    className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                    title="View Original Image"
                  >
                    <Maximize size={16} />
                  </button>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); onCopy(module.content); }}
                  className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(module.id); }}
                  className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-7 py-6 flex flex-col bg-white">
              <h3 className="text-xl font-bold text-[#0F172A] leading-[1.3] line-clamp-2 mb-4 group-hover:text-blue-600 transition-colors">
                {module.title}
              </h3>

              <div className="mt-auto flex flex-wrap gap-2">
                {module.tags.length > 0 ? (
                  module.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[11px] font-bold text-[#64748B] bg-[#F1F5F9] px-4 py-2 rounded-xl border border-transparent">
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] font-bold text-[#94A3B8] bg-[#F8FAFC] px-4 py-2 rounded-xl">Module</span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
