
import React, { useState, useEffect, useRef } from 'react';
import { PromptModule, ModuleType } from '../types';
import { 
  Plus, Trash2, Search, Copy, X, 
  Box, ChevronLeft, ChevronRight, AlertCircle,
  Settings, Terminal, Tag, X as CloseIcon,
  ChevronsLeft, ChevronsRight, Maximize, ExternalLink,
  Image as ImageIcon
} from 'lucide-react';
import { Language, translations } from '../translations';

const ITEMS_PER_PAGE = 12;

export const LibraryView: React.FC<LibraryViewProps> = ({ modules, setModules, lang }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<PromptModule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const t = translations[lang];

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ModuleType>(ModuleType.ROLE);
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  // Filter & View State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ModuleType | 'ALL'>('ALL');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

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

  const openModal = (module?: PromptModule) => {
    setFormError(null);
    if (module) {
      setEditingModule(module);
      setTitle(module.title);
      setDescription(module.description || '');
      setContent(module.content);
      setType(module.type);
      setTags(module.tags.join(', '));
      setImageUrl(module.imageUrl || '');
    } else {
      setEditingModule(null);
      setTitle('');
      setDescription('');
      setContent('');
      setType(ModuleType.ROLE);
      setTags('');
      setImageUrl('');
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      setFormError(lang === 'zh' ? '标题和内容不能为空' : 'Title and content are required');
      return;
    }
    setIsSaving(true);
    const newModule: PromptModule = {
      id: editingModule ? editingModule.id : crypto.randomUUID(),
      title: title.trim(),
      description: description.trim(),
      content: content.trim(),
      type,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrl: imageUrl.trim(),
      createdAt: editingModule ? editingModule.createdAt : Date.now(),
    };
    setModules(prev => editingModule ? prev.map(m => m.id === editingModule.id ? newModule : m) : [newModule, ...prev]);
    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.library.deleteConfirm)) setModules(prev => prev.filter(m => m.id !== id));
  };

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredModules.length / ITEMS_PER_PAGE);
  const paginatedModules = filteredModules.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
            currentPage === i 
            ? 'bg-slate-900 text-white shadow-md scale-110' 
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden md:rounded-tl-[3rem] shadow-sm relative border-l border-slate-200">
      
      {/* Header */}
      <header className="px-10 py-8 bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
               <Box size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{t.library.title}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{modules.length} {t.library.modulesAvailable}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-[320px]">
                <input 
                  type="text" 
                  placeholder={t.library.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 pl-12 text-sm text-slate-900 outline-none focus:border-blue-500 transition-all"
                />
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
             </div>
             <button onClick={() => openModal()} className="h-[48px] bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-6 rounded-2xl shadow-lg shadow-blue-500/10 transition-all">
               <Plus size={18} strokeWidth={3} /> 
               <span className="font-bold text-sm">{t.library.createBtn}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Filters */}
      <nav className="px-10 py-4 bg-white border-b border-slate-100 flex items-center gap-3 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-5 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all border ${filterType === 'ALL' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-transparent border-slate-200 text-slate-500'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(v => (
           <button 
             key={v}
             onClick={() => setFilterType(v)}
             className={`px-5 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all border ${filterType === v ? 'bg-slate-900 border-slate-900 text-white' : 'bg-transparent border-slate-200 text-slate-500'}`}
           >
             {t.moduleType[v as keyof typeof t.moduleType] || v}
           </button>
        ))}
      </nav>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar" ref={scrollContainerRef}>
        {paginatedModules.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <p className="font-bold tracking-widest uppercase text-[10px]">{t.library.noModulesFound}</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {paginatedModules.map(module => {
              const typeStyle = getTypeStyles(module.type);
              
              return (
                <div key={module.id} className="group flex flex-col h-[440px] bg-white rounded-[2.5rem] overflow-hidden border border-slate-200 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 relative" onClick={() => openModal(module)}>
                  
                  {/* Image/Media Area */}
                  <div className="relative h-[65%] shrink-0 overflow-hidden bg-slate-50">
                    {module.imageUrl ? (
                      <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full p-6 flex flex-col bg-slate-50 overflow-hidden relative">
                        <Terminal size={14} className="text-slate-300 mb-2" />
                        <div className="font-mono text-[10px] leading-relaxed text-slate-400 opacity-60">
                           {module.content}
                        </div>
                        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
                      </div>
                    )}
                    
                    {/* Role Badge */}
                    <div className="absolute top-5 left-5 z-10">
                       <span className={`text-[10px] font-bold px-4 py-1.5 rounded-xl shadow-sm ${typeStyle.badge}`}>
                          {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                       </span>
                    </div>

                    {/* Quick Actions (Hover Only) */}
                    <div className="absolute top-5 right-5 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                       {module.imageUrl && (
                         <button onClick={(e) => { e.stopPropagation(); window.open(module.imageUrl, '_blank'); }} className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="View Original Image">
                           <Maximize size={16} />
                         </button>
                       )}
                       <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(module.content); }} className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Copy size={16} /></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }} className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-red-600 hover:text-white transition-all"><Trash2 size={16} /></button>
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
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
         <footer className="px-10 py-3 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
                {t.library.showing} {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredModules.length)} {t.library.of} {filteredModules.length}
              </span>
            </div>

            <div className="flex items-center gap-1">
               <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"><ChevronsLeft size={16} /></button>
               <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"><ChevronLeft size={18} /></button>
               <div className="flex items-center gap-1 mx-2">{renderPageNumbers()}</div>
               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"><ChevronRight size={18} /></button>
               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"><ChevronsRight size={16} /></button>
            </div>
         </footer>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative w-full max-w-[850px] bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
               <h3 className="text-xl font-bold text-slate-900">{editingModule ? 'EDIT PROTOCOL' : 'NEW PROTOCOL'}</h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><CloseIcon size={24}/></button>
            </div>
            
            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto">
               <div className="space-y-6">
                  {formError && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{formError}</div>}
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identification (Title)</label>
                     <input className="prod-input font-bold py-3 px-4" value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter Title..." />
                  </div>

                  {/* Improved Proportions for Type vs Tags */}
                  <div className="grid grid-cols-[3fr_2fr] gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Classification</label>
                      <select className="prod-input font-bold py-3 px-4 h-[46px]" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                        {Object.values(ModuleType).map(v => <option key={v} value={v}>{t.moduleType[v as keyof typeof t.moduleType] || v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Meta Tags</label>
                      <input className="prod-input font-bold py-3 px-4 h-[46px]" value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2" />
                    </div>
                  </div>

                  {/* Visual Asset with Inline Preview */}
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visual Asset (URL)</label>
                     <div className="flex gap-3 items-center">
                       {imageUrl ? (
                         <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0 shadow-inner">
                           <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                         </div>
                       ) : (
                         <div className="w-12 h-12 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-300 bg-slate-50 shrink-0">
                           <ImageIcon size={16} />
                         </div>
                       )}
                       <input className="prod-input font-mono text-xs py-3 px-4 flex-1" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://unsplash.com/photo-..." />
                     </div>
                  </div>
               </div>
               <div className="space-y-2 flex flex-col">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payload Content (Core Prompt)</label>
                  <textarea className="flex-1 min-h-[250px] bg-slate-50 border border-slate-200 rounded-3xl p-6 font-mono text-xs leading-relaxed outline-none focus:border-blue-500" value={content} onChange={e => setContent(e.target.value)} placeholder="Enter instructions here..." />
               </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-xl font-bold text-xs text-slate-400 hover:text-slate-900 uppercase tracking-widest">Discard</button>
              <button onClick={handleSave} disabled={isSaving} className="px-12 py-3 bg-slate-900 rounded-xl text-white font-bold text-xs uppercase shadow-xl tracking-widest transition-transform active:scale-95">
                {isSaving ? 'Saving...' : 'Confirm Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
