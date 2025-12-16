import React, { useState } from 'react';
import { PromptModule, ModuleType } from '../types';
import { MODULE_COLORS } from '../constants';
import { Plus, Trash2, Edit2, Search, Copy, Check, Filter, X, MoreHorizontal, LayoutList, LayoutGrid, Image as ImageIcon, Link } from 'lucide-react';
import { Language, translations } from '../translations';

interface LibraryViewProps {
  modules: PromptModule[];
  setModules: React.Dispatch<React.SetStateAction<PromptModule[]>>;
  lang: Language;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ modules, setModules, lang }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<PromptModule | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const t = translations[lang];

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ModuleType>(ModuleType.ROLE);
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ModuleType | 'ALL'>('ALL');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const openModal = (module?: PromptModule) => {
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

  const handleSave = () => {
    if (!title.trim() || !content.trim()) return;

    const newModule: PromptModule = {
      id: editingModule ? editingModule.id : crypto.randomUUID(),
      title,
      description,
      content,
      type,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrl: imageUrl.trim(),
      createdAt: editingModule ? editingModule.createdAt : Date.now(),
    };

    if (editingModule) {
      setModules(prev => prev.map(m => m.id === editingModule.id ? newModule : m));
    } else {
      setModules(prev => [newModule, ...prev]);
    }
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

  return (
    <div className="h-full flex flex-col bg-slate-50/50 md:rounded-tl-xl md:border-l md:border-t md:border-slate-200 overflow-hidden">
      
      {/* Top Toolbar */}
      <div className="px-6 py-4 border-b border-slate-200 bg-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">{t.library.title}</h2>
          <p className="text-xs text-slate-500 mt-1">{modules.length} modules available</p>
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
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-50">
        
        {filteredModules.length === 0 ? (
           <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <Search size={48} className="mb-4 opacity-20" />
              <p>No modules found</p>
           </div>
        ) : viewMode === 'list' ? (
          // LIST VIEW: Enhanced with Thumbnails
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
             {filteredModules.map((module, index) => (
               <div key={module.id} className={`group flex items-start p-4 hover:bg-blue-50/50 transition-colors border-b border-slate-100 last:border-0 gap-4 cursor-pointer`} onClick={() => openModal(module)}>
                 {/* List Thumbnail */}
                 <div className="shrink-0 pt-1">
                    {module.imageUrl ? (
                       <img src={module.imageUrl} alt={module.title} className="w-12 h-12 rounded-md object-cover border border-slate-200 bg-slate-100 shadow-sm" />
                    ) : (
                       <div className={`w-12 h-12 rounded-md flex items-center justify-center border border-slate-100 ${MODULE_COLORS[module.type].replace('text-', 'text-opacity-50 text-').replace('border-', 'bg-opacity-20 bg-')}`}>
                          <ImageIcon size={20} className="opacity-40" />
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
                    {module.tags.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {module.tags.map(tag => (
                          <span key={tag} className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">#{tag}</span>
                        ))}
                      </div>
                    )}
                 </div>

                 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }}
                      className={`p-2 rounded-md border transition-all ${copiedId === module.id ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:text-blue-600 hover:border-blue-200'}`}
                      title="Copy"
                    >
                      {copiedId === module.id ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); openModal(module); }}
                      className="p-2 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-300 transition-all"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDelete(module.id); }}
                      className="p-2 rounded-md bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                 </div>
               </div>
             ))}
          </div>
        ) : (
          // GRID VIEW: Enhanced with Top Image Banner
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredModules.map(module => (
              <div key={module.id} className="prod-card flex flex-col h-72 hover:-translate-y-1 transition-transform cursor-pointer group overflow-hidden" onClick={() => openModal(module)}>
                 {/* Card Header / Image Area */}
                 {module.imageUrl ? (
                    <div className="h-32 w-full relative bg-slate-100 border-b border-slate-100">
                       <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                       <div className="absolute top-2 left-2">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm bg-white/90 backdrop-blur text-slate-800 border-none`}>
                               {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                           </span>
                       </div>
                       <button className="absolute top-2 right-2 text-white/80 hover:text-white"><MoreHorizontal size={16}/></button>
                    </div>
                 ) : (
                    <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-lg">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${MODULE_COLORS[module.type]}`}>
                           {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                       </span>
                       <button className="text-slate-400 hover:text-slate-600"><MoreHorizontal size={16}/></button>
                    </div>
                 )}
                 
                 <div className="p-4 flex-1 flex flex-col min-h-0 bg-white">
                    <h3 className="font-bold text-slate-800 text-sm mb-2 truncate" title={module.title}>{module.title}</h3>
                    <div className={`flex-1 rounded p-2 text-xs font-mono text-slate-500 overflow-hidden relative ${module.imageUrl ? 'bg-slate-50 border border-slate-100' : 'bg-slate-50'}`}>
                       <div className="absolute inset-0 p-2 overflow-hidden leading-relaxed">{module.content}</div>
                       <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-50 to-transparent"></div>
                    </div>
                 </div>
                 
                 <div className="px-3 pb-3 flex justify-between items-center bg-white rounded-b-lg">
                    <div className="flex gap-1 overflow-hidden">
                       {module.tags.slice(0, 2).map(t => <span key={t} className="text-[10px] text-slate-400 bg-slate-100 px-1 rounded">#{t}</span>)}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopy(module.content, module.id); }}
                      className={`text-xs font-medium px-2 py-1 rounded transition-colors flex items-center gap-1 ${copiedId === module.id ? 'text-emerald-600 bg-emerald-50' : 'text-slate-500 hover:bg-slate-100'}`}
                    >
                      {copiedId === module.id ? <Check size={12}/> : <Copy size={12}/>}
                      {copiedId === module.id ? t.library.copySuccess : 'Copy'}
                    </button>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit/Create Modal */}
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
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">{t.library.labelTitle}</label>
                  <input className="prod-input font-bold" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Senior React Dev" autoFocus/>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.library.labelType}</label>
                    <select className="prod-input" value={type} onChange={e => setType(e.target.value as ModuleType)}>
                      {Object.values(ModuleType).map(t => (
                        <option key={t} value={t}>{translations[lang].moduleType[t as keyof typeof translations['en']['moduleType']] || t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t.library.labelTags}</label>
                    <input className="prod-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, react, v1..." />
                  </div>
                </div>

                {/* Enhanced Image URL Input with Preview */}
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                      <ImageIcon size={14} /> {t.library.labelImage}
                   </label>
                   <div className="flex gap-3">
                      <div className="relative flex-1">
                          <input 
                            className="prod-input pl-8" 
                            value={imageUrl} 
                            onChange={e => setImageUrl(e.target.value)} 
                            placeholder="https://example.com/image.png" 
                          />
                          <Link size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                      {imageUrl && (
                          <div className="w-10 h-10 rounded border border-slate-200 bg-slate-50 shrink-0 overflow-hidden relative group">
                             <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                             <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-400 text-[8px] -z-10">Invalid</div>
                          </div>
                      )}
                   </div>
                   <p className="text-[10px] text-slate-400 mt-1 ml-1">Paste a direct image URL to display a thumbnail in the library.</p>
                </div>

                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">{t.library.labelContent}</label>
                   <textarea 
                     className="prod-input min-h-[200px] font-mono text-sm leading-relaxed" 
                     value={content} 
                     onChange={e => setContent(e.target.value)} 
                     placeholder="Enter your prompt content here..."
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
              <button onClick={handleSave} className="btn-primary px-8">
                {t.library.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};