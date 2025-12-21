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
        case ModuleType.ROLE: return { bg: 'bg-gradient-to-br from-blue-100 to-indigo-50', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700 border-blue-200' };
        case ModuleType.CONTEXT: return { bg: 'bg-gradient-to-br from-purple-100 to-fuchsia-50', icon: 'text-purple-600', badge: 'bg-purple-100 text-purple-700 border-purple-200' };
        case ModuleType.TASK: return { bg: 'bg-gradient-to-br from-emerald-100 to-teal-50', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
        case ModuleType.CONSTRAINT: return { bg: 'bg-gradient-to-br from-rose-100 to-pink-50', icon: 'text-rose-600', badge: 'bg-rose-100 text-rose-700 border-rose-200' };
        case ModuleType.FORMAT: return { bg: 'bg-gradient-to-br from-orange-100 to-amber-50', icon: 'text-orange-600', badge: 'bg-orange-100 text-orange-700 border-orange-200' };
        case ModuleType.TONE: return { bg: 'bg-gradient-to-br from-pink-100 to-rose-50', icon: 'text-pink-600', badge: 'bg-pink-100 text-pink-700 border-pink-200' };
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

    // 关键逻辑：如果是新增，强制清空搜索条件以展示新模块
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
          <p className="text-xs text-slate-500 mt-1 font-medium opacity-80">{modules.length} {t.library.modulesAvailable}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative flex-1 md:w-80">
              <input 
                type="text" 
                placeholder={t.library.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl px-4 py-2.5 pl-11 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all shadow-inner"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X size={16} />
                </button>
              )}
           </div>

           <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList size={18}/></button>
             <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={18}/></button>
           </div>

           <button onClick={() => openModal()} className="btn-primary py-2.5 px-6 rounded-xl shadow-lg shadow-blue-500/20">
             <Plus size={18} strokeWidth={3} /> <span className="hidden sm:inline font-bold">{t.library.createBtn}</span>
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-2 shrink-0 text-slate-400 pr-2 border-r border-slate-100">
           <Filter size={14} />
           <span className="text-[10px] font-bold uppercase tracking-widest">Filter</span>
        </div>
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterType === 'ALL' ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(type => (
           <button 
             key={type}
             onClick={() => setFilterType(type)}
             className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${filterType === type ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-105' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400'}`}
           >
             {t.moduleType[type as keyof typeof t.moduleType] || type}
           </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50/50" ref={scrollContainerRef}>
        {paginatedModules.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-slate-300">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                <Box size={40} strokeWidth={1} />
              </div>
              <p className="font-bold tracking-tight text-slate-400">{t.library.noModulesFound}</p>
              {searchTerm && <button onClick={() => setSearchTerm('')} className="mt-4 text-blue-600 text-sm font-bold hover:underline decoration-2 underline-offset-4">清除所有过滤</button>}
           </div>
        ) : viewMode === 'list' ? (
          <div className="max-w-5xl mx-auto space-y-3">
             {paginatedModules.map((module) => (
               <div key={module.id} className="group flex items-center p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all cursor-pointer gap-5" onClick={() => openModal(module)}>
                 <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden border border-slate-100 bg-slate-50">
                    {module.imageUrl ? (
                       <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover" />
                    ) : (
                       <div className={`w-full h-full flex items-center justify-center ${getTypeStyles(module.type).bg}`}>
                          {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 24, className: 'opacity-40' })}
                       </div>
                    )}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-base font-bold text-slate-900 truncate">{module.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider ${getTypeStyles(module.type).badge}`}>
                        {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono line-clamp-1 opacity-70">
                      {module.content}
                    </p>
                 </div>

                 <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-4 group-hover:translate-x-0 transition-all duration-300">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }}
                      className={`p-2.5 rounded-xl border transition-all ${copiedId === module.id ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-400 border-slate-200 hover:text-blue-600 hover:border-blue-400 hover:shadow-lg'}`}
                    >
                      {copiedId === module.id ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openModal(module); }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-slate-900 hover:border-slate-900 hover:shadow-lg transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }}
                      className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-400 hover:text-red-600 hover:border-red-400 hover:shadow-lg transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {paginatedModules.map(module => {
              const typeStyle = getTypeStyles(module.type);
              return (
              <div key={module.id} className="group flex flex-col h-[400px] bg-white border border-slate-200 rounded-[2rem] overflow-hidden hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 cursor-pointer" onClick={() => openModal(module)}>
                 {/* Image/Thumbnail Section - Dominant */}
                 <div className={`relative h-[55%] shrink-0 overflow-hidden ${!module.imageUrl ? typeStyle.bg : 'bg-slate-100'}`}>
                    {module.imageUrl ? (
                       <>
                         <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                         {/* View Original Overlay */}
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-10">
                            <button 
                               onClick={(e) => { e.stopPropagation(); setPreviewImageUrl(module.imageUrl || null); }}
                               className="p-3 bg-white/90 backdrop-blur rounded-full text-slate-900 hover:scale-110 active:scale-95 shadow-xl transition-all"
                               title="查看大图"
                            >
                               <Maximize2 size={24} strokeWidth={2.5} />
                            </button>
                         </div>
                       </>
                    ) : (
                       <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                          <div className="w-16 h-16 rounded-3xl bg-white/80 backdrop-blur shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform duration-500">
                             {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 32, className: typeStyle.icon, strokeWidth: 1.5 })}
                          </div>
                          <span className={`text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-[0.2em] border shadow-sm ${typeStyle.badge}`}>
                             {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                          </span>
                       </div>
                    )}
                    
                    {/* Floating Action Buttons */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-20">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }}
                          className="p-2.5 rounded-xl bg-white/95 backdrop-blur shadow-xl text-slate-700 hover:text-blue-600 transition-all"
                        >
                          {copiedId === module.id ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(module); }}
                          className="p-2.5 rounded-xl bg-white/95 backdrop-blur shadow-xl text-slate-700 hover:text-blue-600 transition-all"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }}
                          className="p-2.5 rounded-xl bg-white/95 backdrop-blur shadow-xl text-slate-700 hover:text-red-600 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                 </div>
                 
                 {/* Content Section */}
                 <div className="flex-1 p-6 flex flex-col min-h-0 relative">
                    <div className="flex items-start justify-between mb-3 min-w-0">
                       <h3 className="font-black text-slate-900 text-lg leading-tight truncate pr-4" title={module.title}>{module.title}</h3>
                       {module.imageUrl && (
                          <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest border shrink-0 ${typeStyle.badge}`}>
                             {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                          </span>
                       )}
                    </div>
                    
                    <div className="flex-1 relative overflow-hidden group/content">
                       <p className="text-[13px] text-slate-500 font-mono leading-relaxed line-clamp-4 group-hover/content:text-slate-800 transition-colors">
                         {module.content}
                       </p>
                       <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white to-transparent"></div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                       <div className="flex gap-1.5 overflow-hidden max-w-[70%]">
                          {module.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-[9px] font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md whitespace-nowrap">#{tag}</span>
                          ))}
                          {module.tags.length > 2 && <span className="text-[9px] font-bold text-slate-300">+{module.tags.length - 2}</span>}
                       </div>
                       <span className="text-[10px] font-black text-slate-300 font-mono tracking-tighter">{module.content.length} CHR</span>
                    </div>
                 </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
         <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
               <button 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all"
               >
                  <ChevronLeft size={18} />
               </button>
               <button 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="p-2 rounded-xl border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50 transition-all"
               >
                  <ChevronRight size={18} />
               </button>
            </div>
         </div>
      )}

      {/* Image Preview Modal (Lightbox) */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-xl" onClick={() => setPreviewImageUrl(null)}></div>
           <button 
             onClick={() => setPreviewImageUrl(null)} 
             className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-10"
           >
             <X size={28} />
           </button>
           <div className="relative max-w-full max-h-full overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-500">
             <img 
               src={previewImageUrl} 
               alt="Preview" 
               className="max-w-full max-h-[85vh] object-contain"
             />
             <div className="p-4 bg-white/5 backdrop-blur-md border-t border-white/10 text-center">
                <a href={previewImageUrl} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-xs font-bold tracking-widest flex items-center justify-center gap-2">
                   <ExternalLink size={14} /> 查看原始分辨率
                </a>
             </div>
           </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-500" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-500 ease-out border-l border-slate-100">
            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur sticky top-0 z-10">
               <div>
                  <h3 className="font-black text-slate-900 text-2xl tracking-tight">
                    {editingModule ? t.library.modalEdit : t.library.modalCreate}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium opacity-60 mt-1 uppercase tracking-widest">Protocol Configuration</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900 p-2 hover:bg-slate-100 rounded-full transition-all"><X size={24}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
              {formError && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={18} /> {formError}
                </div>
              )}

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 group-focus-within:text-blue-500 transition-colors">{t.library.labelTitle}</label>
                  <input className={`prod-input text-lg font-black tracking-tight rounded-2xl py-4 px-5 border-2 ${!title && formError ? 'border-red-300' : 'border-slate-100 focus:border-blue-500'} transition-all`} value={title} onChange={e => setTitle(e.target.value)} placeholder={t.library.placeholderTitle} autoFocus/>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">{t.library.labelType}</label>
                    <select className="prod-input font-bold rounded-2xl py-3 border-2 border-slate-100 focus:border-blue-500" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                      {Object.values(ModuleType).map(t_val => (
                        <option key={t_val} value={t_val}>{translations[lang].moduleType[t_val as keyof typeof translations['en']['moduleType']] || t_val}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">{t.library.labelTags}</label>
                    <input className="prod-input font-bold rounded-2xl py-3 border-2 border-slate-100 focus:border-blue-500" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, react, v1..." />
                  </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 flex items-center gap-2">
                      <ImageIcon size={12} /> {t.library.labelImage}
                   </label>
                   <div className="flex gap-4">
                      <input 
                        className="prod-input flex-1 font-mono text-xs rounded-2xl py-3 border-2 border-slate-100 focus:border-blue-500" 
                        value={imageUrl} 
                        onChange={e => setImageUrl(e.target.value)} 
                        placeholder="https://example.com/image.png" 
                      />
                      {imageUrl && (
                        <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-slate-100 shrink-0">
                           <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                        </div>
                      )}
                   </div>
                   <p className="text-[10px] text-slate-400 font-medium mt-2 px-1">{t.library.pasteImageTip}</p>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">{t.library.labelContent}</label>
                   <textarea 
                     className={`prod-input min-h-[250px] font-mono text-sm leading-relaxed rounded-2xl p-5 border-2 ${!content && formError ? 'border-red-300' : 'border-slate-100 focus:border-blue-500'} transition-all`} 
                     value={content} 
                     onChange={e => setContent(e.target.value)} 
                     placeholder={t.library.placeholderContent}
                   />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1">{t.library.labelDesc}</label>
                  <input className="prod-input font-medium rounded-2xl py-3 border-2 border-slate-100 focus:border-blue-500" value={description} onChange={e => setDescription(e.target.value)} placeholder="备注信息 (仅内部可见)" />
                </div>
              </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-white flex justify-end gap-4 sticky bottom-0">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary py-3 px-8 rounded-2xl font-bold">{t.library.btnCancel}</button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary py-3 px-10 rounded-2xl font-bold min-w-[140px] shadow-xl shadow-blue-500/20">
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>WRITING...</span>
                  </div>
                ) : (
                  <span>{t.library.btnSave}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};