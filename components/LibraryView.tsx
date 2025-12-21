import React, { useState, useEffect, useRef } from 'react';
import { PromptModule, ModuleType } from '../types';
import { MODULE_COLORS } from '../constants';
import { 
  Plus, Trash2, Edit2, Search, Copy, Check, Filter, X, 
  LayoutList, LayoutGrid, Image as ImageIcon, Link, 
  User, FileText, CheckSquare, Shield, Layout, MessageSquare, Box, ExternalLink,
  ChevronLeft, ChevronRight, Maximize2, AlertCircle, Cloud, CloudOff, RefreshCw,
  Eye, Settings, Code, Tag, Info, FileJson
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
        case ModuleType.ROLE: return { bg: 'bg-blue-50/50', border: 'border-blue-100', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-700 border-blue-200', textBg: 'bg-blue-50/30' };
        case ModuleType.CONTEXT: return { bg: 'bg-purple-50/50', border: 'border-purple-100', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-700 border-purple-200', textBg: 'bg-purple-50/30' };
        case ModuleType.TASK: return { bg: 'bg-emerald-50/50', border: 'border-emerald-100', icon: 'text-emerald-500', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', textBg: 'bg-emerald-50/30' };
        case ModuleType.CONSTRAINT: return { bg: 'bg-rose-50/50', border: 'border-rose-100', icon: 'text-rose-500', badge: 'bg-rose-100 text-rose-700 border-rose-200', textBg: 'bg-rose-50/30' };
        case ModuleType.FORMAT: return { bg: 'bg-orange-50/50', border: 'border-orange-100', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-700 border-orange-200', textBg: 'bg-orange-50/30' };
        case ModuleType.TONE: return { bg: 'bg-pink-50/50', border: 'border-pink-100', icon: 'text-pink-500', badge: 'bg-pink-100 text-pink-700 border-pink-200', textBg: 'bg-pink-50/30' };
        default: return { bg: 'bg-slate-50/50', border: 'border-slate-100', icon: 'text-slate-500', badge: 'bg-slate-100 text-slate-700 border-slate-200', textBg: 'bg-slate-50/30' };
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

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden md:rounded-tl-[2.5rem] md:border-l md:border-t md:border-slate-200">
      
      {/* Top Toolbar */}
      <div className="px-10 py-8 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-6">
          <div className="bg-slate-900 p-3 rounded-2xl text-white shadow-xl shadow-slate-900/20">
             <Box size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase leading-none">{t.library.title}</h2>
            <p className="text-[10px] text-slate-400 mt-2 font-black uppercase tracking-[0.3em] opacity-60">{modules.length} {t.library.modulesAvailable}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           <div className="relative flex-1 md:w-96 group">
              <input 
                type="text" 
                placeholder={t.library.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-2xl px-6 py-4 pl-14 text-sm font-bold focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
           </div>

           <div className="flex items-center bg-slate-100 rounded-2xl p-1.5 gap-1 shadow-inner">
             <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-lg text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList size={20}/></button>
             <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-lg text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={20}/></button>
           </div>

           <button onClick={() => openModal()} className="btn-primary py-4 px-10 rounded-2xl shadow-2xl shadow-blue-500/30 active:scale-95 transition-all">
             <Plus size={20} strokeWidth={3} /> <span className="hidden sm:inline font-black uppercase tracking-[0.2em] text-xs">{t.library.createBtn}</span>
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-10 py-5 border-b border-slate-100 bg-white flex items-center gap-4 overflow-x-auto no-scrollbar">
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border-2 ${filterType === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(type_val => (
           <button 
             key={type_val}
             onClick={() => setFilterType(type_val)}
             className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.25em] transition-all whitespace-nowrap border-2 ${filterType === type_val ? 'bg-slate-900 border-slate-900 text-white shadow-2xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
           >
             {t.moduleType[type_val as keyof typeof t.moduleType] || type_val}
           </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-12 custom-scrollbar bg-slate-50/30" ref={scrollContainerRef}>
        {paginatedModules.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-40">
              <Box size={100} strokeWidth={0.5} className="mb-8" />
              <p className="font-black tracking-[0.5em] uppercase text-[10px]">{t.library.noModulesFound}</p>
           </div>
        ) : viewMode === 'list' ? (
          <div className="max-w-6xl mx-auto space-y-6">
             {paginatedModules.map((module) => (
               <div key={module.id} className="group flex items-center p-8 bg-white border border-slate-200 rounded-[2.5rem] hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer gap-10" onClick={() => openModal(module)}>
                 <div className="shrink-0 w-28 h-28 rounded-[2rem] overflow-hidden border-2 border-slate-50 bg-slate-50 shadow-inner">
                    {module.imageUrl ? (
                       <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-[1s]" />
                    ) : (
                       <div className={`w-full h-full flex items-center justify-center ${getTypeStyles(module.type).bg}`}>
                          {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 40, className: 'opacity-30' })}
                       </div>
                    )}
                 </div>
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-2xl font-black text-slate-900 truncate tracking-tight uppercase group-hover:text-blue-600 transition-colors">{module.title}</h3>
                      <span className={`text-[8px] px-3 py-1.5 rounded-full font-black uppercase tracking-widest ${getTypeStyles(module.type).badge}`}>
                        {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono line-clamp-2 leading-relaxed opacity-60 pr-10">{module.content}</p>
                 </div>
                 <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all translate-x-10 group-hover:translate-x-0">
                    <button onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }} className="p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white hover:border-blue-400 hover:text-blue-600 hover:shadow-xl transition-all"><Copy size={24}/></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }} className="p-5 rounded-[1.5rem] border-2 border-slate-100 bg-white hover:border-red-400 hover:text-red-600 hover:shadow-xl transition-all"><Trash2 size={24}/></button>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
            {paginatedModules.map(module => {
              const typeStyle = getTypeStyles(module.type);
              
              // 有图卡片渲染
              if (module.imageUrl) {
                return (
                  <div key={module.id} className="group flex flex-col h-[480px] bg-white border border-slate-100 rounded-[3rem] overflow-hidden hover:border-blue-500/40 hover:shadow-[0_50px_100px_-30px_rgba(59,130,246,0.2)] transition-all duration-[0.8s] cursor-pointer" onClick={() => openModal(module)}>
                    <div className="relative h-[72%] shrink-0 overflow-hidden bg-slate-100">
                      <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover transition-transform duration-[2.5s] group-hover:scale-110" />
                      
                      {/* Badge Overlays */}
                      <div className="absolute top-6 left-6 z-10">
                         <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border-2 shadow-2xl backdrop-blur-md bg-white/80 ${typeStyle.badge}`}>
                            {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                         </span>
                      </div>

                      {/* Floating Actions */}
                      <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-20 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 z-20">
                          <button onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }} className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur shadow-2xl text-slate-800 hover:text-blue-600 hover:scale-110 transition-all"><Copy size={20} /></button>
                          <button onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(module.imageUrl || null); }} className="p-4 rounded-[1.5rem] bg-white/95 backdrop-blur shadow-2xl text-slate-800 hover:text-blue-600 hover:scale-110 transition-all"><Maximize2 size={20} /></button>
                      </div>

                      {/* Tags Overlay */}
                      {module.tags.length > 0 && (
                        <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2 opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700 z-10">
                           {module.tags.slice(0, 3).map(tag => (
                             <span key={tag} className="text-[8px] font-black bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full tracking-widest uppercase border border-white/10">#{tag}</span>
                           ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 p-8 flex flex-col justify-center bg-white">
                       <h3 className="font-black text-slate-900 text-2xl tracking-tighter truncate uppercase group-hover:text-blue-600 transition-colors leading-tight" title={module.title}>{module.title}</h3>
                       <p className="text-[10px] text-slate-400 font-mono mt-3 opacity-50 line-clamp-1">{module.content}</p>
                    </div>
                  </div>
                );
              }

              // 纯文字卡片渲染
              return (
                <div key={module.id} className={`group flex flex-col h-[480px] ${typeStyle.bg} border-2 ${typeStyle.border} rounded-[3rem] overflow-hidden hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] transition-all duration-700 cursor-pointer relative`} onClick={() => openModal(module)}>
                   {/* Background Decorative Type Icon */}
                   <div className="absolute -bottom-10 -right-10 opacity-[0.03] rotate-12 transition-transform duration-[2s] group-hover:rotate-0 pointer-events-none">
                      {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 300 })}
                   </div>

                   <div className="p-10 flex flex-col h-full relative z-10">
                      {/* Header */}
                      <div className="flex justify-between items-start mb-10">
                         <div className="bg-white p-4 rounded-[1.5rem] shadow-xl text-slate-400 group-hover:text-blue-500 transition-colors duration-500">
                            {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 28, strokeWidth: 2.5 })}
                         </div>
                         <span className={`text-[8px] font-black px-4 py-2 rounded-full uppercase tracking-[0.25em] border-2 shadow-sm ${typeStyle.badge} bg-white`}>
                            {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                         </span>
                      </div>

                      {/* Content Section */}
                      <div className="flex-1 flex flex-col min-w-0">
                         <h3 className="font-black text-slate-900 text-3xl tracking-tighter leading-none uppercase mb-6 pr-6 group-hover:text-blue-600 transition-colors duration-500">
                            {module.title}
                         </h3>
                         
                         {/* Content Snippet (Payload) */}
                         <div className={`flex-1 p-6 rounded-[2rem] border-2 border-dashed ${typeStyle.border} font-mono text-[11px] leading-relaxed text-slate-500 overflow-hidden relative group-hover:bg-white/50 transition-all`}>
                            <div className="line-clamp-[10] whitespace-pre-wrap">{module.content}</div>
                            <div className="absolute bottom-4 right-6 text-[8px] font-black text-slate-300 tracking-[0.2em] uppercase">Payload.Instruction</div>
                         </div>
                      </div>

                      {/* Actions Footer */}
                      <div className="mt-8 flex justify-between items-center">
                         <div className="flex gap-2">
                           {module.tags.slice(0, 2).map(tag => (
                              <span key={tag} className="text-[8px] font-black text-slate-400 uppercase tracking-widest opacity-60">#{tag}</span>
                           ))}
                         </div>
                         <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                            <button onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }} className="p-3 bg-white shadow-xl rounded-xl text-slate-700 hover:text-blue-600 transition-all"><Copy size={16}/></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }} className="p-3 bg-white shadow-xl rounded-xl text-slate-700 hover:text-red-600 transition-all"><Trash2 size={16}/></button>
                         </div>
                      </div>
                   </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
         <div className="px-10 py-8 bg-white border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] opacity-60">Page {currentPage} of {totalPages}</span>
            <div className="flex gap-4">
               <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="p-5 rounded-[1.5rem] border-2 border-slate-100 text-slate-600 hover:border-slate-300 disabled:opacity-10 transition-all shadow-sm"><ChevronLeft size={24} /></button>
               <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="p-5 rounded-[1.5rem] border-2 border-slate-100 text-slate-600 hover:border-slate-300 disabled:opacity-10 transition-all shadow-sm"><ChevronRight size={24} /></button>
            </div>
         </div>
      )}

      {/* Lightbox */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-12 animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-3xl" onClick={() => setPreviewImageUrl(null)}></div>
           <button onClick={() => setPreviewImageUrl(null)} className="absolute top-10 right-10 p-6 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10"><X size={36} /></button>
           <img src={previewImageUrl} alt="Preview" className="relative max-w-full max-h-[90vh] object-contain rounded-[4rem] shadow-[0_100px_150px_-50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-700 ease-out border border-white/10" />
        </div>
      )}

      {/* Advanced Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-2xl transition-opacity duration-700" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-[1200px] h-full max-h-[900px] bg-slate-50 shadow-[0_100px_200px_-50px_rgba(0,0,0,0.6)] flex flex-col animate-in zoom-in-95 duration-500 rounded-[4rem] overflow-hidden border border-white/20">
            
            {/* Header */}
            <div className="px-14 py-10 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-2xl shadow-slate-900/30">
                    <Settings size={28} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-3xl tracking-tighter uppercase leading-none">
                      {editingModule ? 'Module Configuration' : 'Initial Registry'}
                    </h3>
                    <p className="text-[10px] text-blue-600 font-black opacity-80 mt-2 uppercase tracking-[0.4em]">Protocol Architecture v3.0</p>
                  </div>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-4 hover:bg-slate-100 rounded-full transition-all active:scale-90"><X size={36}/></button>
            </div>
            
            {/* Split View */}
            <div className="flex-1 flex overflow-hidden">
               <div className="flex-1 overflow-y-auto p-14 custom-scrollbar bg-white">
                  <div className="space-y-12 max-w-2xl">
                     {formError && (
                        <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[2rem] text-red-600 text-xs font-black flex items-center gap-6 animate-shake">
                          <AlertCircle size={24} /> {formError}
                        </div>
                     )}

                     <div className="space-y-8">
                        <div className="flex items-center gap-4 text-slate-400 mb-2">
                           <Info size={16} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Identification Registry</span>
                        </div>
                        <input 
                           className={`w-full text-3xl font-black tracking-tighter rounded-[2rem] py-8 px-10 bg-slate-50 border-2 transition-all outline-none focus:ring-8 focus:ring-blue-500/5 ${!title && formError ? 'border-red-300' : 'border-slate-100 focus:border-blue-500 focus:bg-white'}`} 
                           value={title} 
                           onChange={e => setTitle(e.target.value)} 
                           placeholder="MODULE_TITLE_GOES_HERE" 
                        />
                        <div className="grid grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-4">Classification</label>
                              <select className="w-full font-black rounded-2xl py-5 px-8 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all cursor-pointer shadow-inner uppercase text-[10px] tracking-widest" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                                {Object.values(ModuleType).map(v => <option key={v} value={v}>{t.moduleType[v as keyof typeof t.moduleType] || v}</option>)}
                              </select>
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pl-4">Tags (META_DATA)</label>
                              <div className="relative group">
                                 <Tag size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                                 <input className="w-full font-bold rounded-2xl py-5 pl-14 pr-8 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all shadow-inner" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, prompt, kernel..." />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="flex items-center gap-4 text-slate-400 mb-2">
                           <ImageIcon size={16} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Visual Assets</span>
                        </div>
                        <div className="relative group">
                           <Link size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" />
                           <input 
                              className="w-full font-mono text-xs rounded-2xl py-5 pl-14 pr-8 bg-slate-50 border-2 border-slate-100 focus:border-blue-500 outline-none transition-all shadow-inner" 
                              value={imageUrl} 
                              onChange={e => setImageUrl(e.target.value)} 
                              placeholder="https://cdn.example.com/asset_v1.png" 
                           />
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="flex items-center gap-4 text-slate-400 mb-2">
                           <Code size={16} className="text-blue-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.3em]">Kernel Instruction Payload</span>
                        </div>
                        <div className="relative bg-[#0d0d0f] rounded-[3rem] p-10 shadow-2xl border border-white/5 focus-within:ring-8 focus-within:ring-blue-500/10 transition-all">
                           <textarea 
                              className="w-full min-h-[400px] bg-transparent text-emerald-400/90 font-mono text-sm leading-relaxed outline-none resize-none custom-scrollbar placeholder:opacity-20" 
                              value={content} 
                              onChange={e => setContent(e.target.value)} 
                              placeholder="// Define the core prompt logic here..."
                           />
                           <div className="absolute top-8 right-10 text-[9px] font-black text-white/10 tracking-[0.4em] uppercase">SYSTEM.RAW_DATA</div>
                        </div>
                     </div>
                  </div>
               </div>

               {/* Right Preview */}
               <div className="hidden lg:flex w-[480px] bg-slate-100/50 border-l border-slate-200 flex-col items-center justify-center p-14">
                  <div className="w-full flex flex-col items-center gap-10 animate-in fade-in slide-in-from-right-10 duration-700">
                     <div className="flex items-center gap-4 text-slate-400">
                        <Eye size={18} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">Real-time Visualization</span>
                     </div>
                     
                     {/* Preview Card */}
                     {imageUrl ? (
                        <div className="w-full h-[480px] bg-white border border-slate-200 rounded-[3rem] overflow-hidden shadow-2xl shadow-blue-500/10 pointer-events-none scale-90">
                           <div className="relative h-[72%] shrink-0 overflow-hidden bg-slate-100">
                              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                              <div className="absolute top-6 left-6 z-10">
                                 <span className={`text-[8px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border-2 shadow-2xl bg-white/80 ${getTypeStyles(type).badge}`}>{t.moduleType[type as keyof typeof t.moduleType] || type}</span>
                              </div>
                           </div>
                           <div className="flex-1 p-8 flex flex-col justify-center bg-white">
                              <h3 className="font-black text-slate-900 text-2xl tracking-tighter truncate uppercase">{title || 'PROTOCOL_NAME'}</h3>
                              <p className="text-[10px] text-slate-400 font-mono mt-3 opacity-50 line-clamp-1">{content || 'Payload content will appear here...'}</p>
                           </div>
                        </div>
                     ) : (
                        <div className={`w-full h-[480px] ${getTypeStyles(type).bg} border-2 ${getTypeStyles(type).border} rounded-[3rem] overflow-hidden shadow-2xl pointer-events-none scale-90 p-10 flex flex-col`}>
                           <div className="flex justify-between items-start mb-10">
                              <div className="bg-white p-4 rounded-[1.5rem] shadow-xl text-blue-500">{React.cloneElement(getModuleIcon(type) as React.ReactElement<any>, { size: 28, strokeWidth: 2.5 })}</div>
                              <span className={`text-[8px] font-black px-4 py-2 rounded-full uppercase tracking-[0.25em] border-2 bg-white ${getTypeStyles(type).badge}`}>{t.moduleType[type as keyof typeof t.moduleType] || type}</span>
                           </div>
                           <h3 className="font-black text-slate-900 text-3xl tracking-tighter uppercase mb-6">{title || 'PROTOCOL_NAME'}</h3>
                           <div className={`flex-1 p-6 rounded-[2rem] border-2 border-dashed ${getTypeStyles(type).border} font-mono text-[11px] leading-relaxed text-slate-500 overflow-hidden`}>
                              {content || 'Instruction data is currently empty...'}
                           </div>
                        </div>
                     )}

                     <p className="text-[10px] text-center text-slate-400 leading-relaxed max-w-[280px] font-black uppercase tracking-[0.1em] opacity-40">
                        This digital twin represents how your module will be deployed across the architecture.
                     </p>
                  </div>
               </div>
            </div>

            {/* Footer */}
            <div className="px-14 py-12 bg-white border-t border-slate-100 flex justify-end gap-6 shrink-0">
              <button onClick={() => setIsModalOpen(false)} className="px-12 py-6 rounded-[2rem] font-black uppercase tracking-[0.3em] text-[10px] text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-all">Abort_Process</button>
              <button onClick={handleSave} disabled={isSaving} className="px-20 py-6 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-[0.3em] text-[11px] min-w-[260px] shadow-2xl shadow-slate-900/30 active:scale-95 transition-all">
                {isSaving ? 'Writing_Data...' : 'Commit_Protocol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};