import React, { useState, useEffect, useRef } from 'react';
import { PromptModule, ModuleType } from '../types';
import { MODULE_COLORS } from '../constants';
import { 
  Plus, Trash2, Edit2, Search, Copy, Check, Filter, X, 
  LayoutList, LayoutGrid, Image as ImageIcon, Link, 
  User, FileText, CheckSquare, Shield, Layout, MessageSquare, Box, ExternalLink,
  ChevronLeft, ChevronRight, Maximize2, AlertCircle, Cloud, CloudOff, RefreshCw,
  Eye, Settings, Code, Tag, Info
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
  const [copiedId, setCopiedId] = useState<string | null>(null);
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
        case ModuleType.ROLE: return { bg: 'bg-gradient-to-br from-blue-400/20 to-indigo-500/10', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 border-blue-200' };
        case ModuleType.CONTEXT: return { bg: 'bg-gradient-to-br from-purple-400/20 to-fuchsia-500/10', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700 border-purple-200' };
        case ModuleType.TASK: return { bg: 'bg-gradient-to-br from-emerald-400/20 to-teal-500/10', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        case ModuleType.CONSTRAINT: return { bg: 'bg-gradient-to-br from-rose-400/20 to-pink-500/10', icon: 'text-rose-600', badge: 'bg-rose-100 text-rose-700 border-rose-200' };
        case ModuleType.FORMAT: return { bg: 'bg-gradient-to-br from-orange-400/20 to-amber-500/10', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700 border-orange-200' };
        case ModuleType.TONE: return { bg: 'bg-gradient-to-br from-pink-400/20 to-rose-500/10', icon: 'text-pink-600', badge: 'bg-pink-100 text-pink-700 border-pink-200' };
        default: return { bg: 'bg-gradient-to-br from-slate-200 to-slate-50', icon: 'text-slate-600', badge: 'bg-slate-200 text-slate-700 border-slate-300' };
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

    setModules(prev => {
      if (editingModule) return prev.map(m => m.id === editingModule.id ? newModule : m);
      return [newModule, ...prev];
    });

    if (!editingModule) {
      setSearchTerm('');
      setFilterType('ALL');
      setCurrentPage(1);
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.library.deleteConfirm)) {
      setModules(prev => prev.filter(m => m.id !== id));
    }
  };

  const handleCopy = (content: string, id: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const totalPages = Math.ceil(filteredModules.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedModules = filteredModules.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Helper for live preview styling
  const currentTypeStyle = getTypeStyles(type);

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden md:rounded-tl-3xl md:border-l md:border-t md:border-slate-200">
      
      {/* Top Toolbar */}
      <div className="px-8 py-6 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-5">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">{t.library.title}</h2>
            <p className="text-[10px] text-slate-400 mt-1 font-black uppercase tracking-[0.2em]">{modules.length} {t.library.modulesAvailable}</p>
          </div>
          <div className="hidden lg:flex items-center gap-2 pl-6 border-l border-slate-100">
            {syncStatus === 'saving' && <div className="flex items-center gap-1.5 text-[10px] font-black text-blue-500 animate-pulse uppercase tracking-widest"><RefreshCw size={12} className="animate-spin" /> Syncing</div>}
            {syncStatus === 'saved' && <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 opacity-60 uppercase tracking-widest"><Cloud size={12} /> Live</div>}
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-96 group">
              <input 
                type="text" 
                placeholder={t.library.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-2xl px-5 py-4 pl-12 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
           </div>

           <div className="flex items-center bg-slate-100 rounded-2xl p-1 gap-1">
             <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList size={20}/></button>
             <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20}/></button>
           </div>

           <button onClick={() => openModal()} className="btn-primary py-4 px-8 rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">
             <Plus size={20} strokeWidth={3} /> <span className="hidden sm:inline font-black uppercase tracking-widest text-xs">{t.library.createBtn}</span>
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-8 py-4 border-b border-slate-100 bg-white flex items-center gap-4 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 ${filterType === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(type_val => (
           <button 
             key={type_val}
             onClick={() => setFilterType(type_val)}
             className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap border-2 ${filterType === type_val ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
           >
             {t.moduleType[type_val as keyof typeof t.moduleType] || type_val}
           </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar" ref={scrollContainerRef}>
        {paginatedModules.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-50">
              <Box size={80} strokeWidth={0.5} className="mb-6" />
              <p className="font-black tracking-[0.3em] uppercase text-xs">{t.library.noModulesFound}</p>
           </div>
        ) : viewMode === 'list' ? (
          <div className="max-w-5xl mx-auto space-y-4">
             {paginatedModules.map((module) => (
               <div key={module.id} className="group flex items-center p-6 bg-white border border-slate-200 rounded-3xl hover:border-blue-400 hover:shadow-2xl transition-all cursor-pointer gap-8" onClick={() => openModal(module)}>
                 <div className="shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 border-slate-50 bg-slate-50 shadow-sm">
                    {module.imageUrl ? (
                       <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" />
                    ) : (
                       <div className={`w-full h-full flex items-center justify-center ${getTypeStyles(module.type).bg}`}>
                          {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 36, className: 'opacity-40' })}
                       </div>
                    )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-xl font-black text-slate-900 truncate tracking-tight">{module.title}</h3>
                      <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${getTypeStyles(module.type).badge}`}>
                        {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono line-clamp-1 opacity-50">{module.content}</p>
                 </div>
                 <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }} className="p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-blue-400 hover:text-blue-600 transition-all shadow-sm"><Copy size={20}/></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }} className="p-4 rounded-2xl border-2 border-slate-100 bg-white hover:border-red-400 hover:text-red-600 transition-all shadow-sm"><Trash2 size={20}/></button>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
            {paginatedModules.map(module => {
              const typeStyle = getTypeStyles(module.type);
              return (
              <div key={module.id} className="group flex flex-col h-[460px] bg-white border border-slate-100 rounded-[3rem] overflow-hidden hover:border-blue-500/40 hover:shadow-[0_40px_80px_-20px_rgba(59,130,246,0.15)] transition-all duration-700 cursor-pointer" onClick={() => openModal(module)}>
                 <div className={`relative h-[78%] shrink-0 overflow-hidden ${!module.imageUrl ? typeStyle.bg : 'bg-slate-100'}`}>
                    {module.imageUrl ? (
                       <>
                         <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover transition-transform duration-[2s] group-hover:scale-110" />
                         <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/40 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 backdrop-blur-[2px]">
                            <button onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(module.imageUrl || null); }} className="p-5 bg-white/95 backdrop-blur rounded-full text-slate-950 hover:scale-125 active:scale-90 shadow-2xl transition-all duration-300"><Maximize2 size={32} strokeWidth={3} /></button>
                         </div>
                       </>
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                          <div className="w-28 h-28 rounded-[2.5rem] bg-white/90 backdrop-blur-2xl shadow-2xl flex items-center justify-center text-slate-400 group-hover:rotate-12 transition-all duration-700 ease-out">
                             {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 56, className: typeStyle.icon, strokeWidth: 1 })}
                          </div>
                       </div>
                    )}
                    <div className="absolute top-8 right-8 flex flex-col gap-4 translate-x-16 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-75 z-20">
                        <button onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }} className="p-4 rounded-2xl bg-white shadow-2xl text-slate-700 hover:text-blue-600 transition-all"><Copy size={22} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }} className="p-4 rounded-2xl bg-white shadow-2xl text-slate-700 hover:text-red-600 transition-all"><Trash2 size={22} /></button>
                    </div>
                 </div>
                 <div className="flex-1 p-8 flex flex-col justify-center bg-white">
                    <div className="flex items-center justify-between gap-4">
                       <h3 className="font-black text-slate-900 text-2xl tracking-tighter truncate uppercase group-hover:text-blue-600 transition-colors" title={module.title}>{module.title}</h3>
                       <span className={`text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-[0.2em] border-2 shrink-0 ${typeStyle.badge}`}>{t.moduleType[module.type as keyof typeof t.moduleType] || module.type}</span>
                    </div>
                 </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
         <div className="px-10 py-6 bg-white border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-4">
               <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-4 rounded-2xl border-2 border-slate-100 text-slate-600 hover:border-slate-300 disabled:opacity-20 transition-all"><ChevronLeft size={24} /></button>
               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-4 rounded-2xl border-2 border-slate-100 text-slate-600 hover:border-slate-300 disabled:opacity-20 transition-all"><ChevronRight size={24} /></button>
            </div>
         </div>
      )}

      {/* Full Resolution Lightbox */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-12 animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-slate-950/98 backdrop-blur-3xl" onClick={() => setPreviewImageUrl(null)}></div>
           <button onClick={() => setPreviewImageUrl(null)} className="absolute top-10 right-10 p-5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10"><X size={36} /></button>
           <img src={previewImageUrl} alt="Preview" className="relative max-w-full max-h-[85vh] object-contain rounded-[4rem] shadow-2xl animate-in zoom-in-95 duration-700 ease-out border border-white/10" />
        </div>
      )}

      {/* Advanced Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xl transition-opacity duration-700" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-[1200px] h-full max-h-[850px] bg-slate-50 shadow-[0_100px_150px_-50px_rgba(0,0,0,0.5)] flex flex-col animate-in zoom-in-95 duration-500 rounded-[3rem] overflow-hidden border border-white/20">
            
            {/* Header */}
            <div className="px-12 py-8 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/40">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-3xl tracking-tighter uppercase leading-none">
                      {editingModule ? 'Module Refactoring' : 'Protocol Initialization'}
                    </h3>
                    <p className="text-[10px] text-blue-600 font-black opacity-80 mt-1 uppercase tracking-[0.3em]">Hardware Abstraction Layer v2.1</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-3 hover:bg-slate-100 rounded-full transition-all active:scale-90"><X size={32}/></button>
            </div>
            
            {/* Split View Content */}
            <div className="flex-1 flex overflow-hidden">
               
               {/* Left: Input Controls */}
               <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-white">
                  <div className="space-y-10 max-w-2xl">
                     
                     {formError && (
                        <div className="p-6 bg-red-50 border-2 border-red-100 rounded-3xl text-red-600 text-xs font-black flex items-center gap-4 animate-shake">
                          <AlertCircle size={20} /> {formError}
                        </div>
                     )}

                     {/* Section: Identity */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 text-slate-400 mb-2">
                           <Info size={14} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Primary Identification</span>
                        </div>
                        <input 
                           className={`w-full text-2xl font-black tracking-tighter rounded-3xl py-6 px-8 bg-slate-50 border-2 transition-all outline-none focus:ring-4 focus:ring-blue-500/10 ${!title && formError ? 'border-red-300' : 'border-slate-100 focus:border-blue-500 focus:bg-white'}`} 
                           value={title} 
                           onChange={e => setTitle(e.target.value)} 
                           placeholder="Enter Identification Title..." 
                        />
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Classification</label>
                              <select className="w-full font-bold rounded-2xl py-4 px-6 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all cursor-pointer" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                                {Object.values(ModuleType).map(v => <option key={v} value={v}>{t.moduleType[v as keyof typeof t.moduleType] || v}</option>)}
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Tags</label>
                              <div className="relative group">
                                 <Tag size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                                 <input className="w-full font-bold rounded-2xl py-4 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, react, v1..." />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* Section: Visuals */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 text-slate-400 mb-2">
                           <ImageIcon size={14} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Visual Representation</span>
                        </div>
                        <div className="relative group">
                           <Link size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" />
                           <input 
                              className="w-full font-mono text-xs rounded-2xl py-4 pl-12 pr-6 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" 
                              value={imageUrl} 
                              onChange={e => setImageUrl(e.target.value)} 
                              placeholder="Direct Image CDN Link (https://...)" 
                           />
                        </div>
                     </div>

                     {/* Section: Instruction Payload */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 text-slate-400 mb-2">
                           <Code size={14} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Instruction Payload</span>
                        </div>
                        <div className="relative bg-[#1e1e2e] rounded-[2.5rem] p-8 shadow-2xl border border-white/10 group focus-within:ring-4 focus-within:ring-blue-500/20 transition-all">
                           <textarea 
                              className="w-full min-h-[350px] bg-transparent text-[#cdd6f4] font-mono text-sm leading-relaxed outline-none resize-none custom-scrollbar" 
                              value={content} 
                              onChange={e => setContent(e.target.value)} 
                              placeholder="Inject core prompt logic here..."
                           />
                           <div className="absolute top-6 right-8 text-[9px] font-black text-white/20 tracking-widest uppercase">Kernel Mode</div>
                        </div>
                     </div>

                     {/* Section: Internal Notes */}
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-2">Internal Operational Context</label>
                        <input className="w-full font-medium rounded-2xl py-4 px-6 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all" value={description} onChange={e => setDescription(e.target.value)} placeholder="Hidden metadata for indexing..." />
                     </div>
                  </div>
               </div>

               {/* Right: Live Preview Rendering */}
               <div className="hidden lg:flex w-[450px] bg-slate-100/50 border-l border-slate-200 flex-col items-center justify-center p-12">
                  <div className="w-full flex flex-col items-center gap-8 animate-in fade-in slide-in-from-right-10 duration-700">
                     <div className="flex items-center gap-3 text-slate-400 mb-2">
                        <Eye size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Live Simulation Rendering</span>
                     </div>
                     
                     {/* The Card Preview */}
                     <div className="w-full h-[460px] bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-500/10 pointer-events-none">
                        <div className={`relative h-[78%] shrink-0 overflow-hidden ${!imageUrl ? currentTypeStyle.bg : 'bg-slate-100'}`}>
                           {imageUrl ? (
                              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                           ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                                 <div className="w-28 h-28 rounded-[2.5rem] bg-white shadow-xl flex items-center justify-center text-slate-400">
                                    {React.cloneElement(getModuleIcon(type) as React.ReactElement<any>, { size: 56, className: currentTypeStyle.icon, strokeWidth: 1 })}
                                 </div>
                              </div>
                           )}
                        </div>
                        <div className="flex-1 p-8 flex flex-col justify-center bg-white">
                           <div className="flex items-center justify-between gap-4">
                              <h3 className="font-black text-slate-900 text-2xl tracking-tighter truncate uppercase">{title || 'Protocol Title'}</h3>
                              <span className={`text-[8px] font-black px-2.5 py-1 rounded-md uppercase tracking-[0.2em] border-2 shrink-0 ${currentTypeStyle.badge}`}>{t.moduleType[type as keyof typeof t.moduleType] || type}</span>
                           </div>
                           <div className="mt-3 flex gap-2 overflow-hidden opacity-50">
                              {(tags.split(',').filter(Boolean)[0]) && (
                                <span className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md tracking-widest uppercase">#{tags.split(',')[0].trim()}</span>
                              )}
                           </div>
                        </div>
                     </div>

                     <p className="text-[10px] text-center text-slate-400 leading-relaxed max-w-[280px] font-medium italic">
                        The simulation above shows how this protocol will appear in your global module architecture.
                     </p>
                  </div>
               </div>

            </div>

            {/* Footer Actions */}
            <div className="px-12 py-10 bg-white border-t border-slate-100 flex justify-end gap-6 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-10 py-5 rounded-3xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={isSaving} className="px-16 py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-[0.2em] text-[11px] min-w-[220px] shadow-2xl shadow-blue-500/40 active:scale-95 transition-all">
                {isSaving ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </div>
                ) : (
                  <span>Commit Changes</span>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};