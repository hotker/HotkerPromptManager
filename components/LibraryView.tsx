import React, { useState, useEffect, useRef } from 'react';
import { PromptModule, ModuleType } from '../types';
import { MODULE_COLORS } from '../constants';
import { 
  Plus, Trash2, Edit2, Search, Copy, Check, Filter, X, 
  LayoutList, LayoutGrid, Image as ImageIcon, Link, 
  User, FileText, CheckSquare, Shield, Layout, MessageSquare, Box, ExternalLink,
  ChevronLeft, ChevronRight, Maximize2, AlertCircle
} from 'lucide-react';
import { Language, translations } from '../translations';

interface LibraryViewProps {
  modules: PromptModule[];
  setModules: React.Dispatch<React.SetStateAction<PromptModule[]>>;
  lang: Language;
}

const ITEMS_PER_PAGE = 12;

export const LibraryView: React.FC<LibraryViewProps> = ({ modules, setModules, lang }) => {
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
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('grid');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);

  // Reset pagination when filters change
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
      if (editingModule) {
        return prev.map(m => m.id === editingModule.id ? newModule : m);
      }
      return [newModule, ...prev];
    });

    if (!editingModule) {
      setSearchTerm('');
      setFilterType('ALL');
      setCurrentPage(1);
    }

    setTimeout(() => {
      setIsSaving(false);
      setIsModalOpen(false);
    }, 300);
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
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden md:rounded-tl-2xl md:border-l md:border-t md:border-slate-200">
      
      {/* Top Toolbar */}
      <div className="px-6 py-5 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 shadow-sm z-10">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.library.title}</h2>
          <p className="text-xs text-slate-500 mt-1 font-medium opacity-80 uppercase tracking-widest">{modules.length} {t.library.modulesAvailable}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-80">
              <input 
                type="text" 
                placeholder={t.library.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-2xl px-4 py-3 pl-11 text-sm focus:bg-white focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X size={16} />
                </button>
              )}
           </div>

           <div className="flex items-center bg-slate-100 rounded-2xl p-1 gap-1">
             <button onClick={() => setViewMode('list')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList size={18}/></button>
             <button onClick={() => setViewMode('grid')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18}/></button>
           </div>

           <button onClick={() => openModal()} className="btn-primary py-3 px-6 rounded-2xl shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">
             <Plus size={18} strokeWidth={3} /> <span className="hidden sm:inline font-bold uppercase tracking-wide">{t.library.createBtn}</span>
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-2 shrink-0 text-slate-400 pr-2 border-r border-slate-100">
           <Filter size={14} />
           <span className="text-[10px] font-black uppercase tracking-[0.2em]">Group</span>
        </div>
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border-2 ${filterType === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(type => (
           <button 
             key={type}
             onClick={() => setFilterType(type)}
             className={`px-5 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap border-2 ${filterType === type ? 'bg-slate-900 border-slate-900 text-white shadow-lg scale-105' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
           >
             {t.moduleType[type as keyof typeof t.moduleType] || type}
           </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50" ref={scrollContainerRef}>
        {paginatedModules.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-8 border-4 border-white shadow-inner">
                <Box size={56} strokeWidth={1} />
              </div>
              <p className="font-black tracking-[0.2em] text-slate-400 uppercase">{t.library.noModulesFound}</p>
              {searchTerm && <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 text-sm font-black hover:underline underline-offset-8">RESET FILTERS</button>}
           </div>
        ) : viewMode === 'list' ? (
          <div className="max-w-5xl mx-auto space-y-4">
             {paginatedModules.map((module) => (
               <div key={module.id} className="group flex items-center p-5 bg-white border border-slate-200 rounded-[1.5rem] hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/5 transition-all cursor-pointer gap-6" onClick={() => openModal(module)}>
                 <div className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-50 bg-slate-50 shadow-sm">
                    {module.imageUrl ? (
                       <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                       <div className={`w-full h-full flex items-center justify-center ${getTypeStyles(module.type).bg}`}>
                          {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 28, className: 'opacity-50' })}
                       </div>
                    )}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="text-lg font-black text-slate-900 truncate tracking-tight">{module.title}</h3>
                      <span className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest ${getTypeStyles(module.type).badge}`}>
                        {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono line-clamp-1 opacity-60 tracking-tight">
                      {module.content}
                    </p>
                 </div>

                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }}
                      className={`p-3 rounded-2xl border-2 transition-all ${copiedId === module.id ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-100 hover:text-blue-600 hover:border-blue-400 hover:shadow-xl'}`}
                    >
                      {copiedId === module.id ? <Check size={20} /> : <Copy size={20} />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }}
                      className="p-3 rounded-2xl bg-white border-2 border-slate-100 text-slate-400 hover:text-red-600 hover:border-red-400 hover:shadow-xl transition-all"
                    >
                      <Trash2 size={20} />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
            {paginatedModules.map(module => {
              const typeStyle = getTypeStyles(module.type);
              return (
              <div key={module.id} className="group flex flex-col h-[420px] bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden hover:border-blue-500/30 hover:shadow-[0_20px_50px_rgba(59,130,246,0.12)] transition-all duration-700 cursor-pointer" onClick={() => openModal(module)}>
                 {/* Dominant Visual Area - 75% height */}
                 <div className={`relative h-[75%] shrink-0 overflow-hidden ${!module.imageUrl ? typeStyle.bg : 'bg-slate-100'}`}>
                    {module.imageUrl ? (
                       <>
                         <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover transition-transform duration-[1.5s] group-hover:scale-110" />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-slate-900/40 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10 backdrop-blur-[2px]">
                            <button 
                               onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(module.imageUrl || null); }}
                               className="p-4 bg-white/95 backdrop-blur rounded-full text-slate-900 hover:scale-125 active:scale-90 shadow-2xl transition-all duration-300"
                               title="View Full Resolution"
                            >
                               <Maximize2 size={28} strokeWidth={3} />
                            </button>
                         </div>
                       </>
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center gap-6">
                          <div className="w-24 h-24 rounded-[2rem] bg-white/90 backdrop-blur-xl shadow-2xl flex items-center justify-center text-slate-400 group-hover:rotate-[15deg] group-hover:scale-110 transition-all duration-700 ease-out">
                             {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 48, className: typeStyle.icon, strokeWidth: 1 })}
                          </div>
                          <span className={`text-[10px] font-black px-6 py-1.5 rounded-full uppercase tracking-[0.3em] border-2 shadow-sm ${typeStyle.badge} bg-white/50 backdrop-blur`}>
                             {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                          </span>
                       </div>
                    )}
                    
                    {/* Action Toolbar Overlay */}
                    <div className="absolute top-6 right-6 flex flex-col gap-3 translate-x-16 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500 delay-75 z-20">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }}
                          className="p-3 rounded-2xl bg-white/98 backdrop-blur shadow-2xl text-slate-700 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all"
                        >
                          {copiedId === module.id ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(module); }}
                          className="p-3 rounded-2xl bg-white/98 backdrop-blur shadow-2xl text-slate-700 hover:text-blue-600 hover:scale-110 active:scale-95 transition-all"
                        >
                          <Edit2 size={20} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }}
                          className="p-3 rounded-2xl bg-white/98 backdrop-blur shadow-2xl text-slate-700 hover:text-red-600 hover:scale-110 active:scale-95 transition-all"
                        >
                          <Trash2 size={20} />
                        </button>
                    </div>
                 </div>
                 
                 {/* Information Area - 25% height - Only Title and Badge */}
                 <div className="flex-1 p-8 flex flex-col justify-center bg-white relative">
                    <div className="flex items-center justify-between min-w-0">
                       <h3 className="font-black text-slate-900 text-xl leading-none tracking-tight truncate pr-4 uppercase group-hover:text-blue-600 transition-colors" title={module.title}>
                          {module.title}
                       </h3>
                       {!module.imageUrl && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                       )}
                       {module.imageUrl && (
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.15em] border-2 shrink-0 ${typeStyle.badge}`}>
                             {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                          </span>
                       )}
                    </div>
                    {module.tags.length > 0 && (
                        <div className="mt-3 flex gap-2 overflow-hidden">
                           {module.tags.slice(0, 1).map(tag => (
                             <span key={tag} className="text-[9px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md tracking-widest uppercase">#{tag}</span>
                           ))}
                           {module.tags.length > 1 && <span className="text-[9px] font-black text-slate-300">+{module.tags.length - 1}</span>}
                        </div>
                    )}
                 </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
         <div className="px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
               Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-3">
               <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-3 rounded-2xl border-2 border-slate-100 text-slate-600 disabled:opacity-20 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
               >
                  <ChevronLeft size={20} />
               </button>
               <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-3 rounded-2xl border-2 border-slate-100 text-slate-600 disabled:opacity-20 hover:border-slate-300 hover:bg-slate-50 transition-all shadow-sm"
               >
                  <ChevronRight size={20} />
               </button>
            </div>
         </div>
      )}

      {/* Image Preview Modal (Lightbox) */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-500">
           <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-2xl" onClick={() => setPreviewImageUrl(null)}></div>
           <button 
             onClick={() => setPreviewImageUrl(null)} 
             className="absolute top-8 right-8 p-4 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10 shadow-2xl active:scale-90"
           >
             <X size={32} />
           </button>
           <div className="relative max-w-full max-h-full overflow-hidden rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-white/10 animate-in zoom-in-90 duration-700 ease-out">
             <img 
               src={previewImageUrl} 
               alt="Preview" 
               className="max-w-full max-h-[80vh] object-contain select-none"
             />
             <div className="p-6 bg-slate-900/60 backdrop-blur-3xl border-t border-white/5 text-center flex flex-col items-center gap-2">
                <a href={previewImageUrl} target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white text-[10px] font-black tracking-[0.3em] uppercase flex items-center gap-3 transition-all">
                   <ExternalLink size={16} /> DOWNLOAD_ORIGINAL_SOURCE
                </a>
             </div>
           </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-700" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-700 ease-out border-l border-slate-100">
            <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-white/90 backdrop-blur sticky top-0 z-10">
               <div>
                  <h3 className="font-black text-slate-900 text-3xl tracking-tighter uppercase">
                    {editingModule ? t.library.modalEdit : t.library.modalCreate}
                  </h3>
                  <p className="text-[10px] text-blue-600 font-black opacity-80 mt-1 uppercase tracking-[0.3em]">Module Registry Protocol</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-3 hover:bg-slate-100 rounded-full transition-all active:scale-90"><X size={28}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
              {formError && (
                <div className="p-5 bg-red-50 border-2 border-red-100 rounded-[1.5rem] text-red-600 text-xs font-black flex items-center gap-4 animate-in fade-in slide-in-from-top-4 uppercase tracking-wider">
                  <AlertCircle size={20} /> {formError}
                </div>
              )}

              <div className="space-y-8">
                <div className="group">
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 px-1 group-focus-within:text-blue-500 transition-colors">Identification Title</label>
                  <input className={`prod-input text-xl font-black tracking-tight rounded-2xl py-5 px-6 border-2 shadow-inner ${!title && formError ? 'border-red-300' : 'border-slate-100 focus:border-blue-500'} transition-all`} value={title} onChange={e => setTitle(e.target.value)} placeholder={t.library.placeholderTitle} autoFocus/>
                </div>
                
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 px-1">Classification</label>
                    <select className="prod-input font-bold rounded-2xl py-4 border-2 border-slate-100 focus:border-blue-500 shadow-inner" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                      {Object.values(ModuleType).map(t_val => (
                        <option key={t_val} value={t_val}>{translations[lang].moduleType[t_val as keyof typeof translations['en']['moduleType']] || t_val}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 px-1">Metadata Tags</label>
                    <input className="prod-input font-bold rounded-2xl py-4 border-2 border-slate-100 focus:border-blue-500 shadow-inner" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, react, v1..." />
                  </div>
                </div>

                <div>
                   <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 px-1 flex items-center gap-2">
                      <ImageIcon size={14} /> Visual Asset URI
                   </label>
                   <div className="flex gap-6">
                      <input 
                        className="prod-input flex-1 font-mono text-xs rounded-2xl py-4 border-2 border-slate-100 focus:border-blue-500 shadow-inner" 
                        value={imageUrl} 
                        onChange={e => setImageUrl(e.target.value)} 
                        placeholder="https://example.com/image.png" 
                      />
                      {imageUrl && (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-slate-100 shrink-0 shadow-lg">
                           <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                      )}
                   </div>
                   <p className="text-[10px] text-slate-400 font-bold mt-3 px-1 tracking-tight opacity-60">Paste a direct CDN URL for instant thumbnail rendering.</p>
                </div>

                <div>
                   <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 px-1">Prompt Instruction Payload</label>
                   <textarea 
                     className={`prod-input min-h-[300px] font-mono text-sm leading-relaxed rounded-[2rem] p-8 border-2 shadow-inner ${!content && formError ? 'border-red-300' : 'border-slate-100 focus:border-blue-500'} transition-all`} 
                     value={content} 
                     onChange={e => setContent(e.target.value)} 
                     placeholder={t.library.placeholderContent}
                   />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.25em] mb-3 px-1">Contextual Notes</label>
                  <input className="prod-input font-medium rounded-2xl py-4 border-2 border-slate-100 focus:border-blue-500 shadow-inner" value={description} onChange={e => setDescription(e.target.value)} placeholder="Internal operational context..." />
                </div>
              </div>
            </div>

            <div className="p-10 border-t border-slate-100 bg-white flex justify-end gap-5 sticky bottom-0">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary py-4 px-10 rounded-2xl font-black uppercase tracking-widest text-xs">CANCEL</button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary py-4 px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-xs min-w-[180px] shadow-2xl shadow-blue-500/30">
                {isSaving ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>WRITING_DATA</span>
                  </div>
                ) : (
                  <span>REGISTER_MODULE</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};