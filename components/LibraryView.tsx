import React, { useState, useEffect, useRef } from 'react';
import { PromptModule, ModuleType } from '../types';
import { 
  Plus, Trash2, Search, Copy, X, 
  LayoutList, LayoutGrid, Box,
  ChevronLeft, ChevronRight, AlertCircle,
  Settings, Terminal, Tag, Info, Link, Image as ImageIcon
} from 'lucide-react';
import { Language, translations } from '../translations';

interface LibraryViewProps {
  modules: PromptModule[];
  setModules: React.Dispatch<React.SetStateAction<PromptModule[]>>;
  lang: Language;
  syncStatus?: 'saved' | 'saving' | 'error';
}

const ITEMS_PER_PAGE = 12;

export const LibraryView: React.FC<LibraryViewProps> = ({ modules, setModules, lang, syncStatus = 'saved' }) => {
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const getTypeStyles = (type: ModuleType) => {
    switch (type) {
        case ModuleType.ROLE: return { badge: 'border-blue-100 text-blue-600 bg-blue-50' };
        case ModuleType.CONTEXT: return { badge: 'border-purple-100 text-purple-600 bg-purple-50' };
        case ModuleType.TASK: return { badge: 'border-emerald-100 text-emerald-600 bg-emerald-50' };
        case ModuleType.CONSTRAINT: return { badge: 'border-rose-100 text-rose-600 bg-rose-50' };
        case ModuleType.FORMAT: return { badge: 'border-orange-100 text-orange-600 bg-orange-50' };
        case ModuleType.TONE: return { badge: 'border-pink-100 text-pink-600 bg-pink-50' };
        default: return { badge: 'border-slate-100 text-slate-600 bg-slate-50' };
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

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredModules.length / ITEMS_PER_PAGE);
  const paginatedModules = filteredModules.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden md:rounded-tl-[2.5rem] shadow-sm relative border-l border-slate-200">
      
      {/* Search & Header Section */}
      <header className="px-10 py-8 bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-white shadow-xl">
               <Box size={28} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">{t.library.title}</h2>
              <p className="text-[10px] text-slate-400 font-bold mt-2 uppercase tracking-[0.2em]">{modules.length} {t.library.modulesAvailable}</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
             <div className="relative flex-1 lg:w-[360px] group">
                <input 
                  type="text" 
                  placeholder={t.library.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 pl-14 text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500/50 outline-none transition-all shadow-inner"
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
             </div>

             <button onClick={() => openModal()} className="h-[56px] bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-3 px-8 rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
               <Plus size={20} strokeWidth={3} /> 
               <span className="font-bold uppercase tracking-[0.1em] text-xs">{t.library.createBtn}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Filter Categories */}
      <nav className="px-10 py-4 border-b border-slate-100 bg-white flex items-center gap-3 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filterType === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-transparent border-slate-200 text-slate-400 hover:border-slate-400'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(v => (
           <button 
             key={v}
             onClick={() => setFilterType(v)}
             className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${filterType === v ? 'bg-slate-900 border-slate-900 text-white shadow-md' : 'bg-transparent border-slate-200 text-slate-400 hover:border-slate-400'}`}
           >
             {t.moduleType[v as keyof typeof t.moduleType] || v}
           </button>
        ))}
      </nav>

      {/* Grid Content */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar" ref={scrollContainerRef}>
        {paginatedModules.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <Box size={70} strokeWidth={1} className="mb-4 opacity-40" />
              <p className="font-bold tracking-widest uppercase text-[10px] opacity-60">{t.library.noModulesFound}</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {paginatedModules.map(module => {
              const typeStyle = getTypeStyles(module.type);
              
              return (
                <div key={module.id} className="group flex flex-col h-[460px] bg-white rounded-[2rem] overflow-hidden border border-slate-200 hover:border-blue-500/30 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-500 cursor-pointer relative" onClick={() => openModal(module)}>
                  
                  {/* Media Section (Referencing screenshot top part) */}
                  <div className="relative h-[62%] shrink-0 overflow-hidden bg-slate-100 border-b border-slate-50">
                    {module.imageUrl ? (
                      <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
                    ) : (
                      <div className="w-full h-full p-8 flex flex-col bg-[#F1F5F9]/50 overflow-hidden">
                        <div className="flex items-center gap-2 mb-4 text-slate-400">
                           <Terminal size={12} />
                           <span className="text-[8px] font-black uppercase tracking-widest">Protocol.Payload</span>
                        </div>
                        <div className="font-mono text-[10px] leading-relaxed text-slate-500 break-words whitespace-pre-wrap select-none opacity-80">
                           {module.content}
                        </div>
                        {/* Fade overlay */}
                        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#F1F5F9] to-transparent"></div>
                      </div>
                    )}
                    
                    {/* Hover Buttons */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-10">
                       <button onClick={(e) => { e.stopPropagation(); handleCopy(module.content); }} className="p-3 bg-white/90 backdrop-blur-md text-slate-700 rounded-xl hover:bg-blue-600 hover:text-white transition-all shadow-lg"><Copy size={16} /></button>
                       <button onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }} className="p-3 bg-white/90 backdrop-blur-md text-slate-700 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-lg"><Trash2 size={16} /></button>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-4 left-4 z-10">
                       <span className={`text-[8px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border ${typeStyle.badge} shadow-sm backdrop-blur-sm bg-opacity-90`}>
                          {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                       </span>
                    </div>
                  </div>
                  
                  {/* Info Section (Referencing screenshot bottom part) */}
                  <div className="flex-1 p-6 flex flex-col justify-between bg-white">
                     <div>
                        <h3 className="text-base font-bold text-slate-900 tracking-tight leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors" title={module.title}>
                          {module.title}
                        </h3>
                     </div>

                     {/* Tags List */}
                     <div className="flex flex-wrap gap-2 mt-4">
                        {module.tags.length > 0 ? (
                           module.tags.slice(0, 3).map(tag => (
                             <span key={tag} className="text-[9px] font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-50 tracking-wide">
                               {tag}
                             </span>
                           ))
                        ) : (
                           <span className="text-[9px] font-medium text-slate-300 italic">No Metadata</span>
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
         <footer className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">Sequence {currentPage} // {totalPages}</span>
            <div className="flex gap-4">
               <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-20 transition-all"><ChevronLeft size={18} /></button>
               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-20 transition-all"><ChevronRight size={18} /></button>
            </div>
         </footer>
      )}

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-[900px] bg-white shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 rounded-[2.5rem] overflow-hidden border border-slate-200">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
               <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Settings size={22} /></div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight uppercase">{editingModule ? 'Modify Module' : 'Register Protocol'}</h3>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 transition-all"><X size={28}/></button>
            </div>
            
            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto custom-scrollbar max-h-[70vh]">
               <div className="space-y-8">
                  {formError && <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold rounded-xl flex items-center gap-3"><AlertCircle size={14}/> {formError}</div>}
                  
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Title Name</label>
                     <input className="prod-input py-4 px-6 font-bold" value={title} onChange={e => setTitle(e.target.value)} placeholder="Senior Architect Role" />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Classification</label>
                      <select className="prod-input py-4 px-6 font-bold appearance-none bg-slate-50" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                        {Object.values(ModuleType).map(v => <option key={v} value={v}>{t.moduleType[v as keyof typeof t.moduleType] || v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Meta Tags</label>
                      <input className="prod-input py-4 px-6 font-bold" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, react" />
                    </div>
                  </div>

                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asset URL (Cover Image)</label>
                     <input className="prod-input py-4 px-6 font-mono text-xs" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://unsplash.com/..." />
                  </div>
               </div>

               <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Core Prompt Payload</label>
                  <div className="relative h-full">
                    <textarea 
                      className="w-full h-[280px] bg-slate-50 border border-slate-200 rounded-3xl p-6 text-slate-700 font-mono text-xs leading-relaxed outline-none focus:border-blue-500 resize-none transition-all" 
                      value={content} 
                      onChange={e => setContent(e.target.value)} 
                      placeholder="Define the actual logic here..."
                    />
                    <div className="absolute top-6 right-6 text-[8px] font-black text-slate-200 tracking-widest uppercase">System.Block</div>
                  </div>
               </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-4 rounded-xl font-bold uppercase text-[10px] text-slate-400 hover:text-slate-900 transition-all tracking-widest">Discard</button>
              <button onClick={handleSave} disabled={isSaving} className="px-14 py-4 bg-slate-900 rounded-xl text-white font-bold uppercase text-[10px] shadow-xl active:scale-95 transition-all tracking-widest">
                {isSaving ? 'Processing...' : 'Confirm Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};