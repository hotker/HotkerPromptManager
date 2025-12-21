import React, { useState, useEffect, useRef } from 'react';
import { PromptModule, ModuleType } from '../types';
import { 
  Plus, Trash2, Search, Copy, X, 
  LayoutList, LayoutGrid, Image as ImageIcon, Link, 
  User, FileText, CheckSquare, Shield, Layout, MessageSquare, Box,
  ChevronLeft, ChevronRight, Maximize2, AlertCircle, RefreshCw,
  Eye, Settings, Code, Tag, Info, Hash, Terminal
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
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
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

  const getModuleIcon = (type: ModuleType) => {
    switch (type) {
      case ModuleType.ROLE: return <User />;
      case ModuleType.CONTEXT: return <FileText />;
      case ModuleType.TASK: return <CheckSquare />;
      case ModuleType.CONSTRAINT: return <Shield />;
      case ModuleType.FORMAT: return <Layout />;
      case ModuleType.TONE: return <MessageSquare />;
      default: return <Box />;
    }
  };

  const getTypeStyles = (type: ModuleType) => {
    switch (type) {
        case ModuleType.ROLE: return { primary: 'blue', border: 'border-blue-100', badge: 'bg-blue-50 text-blue-700 border-blue-200', ghost: 'bg-blue-50/30' };
        case ModuleType.CONTEXT: return { primary: 'purple', border: 'border-purple-100', badge: 'bg-purple-50 text-purple-700 border-purple-200', ghost: 'bg-purple-50/30' };
        case ModuleType.TASK: return { primary: 'emerald', border: 'border-emerald-100', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200', ghost: 'bg-emerald-50/30' };
        case ModuleType.CONSTRAINT: return { primary: 'rose', border: 'border-rose-100', badge: 'bg-rose-50 text-rose-700 border-rose-200', ghost: 'bg-rose-50/30' };
        case ModuleType.FORMAT: return { primary: 'orange', border: 'border-orange-100', badge: 'bg-orange-50 text-orange-700 border-orange-200', ghost: 'bg-orange-50/30' };
        case ModuleType.TONE: return { primary: 'pink', border: 'border-pink-100', badge: 'bg-pink-50 text-pink-700 border-pink-200', ghost: 'bg-pink-50/30' };
        default: return { primary: 'slate', border: 'border-slate-100', badge: 'bg-slate-50 text-slate-700 border-slate-200', ghost: 'bg-slate-50/30' };
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
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedModules = filteredModules.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden md:rounded-tl-[3rem] md:border-l md:border-t md:border-slate-200 shadow-inner">
      
      {/* Dynamic Header Panel */}
      <header className="px-12 py-10 bg-white border-b border-slate-200/60 shrink-0 z-10">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-slate-900 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-slate-900/20 rotate-3 hover:rotate-0 transition-transform duration-500">
               <Box size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t.library.title}</h2>
              <div className="flex items-center gap-3 mt-3">
                 <div className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-widest">{modules.length} {t.library.modulesAvailable}</div>
                 <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                 <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Active System v4.1</div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
             <div className="relative flex-1 xl:w-[450px] group">
                <input 
                  type="text" 
                  placeholder={t.library.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-100 border-2 border-transparent rounded-2xl px-8 py-4.5 pl-16 text-sm font-bold focus:bg-white focus:border-blue-500/20 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-inner"
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={22} />
             </div>

             <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 shadow-inner">
               <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList size={22}/></button>
               <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={22}/></button>
             </div>

             <button onClick={() => openModal()} className="h-[60px] bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-4 px-10 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-95 transition-all group">
               <Plus size={22} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" /> 
               <span className="font-black uppercase tracking-[0.2em] text-xs">{t.library.createBtn}</span>
             </button>
          </div>
        </div>
      </header>

      {/* Filter Segmented Control */}
      <nav className="px-12 py-6 border-b border-slate-100 bg-white/50 backdrop-blur-md flex items-center gap-3 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border-2 ${filterType === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(type_val => (
           <button 
             key={type_val}
             onClick={() => setFilterType(type_val)}
             className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border-2 ${filterType === type_val ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
           >
             {t.moduleType[type_val as keyof typeof t.moduleType] || type_val}
           </button>
        ))}
      </nav>

      {/* Main Content Grid */}
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar" ref={scrollContainerRef}>
        {paginatedModules.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-300/60 py-20">
              <div className="w-32 h-32 rounded-[3rem] bg-slate-100 flex items-center justify-center mb-8"><Box size={60} strokeWidth={0.5} /></div>
              <p className="font-black tracking-[0.6em] uppercase text-[11px] text-slate-400">{t.library.noModulesFound}</p>
           </div>
        ) : viewMode === 'list' ? (
          <div className="max-w-6xl mx-auto space-y-4">
             {paginatedModules.map((module) => (
               <div key={module.id} className="group flex items-center p-6 bg-white border border-slate-200/80 rounded-[2rem] hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer gap-8" onClick={() => openModal(module)}>
                 <div className="shrink-0 w-24 h-24 rounded-[1.5rem] overflow-hidden bg-slate-50 border border-slate-100">
                    {module.imageUrl ? (
                       <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                       <div className={`w-full h-full flex items-center justify-center ${getTypeStyles(module.type).ghost}`}>
                          {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 32, className: 'opacity-20' })}
                       </div>
                    )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-black text-slate-900 truncate tracking-tight uppercase group-hover:text-blue-600 transition-colors">{module.title}</h3>
                      <span className={`text-[8px] px-3 py-1.5 rounded-lg font-black uppercase tracking-widest ${getTypeStyles(module.type).badge}`}>
                        {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono line-clamp-1 opacity-60 leading-relaxed pr-10">{module.content}</p>
                 </div>
                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => { e.stopPropagation(); handleCopy(module.content); }} className="p-4 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"><Copy size={20}/></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }} className="p-4 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"><Trash2 size={20}/></button>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
            {paginatedModules.map(module => {
              const typeStyle = getTypeStyles(module.type);
              
              return (
                <div key={module.id} className="group relative flex flex-col h-[520px] bg-white border border-slate-200/60 rounded-[3rem] overflow-hidden hover:border-blue-500/40 hover:shadow-[0_40px_80px_-20px_rgba(59,130,246,0.15)] transition-all duration-500 cursor-pointer" onClick={() => openModal(module)}>
                  
                  {/* Card Media Section */}
                  <div className={`relative h-[55%] shrink-0 overflow-hidden ${!module.imageUrl ? typeStyle.ghost : 'bg-slate-100'}`}>
                    {module.imageUrl ? (
                      <>
                        <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-105" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      </>
                    ) : (
                       <div className="w-full h-full flex items-center justify-center relative overflow-hidden">
                         <div className="absolute inset-0 opacity-[0.03] scale-150 rotate-12">{React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 300 })}</div>
                         <div className="w-20 h-20 rounded-[2rem] bg-white shadow-xl flex items-center justify-center text-slate-300 scale-90 group-hover:scale-100 transition-transform duration-500">
                            {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 40, strokeWidth: 1.5 })}
                         </div>
                       </div>
                    )}
                    
                    {/* Floating Actions Overlay */}
                    <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-20 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 ease-out z-20">
                        <button onClick={(e) => { e.stopPropagation(); handleCopy(module.content); }} className="p-4 rounded-2xl bg-white shadow-2xl text-slate-900 hover:text-blue-600 hover:scale-110 active:scale-90 transition-all"><Copy size={20} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }} className="p-4 rounded-2xl bg-white shadow-2xl text-slate-900 hover:text-red-600 hover:scale-110 active:scale-90 transition-all"><Trash2 size={20} /></button>
                    </div>

                    <div className="absolute top-6 left-6 z-10">
                       <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border shadow-sm ${typeStyle.badge}`}>
                          {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                       </span>
                    </div>
                  </div>
                  
                  {/* Card Information Section */}
                  <div className="flex-1 p-8 flex flex-col bg-white relative">
                     <div className="mb-4">
                        <h3 className="font-black text-slate-900 text-2xl tracking-tighter truncate uppercase leading-tight group-hover:text-blue-600 transition-colors" title={module.title}>
                          {module.title}
                        </h3>
                        {module.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                             {module.tags.slice(0, 2).map(tag => (
                               <span key={tag} className="text-[8px] font-black text-slate-400/60 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">#{tag}</span>
                             ))}
                          </div>
                        )}
                     </div>

                     {/* Content Display (Payload Window) */}
                     <div className={`flex-1 p-5 rounded-[1.5rem] ${module.imageUrl ? 'bg-slate-50 border border-slate-100' : 'bg-[#0F172A] border border-slate-800 shadow-inner'} overflow-hidden relative group-hover:ring-4 group-hover:ring-blue-500/5 transition-all duration-500`}>
                        <div className={`font-mono text-[10px] leading-[1.6] line-clamp-6 ${module.imageUrl ? 'text-slate-500' : 'text-emerald-400/90'} whitespace-pre-wrap`}>
                          {module.content}
                        </div>
                        <div className={`absolute bottom-3 right-4 flex items-center gap-2 ${module.imageUrl ? 'text-slate-300' : 'text-slate-700'} text-[7px] font-black uppercase tracking-widest`}>
                           <Terminal size={10} /> Kernel.Payload
                        </div>
                     </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modern Pagination Footer */}
      {totalPages > 1 && (
         <footer className="px-12 py-8 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">Sequence {currentPage} // {totalPages}</span>
            <div className="flex gap-4">
               <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-600 hover:border-slate-300 disabled:opacity-20 transition-all shadow-sm"><ChevronLeft size={22} /></button>
               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="px-6 py-4 rounded-2xl border-2 border-slate-100 text-slate-600 hover:border-slate-300 disabled:opacity-20 transition-all shadow-sm"><ChevronRight size={22} /></button>
            </div>
         </footer>
      )}

      {/* Image Preview Lightbox */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-12 animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => setPreviewImageUrl(null)}></div>
           <button onClick={() => setPreviewImageUrl(null)} className="absolute top-10 right-10 p-5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10"><X size={36} /></button>
           <img src={previewImageUrl} alt="Preview" className="relative max-w-full max-h-[85vh] object-contain rounded-[4rem] shadow-2xl animate-in zoom-in-95 duration-700 ease-out border border-white/10" />
        </div>
      )}

      {/* Advanced Module Refactor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-3xl transition-opacity duration-700" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-[1200px] h-full max-h-[850px] bg-slate-50 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.6)] flex flex-col animate-in zoom-in-95 duration-500 rounded-[4rem] overflow-hidden border border-white/10">
            
            {/* Modal Header */}
            <div className="px-12 py-10 bg-white border-b border-slate-200/60 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-500/30">
                    <Settings size={32} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-4xl tracking-tighter uppercase leading-none">
                      {editingModule ? 'Module Refactor' : 'Initial Registry'}
                    </h3>
                    <p className="text-[10px] text-blue-600 font-black opacity-80 mt-2 uppercase tracking-[0.4em]">Hardware Layer v5.0.1</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-4 hover:bg-slate-100 rounded-full transition-all active:scale-90"><X size={36}/></button>
            </div>
            
            {/* Modal Body */}
            <div className="flex-1 flex overflow-hidden">
               {/* Inputs Column */}
               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white">
                  <div className="space-y-12 max-w-3xl">
                     {formError && (
                        <div className="p-8 bg-red-50 border-2 border-red-100 rounded-3xl text-red-600 text-xs font-black flex items-center gap-6 animate-shake">
                          <AlertCircle size={26} /> {formError}
                        </div>
                     )}

                     <div className="space-y-8">
                        <div className="flex items-center gap-4 text-slate-400 mb-2">
                           <Info size={18} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Identity Configuration</span>
                        </div>
                        <input 
                           className={`w-full text-3xl font-black tracking-tighter rounded-[2rem] py-8 px-10 bg-slate-50 border-2 transition-all outline-none focus:ring-8 focus:ring-blue-500/5 ${!title && formError ? 'border-red-300' : 'border-slate-100 focus:border-blue-500 focus:bg-white'}`} 
                           value={title} 
                           onChange={e => setTitle(e.target.value)} 
                           placeholder="Module_Identification_Title" 
                        />
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-4">Classification</label>
                              <select className="w-full font-black rounded-2xl py-6 px-8 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-inner uppercase text-[11px] tracking-widest" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                                {Object.values(ModuleType).map(v => <option key={v} value={v}>{t.moduleType[v as keyof typeof t.moduleType] || v}</option>)}
                              </select>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-4">Metatags</label>
                              <div className="relative group">
                                 <Tag size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                 <input className="w-full font-bold rounded-2xl py-6 pl-14 pr-8 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all shadow-inner" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, react, version1" />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="flex items-center gap-4 text-slate-400 mb-2">
                           <ImageIcon size={18} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Asset Reference</span>
                        </div>
                        <div className="relative group">
                           <Link size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                           <input 
                              className="w-full font-mono text-xs rounded-2xl py-6 pl-14 pr-8 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all shadow-inner" 
                              value={imageUrl} 
                              onChange={e => setImageUrl(e.target.value)} 
                              placeholder="https://content.hotker.ai/assets/image_01.png" 
                           />
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="flex items-center gap-4 text-slate-400 mb-2">
                           <Code size={18} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Instruction Payload</span>
                        </div>
                        <div className="relative bg-[#0d0d10] rounded-[3rem] p-10 shadow-2xl border border-white/5 focus-within:ring-8 focus-within:ring-blue-500/10 transition-all">
                           <textarea 
                              className="w-full min-h-[400px] bg-transparent text-emerald-400/90 font-mono text-sm leading-[1.8] outline-none resize-none custom-scrollbar" 
                              value={content} 
                              onChange={e => setContent(e.target.value)} 
                              placeholder="// Input the core prompt instruction logic..."
                           />
                           <div className="absolute top-8 right-10 text-[9px] font-black text-white/10 tracking-[0.5em] uppercase">SYSTEM.MEMORY_BLOCK</div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Live Preview Column */}
               <div className="hidden lg:flex w-[480px] bg-slate-100/50 border-l border-slate-200 flex-col items-center justify-center p-14 gap-12">
                  <div className="flex flex-col items-center gap-4 text-slate-400">
                    <Eye size={20} className="text-blue-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.5em]">Simulation Rendering</span>
                  </div>
                  
                  {/* The actual Card Preview */}
                  <div className="w-full h-[520px] bg-white border border-slate-200/80 rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-500/10 pointer-events-none scale-95">
                    <div className={`relative h-[55%] shrink-0 overflow-hidden ${!imageUrl ? getTypeStyles(type).ghost : 'bg-slate-100'}`}>
                      {imageUrl && <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />}
                      {!imageUrl && <div className="w-full h-full flex items-center justify-center text-slate-200 scale-150">{React.cloneElement(getModuleIcon(type) as React.ReactElement<any>, { size: 100 })}</div>}
                      <div className="absolute top-6 left-6 z-10">
                        <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border shadow-sm ${getTypeStyles(type).badge} bg-white/90`}>
                           {t.moduleType[type as keyof typeof t.moduleType] || type}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 p-8 flex flex-col bg-white">
                       <h3 className="font-black text-slate-900 text-2xl tracking-tighter truncate uppercase mb-4">{title || 'PROTOCOL_NULL'}</h3>
                       <div className={`flex-1 p-5 rounded-[1.5rem] ${imageUrl ? 'bg-slate-50 border border-slate-100' : 'bg-[#0F172A] border border-slate-800'} overflow-hidden relative`}>
                          <div className={`font-mono text-[10px] leading-[1.6] line-clamp-6 ${imageUrl ? 'text-slate-500' : 'text-emerald-400/90'}`}>{content || 'Payload_empty_waiting_for_input...'}</div>
                       </div>
                    </div>
                  </div>

                  <p className="text-[10px] text-center text-slate-400 leading-relaxed max-w-[300px] font-black uppercase tracking-[0.1em] opacity-40 italic">
                    Note: This is a digital twin representing the architecture in your global material grid.
                  </p>
               </div>
            </div>

            {/* Modal Footer */}
            <div className="px-12 py-12 bg-white border-t border-slate-100 flex justify-end gap-6 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">Abort_Process</button>
              <button onClick={handleSave} disabled={isSaving} className="px-20 py-6 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[11px] min-w-[280px] shadow-2xl shadow-slate-900/30 active:scale-95 transition-all">
                {isSaving ? 'Synchronizing...' : 'Commit_Protocol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};