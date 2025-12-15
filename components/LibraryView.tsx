import React, { useState } from 'react';
import { PromptModule, ModuleType } from '../types';
import { MODULE_COLORS } from '../constants';
import { Plus, Trash2, Edit2, Search, Image as ImageIcon, Copy, Check, Filter, Box, X } from 'lucide-react';
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
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredModules = modules.filter(m => {
    const matchesSearch = m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="h-full flex flex-col p-6 font-mono overflow-hidden">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6 shrink-0">
        <div className="relative">
          <h2 className="text-4xl font-bold text-white tracking-tighter flex items-center gap-3">
             <span className="text-cyber-primary opacity-50 text-2xl">/</span> {t.library.title.toUpperCase()}
          </h2>
          <div className="absolute -bottom-2 left-0 w-1/3 h-0.5 bg-cyber-primary shadow-[0_0_10px_#22d3ee]"></div>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
           {/* Search Bar */}
           <div className="relative group flex-1 md:w-64">
              <input 
                type="text" 
                placeholder={t.library.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/50 border-b border-white/20 px-0 py-2 pl-8 text-sm focus:border-cyber-primary outline-none transition-colors text-white placeholder-slate-500"
              />
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyber-primary transition-colors" size={16} />
           </div>

           <button 
             onClick={() => openModal()}
             className="btn-tech text-xs flex items-center gap-2 shadow-lg"
           >
             <Plus size={16} /> <span className="hidden sm:inline">{t.library.createBtn}</span>
           </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2 shrink-0 custom-scrollbar items-center">
        <Filter size={14} className="text-slate-500 mr-2 shrink-0" />
        <button 
          onClick={() => setFilterType('ALL')}
          className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border border-transparent clip-tech ${filterType === 'ALL' ? 'text-slate-900 bg-cyber-primary' : 'text-slate-400 bg-white/5 hover:text-white hover:bg-white/10'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(type => (
           <button 
             key={type}
             onClick={() => setFilterType(type)}
             className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider transition-all border border-transparent whitespace-nowrap clip-tech ${filterType === type ? 'text-slate-900 bg-cyber-primary' : 'text-slate-400 bg-white/5 hover:text-white hover:bg-white/10'}`}
           >
             {/* Use type assertion to map the enum value (string) to the translation key */}
             {t.moduleType[type as keyof typeof t.moduleType] || type}
           </button>
        ))}
      </div>

      {/* Grid - High Tech Image Focus */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20 pr-2 custom-scrollbar">
        {filteredModules.map(module => (
          <div key={module.id} className="group relative bg-slate-800/80 hover:bg-slate-700/80 transition-colors clip-tech shadow-lg hover:shadow-cyber-primary/10 flex flex-col h-[340px] border border-white/5 hover:border-cyber-primary/30">
             
             {/* Top: Image / Visual Area (65%) */}
             <div className="h-[65%] relative overflow-hidden bg-slate-900/50 w-full group">
                {module.imageUrl ? (
                  <img 
                    src={module.imageUrl} 
                    alt={module.title} 
                    className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 ease-out" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800">
                     {/* Generative Tech Pattern */}
                     <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,211,238,0.03)_25%,rgba(34,211,238,0.03)_50%,transparent_50%,transparent_75%,rgba(34,211,238,0.03)_75%,rgba(34,211,238,0.03)_100%)] bg-[length:20px_20px]"></div>
                     <Box size={40} className="text-slate-700 mb-2 group-hover:text-cyber-primary/50 transition-colors duration-500" strokeWidth={1} />
                     <span className="text-[10px] text-slate-600 font-mono tracking-[0.2em] group-hover:text-cyber-primary/40">{t.library.noVisualData}</span>
                  </div>
                )}
                
                {/* Overlay Type Tag */}
                <div className="absolute top-0 left-0 p-0">
                   <span className={`text-[10px] font-bold px-3 py-1 bg-slate-900/90 backdrop-blur-md border-b border-r border-white/10 text-white clip-tech-alt block shadow-lg`}>
                      {t.moduleType[module.type as keyof typeof t.moduleType] || module.type}
                   </span>
                </div>

                {/* Hover Actions Overlay */}
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                   <button onClick={() => handleCopy(module.content, module.id)} className="p-3 rounded-none bg-white/10 hover:bg-cyber-primary hover:text-black text-white transition-all border border-white/20 clip-tech backdrop-blur">
                      {copiedId === module.id ? <Check size={20} /> : <Copy size={20} />}
                   </button>
                   <button onClick={() => openModal(module)} className="p-3 rounded-none bg-white/10 hover:bg-white hover:text-black text-white transition-all border border-white/20 clip-tech backdrop-blur">
                      <Edit2 size={20} />
                   </button>
                   <button onClick={() => handleDelete(module.id)} className="p-3 rounded-none bg-white/10 hover:bg-red-500 hover:text-white text-white transition-all border border-white/20 clip-tech backdrop-blur">
                      <Trash2 size={20} />
                   </button>
                </div>
             </div>

             {/* Bottom: Info Area (35%) */}
             <div className="h-[35%] p-4 flex flex-col justify-between border-t border-white/5 relative bg-slate-800/50">
                <div>
                   <h3 className="text-base font-bold text-white leading-tight mb-2 truncate group-hover:text-cyber-primary transition-colors">{module.title}</h3>
                   <div className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed h-8 font-sans">
                     {module.description || module.content.substring(0, 60)}
                   </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                   <div className="flex gap-1 overflow-hidden">
                      {module.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[9px] text-slate-400 bg-white/5 px-1.5 py-0.5 border border-white/5">#{tag}</span>
                      ))}
                   </div>
                   {/* Status Dot */}
                   <div className="w-1.5 h-1.5 bg-slate-600 group-hover:bg-cyber-primary transition-colors shadow-[0_0_5px_rgba(34,211,238,0.5)]"></div>
                </div>

                {/* Tech Corner Decoration */}
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20 group-hover:border-cyber-primary/80 transition-colors"></div>
             </div>
          </div>
        ))}
      </div>

      {/* Modal - Tech Interface */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-white/10 w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto clip-tech relative shadow-2xl border-t border-cyber-primary/30">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
               <h3 className="text-xl font-bold text-white tracking-widest flex items-center gap-3">
                  <Box size={20} className="text-cyber-primary"/>
                  {editingModule ? t.library.modalEdit : t.library.modalCreate}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-cyber-primary transition-colors"><X size={24}/></button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelTitle}</label>
                  <input 
                    className="w-full cyber-input"
                    value={title} onChange={e => setTitle(e.target.value)} placeholder={t.library.placeholderTitle}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelType}</label>
                  <select 
                    className="w-full cyber-input bg-slate-900"
                    value={type} onChange={e => setType(e.target.value as ModuleType)}
                  >
                    {Object.values(ModuleType).map(t => (
                      <option key={t} value={t}>
                        {/* Map enum values in dropdown as well */}
                        {translations[lang].moduleType[t as keyof typeof translations['en']['moduleType']] || t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelDesc}</label>
                <input 
                  className="w-full cyber-input"
                  value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelContent}</label>
                <div className="relative group">
                  <textarea 
                    className="w-full cyber-input h-40 resize-none bg-slate-950/50 border border-white/10 focus:border-cyber-primary transition-colors leading-relaxed p-4 font-mono text-xs"
                    value={content} onChange={e => setContent(e.target.value)} placeholder={t.library.placeholderContent}
                  />
                  <div className="absolute top-0 right-0 p-1 bg-cyber-primary/10 text-cyber-primary text-[9px] font-bold opacity-50 group-hover:opacity-100">{t.library.rawInput}</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelTags}</label>
                    <input 
                      className="w-full cyber-input"
                      value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelImage}</label>
                    <div className="relative">
                      <input 
                        className="w-full cyber-input pl-9"
                        value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                      />
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14}/>
                    </div>
                  </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-white/5">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-slate-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase hover:underline decoration-cyber-primary decoration-2 underline-offset-4">{t.library.btnCancel}</button>
              <button onClick={handleSave} className="btn-tech text-xs shadow-lg">
                {t.library.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};