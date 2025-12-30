
import React, { useState, useEffect, useRef } from 'react';
import { PromptModule, ModuleType, User } from '../types';
import {
  Plus, Trash2, Search, Copy, X,
  Box, ChevronLeft, ChevronRight, AlertCircle,
  Settings, Terminal, Tag, X as CloseIcon,
  ChevronsLeft, ChevronsRight, Maximize, ExternalLink,
  Image as ImageIcon, Minimize, MonitorPlay, Clock, Share2, Download
} from 'lucide-react';
import { Language, translations } from '../translations';
import { VersionHistoryModal } from './VersionHistoryModal';
import { versionService } from '../services/versionService';
import { ShareModal } from './ShareModal';
import { ImportModal } from './ImportModal';

interface LibraryViewProps {
  modules: PromptModule[];
  setModules: React.Dispatch<React.SetStateAction<PromptModule[]>>;
  lang: Language;
  syncStatus?: 'saved' | 'saving' | 'error';
  currentUser?: User;
}

const ITEMS_PER_PAGE = 12;

export const LibraryView: React.FC<LibraryViewProps> = ({ modules, setModules, lang, currentUser }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<PromptModule | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // New State for Lightbox
  const [viewingImage, setViewingImage] = useState<string | null>(null);

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

  // Immersive Mode State
  const [isImmersiveMode, setIsImmersiveMode] = useState(false);
  const [immersiveIndex, setImmersiveIndex] = useState(0);

  // 版本历史状态
  const [versionHistoryOpen, setVersionHistoryOpen] = useState(false);
  const [versionHistoryModuleId, setVersionHistoryModuleId] = useState<string | null>(null);
  const [changeSummary, setChangeSummary] = useState('');

  // 分享和导入状态
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [sharingModule, setSharingModule] = useState<PromptModule | null>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);

  useEffect(() => {
    if (isImmersiveMode) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowRight') handleNext();
        if (e.key === 'ArrowLeft') handlePrev();
        if (e.key === 'Escape') setIsImmersiveMode(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isImmersiveMode, immersiveIndex]);


  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  // Reset scroll to top when page changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentPage]);

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

    // 如果是编辑模式且用户已登录，创建版本记录
    if (editingModule && currentUser) {
      await versionService.createModuleVersion(
        editingModule.id,
        currentUser.id,
        newModule,
        changeSummary || undefined
      );
      setChangeSummary(''); // 重置修改说明
    }

    setIsSaving(false);
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm(t.library.deleteConfirm)) setModules(prev => prev.filter(m => m.id !== id));
  };

  const openVersionHistory = (moduleId: string) => {
    setVersionHistoryModuleId(moduleId);
    setVersionHistoryOpen(true);
  };

  const handleRestoreVersion = (version: PromptModule) => {
    setModules(prev => prev.map(m => m.id === version.id ? version : m));
  };

  const openShareModal = (module: PromptModule) => {
    setSharingModule(module);
    setShareModalOpen(true);
  };

  const handleImport = async (item: PromptModule, type: 'module' | 'template') => {
    if (type === 'module') {
      // 生成新ID避免冲突
      const newModule = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
      
      try {
        // 调用后端 API 保存到数据库
        const res = await fetch('/api/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newModule)
        });

        if (!res.ok) {
          throw new Error('Failed to save imported module');
        }

        // 更新本地状态
        setModules(prev => [newModule, ...prev]);
        
        console.log('Module imported and saved successfully:', newModule.id);
      } catch (error) {
        console.error('Failed to import module:', error);
        alert(lang === 'zh' ? '导入失败，请重试' : 'Import failed, please try again');
      }
    }
  };


  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleNext = () => {
    setImmersiveIndex(prev => (prev + 1) % filteredModules.length);
  };

  const handlePrev = () => {
    setImmersiveIndex(prev => (prev - 1 + filteredModules.length) % filteredModules.length);
  };

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
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === i
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
            <button
              onClick={() => {
                if (filteredModules.length > 0) {
                  setImmersiveIndex(0);
                  setIsImmersiveMode(true);
                }
              }}
              className="h-[48px] w-[48px] flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-all"
              title={t.library.enterImmersive}
            >
              <MonitorPlay size={20} />
            </button>
            <div className="flex gap-3">
              <button onClick={() => setImportModalOpen(true)} className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center gap-2 shadow-sm">
                <Download size={18} />
                <span>{t.library.importPrompt}</span>
              </button>
              <button onClick={() => openModal()} className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-blue-500/30">
                <Plus size={18} />
                <span>{t.library.createBtn}</span>
              </button>
            </div>
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
                      {currentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openVersionHistory(module.id);
                          }}
                          className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-yellow-600 hover:text-white transition-all"
                          title={t.library.versionHistory}
                        >
                          <Clock size={16} />
                        </button>
                      )}
                      {currentUser && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openShareModal(module);
                          }}
                          className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                          title={t.library.share}
                        >
                          <Share2 size={16} />
                        </button>
                      )}
                      {module.imageUrl && (
                        <button onClick={(e) => { e.stopPropagation(); setViewingImage(module.imageUrl!); }} className="p-2.5 bg-white/90 backdrop-blur text-slate-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all" title="View Original Image">
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
              {t.library.showing} {(currentPage - 1) * ITEMS_PER_PAGE + 1} {t.library.to} {Math.min(currentPage * ITEMS_PER_PAGE, filteredModules.length)} {t.library.of} {filteredModules.length}
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
              <h3 className="text-xl font-bold text-slate-900">{editingModule ? t.library.modalEdit : t.library.modalCreate}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900"><CloseIcon size={24} /></button>
            </div>

            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto">
              <div className="space-y-6">
                {formError && <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{formError}</div>}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.library.labelTitle}</label>
                  <input className="prod-input font-bold py-3 px-4" value={title} onChange={e => setTitle(e.target.value)} placeholder={t.library.placeholderTitle} />
                </div>

                {/* Improved Proportions for Type vs Tags - Fixed Layout Alignment */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="w-full sm:w-1/3 space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest truncate" title={t.library.labelType}>
                      {t.library.labelType}
                    </label>
                    <select className="prod-input font-bold py-3 px-4 h-[46px] w-full" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                      {Object.values(ModuleType).map(v => <option key={v} value={v}>{t.moduleType[v as keyof typeof t.moduleType] || v}</option>)}
                    </select>
                  </div>
                  <div className="w-full sm:w-2/3 space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest truncate" title={t.library.labelTags}>
                      {t.library.labelTags}
                    </label>
                    <input className="prod-input font-bold py-3 px-4 h-[46px] w-full" value={tags} onChange={e => setTags(e.target.value)} placeholder={t.library.placeholderTags} />
                  </div>
                </div>

                {/* Visual Asset with Inline Preview */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.library.labelImage}</label>
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0 shadow-inner flex items-center justify-center">
                      {imageUrl ? (
                        <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      ) : (
                        <ImageIcon size={16} className="text-slate-300" />
                      )}
                    </div>
                    <input className="prod-input font-mono text-xs py-3 px-4 flex-1" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder={t.library.placeholderImage} />
                  </div>
                </div>
              </div>
              <div className="space-y-2 flex flex-col">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.library.labelContent}</label>
                <textarea className="flex-1 min-h-[250px] bg-slate-50 border border-slate-200 rounded-3xl p-6 font-mono text-xs leading-relaxed outline-none focus:border-blue-500" value={content} onChange={e => setContent(e.target.value)} placeholder={t.library.placeholderContent} />
              </div>

              {/* 修改说明 (仅编辑模式显示) */}
              {editingModule && currentUser && (
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {t.library.changeDescription}
                  </label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs outline-none focus:border-blue-500"
                    value={changeSummary}
                    onChange={e => setChangeSummary(e.target.value)}
                    placeholder={t.library.changeDescPlaceholder}
                  />
                </div>
              )}
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button onClick={() => setIsModalOpen(false)} className="px-8 py-3 rounded-xl font-bold text-xs text-slate-400 hover:text-slate-900 uppercase tracking-widest">{t.library.btnCancel}</button>
              <button onClick={handleSave} disabled={isSaving} className="px-12 py-3 bg-slate-900 rounded-xl text-white font-bold text-xs uppercase shadow-xl tracking-widest transition-transform active:scale-95">
                {isSaving ? t.library.saving : t.library.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {viewingImage && (
        <div className="fixed inset-0 z-[200] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200" onClick={() => setViewingImage(null)}>
          <button className="absolute top-6 right-6 p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all" onClick={() => setViewingImage(null)}>
            <X size={24} />
          </button>
          <img
            src={viewingImage}
            alt="Original"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Immersive Mode Overlay */}
      {isImmersiveMode && filteredModules.length > 0 && (
        <div className="fixed inset-0 z-[200] bg-[#020617] text-white flex flex-col animate-in fade-in duration-300">

          {/* Top Bar */}
          <div className="shrink-0 h-20 px-8 flex items-center justify-between z-20">
            <div className="flex items-center gap-3 opacity-60">
              <Box size={20} />
              <span className="text-xs font-bold tracking-[0.2em] uppercase">{t.library.immersiveMode}</span>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-xs font-mono opacity-40">{immersiveIndex + 1} / {filteredModules.length}</span>
              <button onClick={() => setIsImmersiveMode(false)} className="p-2 hover:bg-white/10 rounded-full transition-all">
                <Minimize size={24} className="opacity-60 hover:opacity-100" />
              </button>
            </div>
          </div>

          {/* Main Stage */}
          <div className="flex-1 overflow-hidden relative flex items-center justify-center">

            {/* Navigation Controls (Left) */}
            <button onClick={handlePrev} className="absolute left-8 z-10 p-4 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white/40 hover:text-white/90 transition-all group">
              <ChevronLeft size={40} className="group-active:-translate-x-1 transition-transform" />
            </button>

            {/* Navigation Controls (Right) */}
            <button onClick={handleNext} className="absolute right-8 z-10 p-4 rounded-full bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white/40 hover:text-white/90 transition-all group">
              <ChevronRight size={40} className="group-active:translate-x-1 transition-transform" />
            </button>

            {/* Content Card */}
            <div className="w-[85%] max-w-[1200px] h-[80%] bg-[#0f172a] rounded-[3rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/5 flex flex-col lg:flex-row relative">

              {/* Visual Side (Left/Top) */}
              {filteredModules[immersiveIndex].imageUrl ? (
                <div className="lg:w-1/2 h-[40%] lg:h-full relative bg-black/40 border-b lg:border-b-0 lg:border-r border-white/5 group">
                  <img
                    src={filteredModules[immersiveIndex].imageUrl}
                    alt="Visual"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] ease-linear hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#0f172a]/80"></div>
                  <button
                    onClick={() => setViewingImage(filteredModules[immersiveIndex].imageUrl || null)}
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
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-lg ${getTypeStyles(filteredModules[immersiveIndex].type).badge}`}>
                      {t.moduleType[filteredModules[immersiveIndex].type as keyof typeof t.moduleType] || filteredModules[immersiveIndex].type}
                    </span>
                    {filteredModules[immersiveIndex].tags.map(tag => (
                      <span key={tag} className="text-[10px] font-bold text-slate-400 bg-white/5 px-3 py-1 rounded-lg border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
                    {filteredModules[immersiveIndex].title}
                  </h2>

                  {filteredModules[immersiveIndex].description && (
                    <p className="text-white/50 text-base leading-relaxed">
                      {filteredModules[immersiveIndex].description}
                    </p>
                  )}

                  <div className="h-px bg-white/5 w-full my-6"></div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-black tracking-widest uppercase text-blue-400/80 mb-2">
                      <span>{t.library.labelContent}</span>
                      <button
                        onClick={() => navigator.clipboard.writeText(filteredModules[immersiveIndex].content)}
                        className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
                      >
                        <Copy size={12} /> {t.builder.copy}
                      </button>
                    </div>
                    <div className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap bg-black/20 p-6 rounded-2xl border border-white/5 selection:bg-blue-500/30">
                      {filteredModules[immersiveIndex].content}
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
      )}

      {/* 版本历史模态框 */}
      {versionHistoryOpen && versionHistoryModuleId && currentUser && (
        <VersionHistoryModal
          isOpen={versionHistoryOpen}
          onClose={() => setVersionHistoryOpen(false)}
          itemId={versionHistoryModuleId}
          itemType="module"
          userId={currentUser.id}
          onRestore={handleRestoreVersion}
          lang={lang}
        />
      )}

      {/* 分享模态框 */}
      {shareModalOpen && sharingModule && currentUser && (
        <ShareModal
          isOpen={shareModalOpen}
          onClose={() => {
            setShareModalOpen(false);
            setSharingModule(null);
          }}
          item={sharingModule}
          itemType="module"
          currentUser={currentUser}
          lang={lang}
        />
      )}

      {/* 导入模态框 */}
      {importModalOpen && (
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleImport}
          lang={lang}
        />
      )}
    </div>
  );
};
