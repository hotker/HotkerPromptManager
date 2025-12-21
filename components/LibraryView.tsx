import React, { useState, useEffect, useRef } from 'react';
import { PromptModule, ModuleType } from '../types';
import { MODULE_COLORS } from '../constants';
import { 
  Plus, Trash2, Edit2, Search, Copy, Check, Filter, X, 
  LayoutList, LayoutGrid, Image as ImageIcon, Link, 
  User, FileText, CheckSquare, Shield, Layout, MessageSquare, Box, ExternalLink,
  ChevronLeft, ChevronRight, MoreHorizontal, AlertCircle
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
        case ModuleType.ROLE: return { bg: 'bg-gradient-to-br from-blue-50/80 to-slate-50', icon: 'text-blue-500', badge: 'bg-blue-50 text-blue-700 border-blue-100' };
        case ModuleType.CONTEXT: return { bg: 'bg-gradient-to-br from-purple-50/80 to-slate-50', icon: 'text-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-100' };
        case ModuleType.TASK: return { bg: 'bg-gradient-to-br from-emerald-50/80 to-slate-50', icon: 'text-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-100' };
        case ModuleType.CONSTRAINT: return { bg: 'bg-gradient-to-br from-rose-50/80 to-slate-50', icon: 'text-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-100' };
        case ModuleType.FORMAT: return { bg: 'bg-gradient-to-br from-orange-50/80 to-slate-50', icon: 'text-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-100' };
        case ModuleType.TONE: return { bg: 'bg-gradient-to-br from-pink-50/80 to-slate-50', icon: 'text-pink-500', badge: 'bg-pink-50 text-pink-700 border-pink-100' };
        default: return { bg: 'bg-gradient-to-br from-slate-100 to-slate-50', icon: 'text-slate-500', badge: 'bg-slate-100 text-slate-700 border-slate-200' };
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

    // 更新本地状态
    setModules(prev => {
      if (editingModule) {
        return prev.map(m => m.id === editingModule.id ? newModule : m);
      }
      return [newModule, ...prev];
    });

    // 如果是新增，清空过滤器以确保新模块可见
    if (!editingModule) {
      setSearchTerm('');
      setFilterType('ALL');
      setCurrentPage(1);
    }

    // 模拟轻微延迟以提供视觉反馈
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
    <div className="h-full flex flex-col bg-slate-50/50 md:rounded-tl-xl md:border-l md:border-t md:border-slate-200 overflow-hidden">
      
      {/* Top Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.library.title}</h2>
          <p className="text-xs text-slate-500 mt-1">{modules.length} {t.library.modulesAvailable}</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative group flex-1 md:w-64">
              <input 
                type="text" 
                placeholder={t.library.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pl-9 text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500">
                  <X size={14} />
                </button>
              )}
           </div>

           <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50 gap-1">
             <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutList size={16}/></button>
             <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={16}/></button>
           </div>

           <button onClick={() => openModal()} className="btn-primary whitespace-nowrap">
             <Plus size={16} /> <span className="hidden sm:inline">{t.library.createBtn}</span>
           </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="px-6 py-3 border-b border-slate-200 bg-white flex items-center gap-2 overflow-x-auto custom-scrollbar">
        <Filter size={14} className="text-slate-400 shrink-0 mr-2" />
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${filterType === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(type => (
           <button 
             key={type}
             onClick={() => setFilterType(type)}
             className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${filterType === type ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
           >
             {t.moduleType[type as keyof typeof t.moduleType] || type}
           </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50" ref={scrollContainerRef}>
        {paginatedModules.length === 0 ? (
           <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Box size={48} className="mb-4 opacity-20" />
              <p>{t.library.noModulesFound}</p>
              {searchTerm && <button onClick={() => setSearchTerm('')} className="mt-2 text-blue-600 text-sm hover:underline">清除搜索</button>}
           </div>
        ) : viewMode === 'list' ? (
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
             {paginatedModules.map((module) => (
               <div key={module.id} className={`group flex items-start p-4 hover:bg-blue-50/50 transition-colors border-b border-slate-100 last:border-0 gap-4 cursor-pointer`} onClick={() => openModal(module)}>
                 <div className="shrink-0 pt-1">
                    {module.imageUrl ? (
                       <img src={module.imageUrl} alt={module.title} className="w-12 h-12 rounded-md object-cover border border-slate-200 bg-slate-100 shadow-sm" />
                    ) : (
                       <div className={`w-12 h-12 rounded-md flex items-center justify-center border border-slate-100 ${MODULE_COLORS[module.type].replace('text-', 'text-opacity-50 text-').replace('border-', 'bg-opacity-20 bg-')}`}>
                          {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 18, className: 'opacity-50' })}
                       </div>
                    )}
                 </div>
                 
                 <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">{module.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${MODULE_COLORS[module.type]}`}>
                        {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-mono line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded border border-slate-100 group-hover:bg-white group-hover:border-blue-100 transition-colors">
                      {module.content}
                    </p>
                 </div>

                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }}
                      className={`p-2 rounded-md border transition-all ${copiedId === module.id ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:text-blue-600 hover:border-blue-200'}`}
                    >
                      {copiedId === module.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openModal(module); }}
                      className="p-2 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }}
                      className="p-2 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedModules.map(module => {
              const typeStyle = getTypeStyles(module.type);
              return (
              <div key={module.id} className="group relative bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col h-[320px]" onClick={() => openModal(module)}>
                 <div className={`relative h-[40%] shrink-0 overflow-hidden border-b border-slate-50 ${!module.imageUrl ? typeStyle.bg : 'bg-slate-100'}`}>
                    {module.imageUrl ? (
                       <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    ) : (
                       <div className="w-full h-full p-5 flex justify-between items-start">
                          <div className="w-10 h-10 rounded-lg bg-white/60 backdrop-blur-sm border border-white/50 shadow-sm flex items-center justify-center">
                             {React.cloneElement(getModuleIcon(module.type) as React.ReactElement<any>, { size: 20, className: typeStyle.icon, strokeWidth: 1.5 })}
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-md border ${typeStyle.badge} bg-white/50 backdrop-blur-sm shadow-sm`}>
                             {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                          </span>
                       </div>
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 z-20">
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }}
                          className="p-2 rounded-full bg-white text-slate-700 hover:text-blue-600 hover:scale-110 transition-all shadow-lg"
                        >
                          {copiedId === module.id ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); openModal(module); }}
                          className="p-2 rounded-full bg-white text-slate-700 hover:text-blue-600 hover:scale-110 transition-all shadow-lg"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }}
                          className="p-2 rounded-full bg-white text-slate-700 hover:text-red-600 hover:scale-110 transition-all shadow-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                 </div>
                 
                 <div className="flex-1 p-4 flex flex-col min-h-0 bg-white relative">
                    <h3 className="font-bold text-slate-800 text-sm truncate mb-2">{module.title}</h3>
                    <div className="flex-1 relative overflow-hidden min-h-0">
                       <p className="text-xs text-slate-500 font-mono leading-relaxed line-clamp-5">
                         {module.content}
                       </p>
                    </div>
                    {module.tags.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 h-6 overflow-hidden">
                             {module.tags.map(tag => (
                                 <span key={tag} className="text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded whitespace-nowrap">
                                    #{tag}
                                 </span>
                             ))}
                        </div>
                    )}
                 </div>
              </div>
            )})}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="font-bold text-slate-900 text-lg">
                  {editingModule ? t.library.modalEdit : t.library.modalCreate}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded-md"><X size={20}/></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-xs flex items-center gap-2">
                  <AlertCircle size={14} /> {formError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.library.labelTitle} <span className="text-red-500">*</span></label>
                  <input className={`prod-input font-bold ${!title && formError ? 'border-red-300 ring-red-50' : ''}`} value={title} onChange={e => setTitle(e.target.value)} placeholder={t.library.placeholderTitle} autoFocus/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.library.labelType}</label>
                    <select className="prod-input" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                      {Object.values(ModuleType).map(t_val => (
                        <option key={t_val} value={t_val}>{translations[lang].moduleType[t_val as keyof typeof translations['en']['moduleType']] || t_val}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.library.labelTags}</label>
                    <input className="prod-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, react, v1..." />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <ImageIcon size={14} /> {t.library.labelImage}
                   </label>
                   <input 
                      className="prod-input" 
                      value={imageUrl} 
                      onChange={e => setImageUrl(e.target.value)} 
                      placeholder="https://example.com/image.png" 
                    />
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t.library.labelContent} <span className="text-red-500">*</span></label>
                   <textarea 
                     className={`prod-input min-h-[200px] font-mono text-sm leading-relaxed ${!content && formError ? 'border-red-300 ring-red-50' : ''}`} 
                     value={content} 
                     onChange={e => setContent(e.target.value)} 
                     placeholder={t.library.placeholderContent}
                   />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.library.labelDesc}</label>
                  <input className="prod-input" value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional context notes" />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="btn-secondary">{t.library.btnCancel}</button>
              <button onClick={handleSave} disabled={isSaving} className="btn-primary px-8 relative">
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>保存中...</span>
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