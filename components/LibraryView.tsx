import React, { useState } from 'react';
import { PromptModule, ModuleType } from '../types';
import { MODULE_COLORS } from '../constants';
import { Plus, Trash2, Edit2, Search, Tag, Image as ImageIcon, Copy, Check, Filter, Database, Box, X } from 'lucide-react';
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
    <div className="h-full flex flex-col p-6 md:p-10 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
             <Database className="text-cyber-primary" size={20}/>
             <h2 className="text-3xl font-bold text-white tracking-widest text-glow">DATA_LIBRARY</h2>
          </div>
          <p className="text-cyber-primary/60 text-xs tracking-[0.2em] uppercase pl-7">{t.library.subtitle}</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="btn-primary px-6 py-2 flex items-center gap-2 text-sm"
        >
          <Plus size={16} />
          <span>{t.library.createBtn}</span>
        </button>
      </div>

      {/* Search & Filter - Tech Bar */}
      <div className="hud-panel p-2 flex flex-col md:flex-row gap-2 mb-8 items-center rounded-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cyber-primary/50" size={16} />
          <input 
            type="text" 
            placeholder={t.library.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none pl-10 pr-4 py-2 text-cyber-text text-sm placeholder-gray-700 tracking-wide font-bold"
          />
        </div>
        <div className="w-px h-6 bg-cyber-primary/20 hidden md:block mx-2"></div>
        <div className="flex items-center gap-2 w-full md:w-auto px-2">
            <Filter size={14} className="text-cyber-primary"/>
            <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-transparent border-none outline-none text-cyber-primary text-xs font-bold tracking-widest uppercase cursor-pointer w-full"
            >
            <option value="ALL" className="bg-[#0a0f16]">TYPE: ALL</option>
            {Object.values(ModuleType).map(t => <option key={t} value={t} className="bg-[#0a0f16]">TYPE: {t}</option>)}
            </select>
        </div>
      </div>

      {/* Grid - Holographic Data Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20 pr-2 custom-scrollbar">
        {filteredModules.map(module => (
          <div key={module.id} className="cyber-card group flex flex-col h-[280px] rounded-lg relative">
             
             {/* Image Background Layer */}
             {module.imageUrl ? (
               <div className="absolute inset-0 z-0">
                  <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity grayscale group-hover:grayscale-0 duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e1520] via-[#0e1520]/80 to-transparent"></div>
               </div>
             ) : (
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_top_right,rgba(0,240,255,0.05),transparent_70%)]"></div>
             )}

             {/* Content Layer */}
             <div className="relative z-10 p-5 flex flex-col h-full">
                {/* Header */}
                <div className="flex justify-between items-start mb-2">
                    <span className={`text-[9px] px-2 py-0.5 border font-bold tracking-widest uppercase bg-black/50 backdrop-blur-sm ${MODULE_COLORS[module.type]}`}>
                        {module.type}
                    </span>
                    {/* Actions overlaid */}
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 rounded px-1 backdrop-blur-sm">
                         <button onClick={() => handleCopy(module.content, module.id)} className="p-1.5 text-cyber-primary hover:text-white">
                             {copiedId === module.id ? <Check size={14} /> : <Copy size={14} />}
                         </button>
                         <button onClick={() => openModal(module)} className="p-1.5 text-gray-400 hover:text-cyber-primary"><Edit2 size={14} /></button>
                         <button onClick={() => handleDelete(module.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col justify-end group-hover:justify-start transition-all duration-500">
                    <h3 className="font-bold text-white text-lg tracking-tight mb-1 text-shadow leading-tight group-hover:mb-4">{module.title}</h3>
                    
                    <div className="max-h-0 overflow-hidden group-hover:max-h-40 transition-all duration-500 delay-75">
                         <p className="text-xs text-gray-400 mb-2 line-clamp-2">{module.description || "No description provided."}</p>
                         <div className="bg-black/50 border border-cyber-primary/20 p-2 rounded text-[10px] text-cyber-text font-mono line-clamp-3">
                             {module.content}
                         </div>
                    </div>
                </div>

                {/* Footer Tags */}
                <div className="mt-4 flex flex-wrap gap-1">
                   {module.tags.map((tag, i) => (
                      <span key={i} className="text-[9px] text-cyber-primary/70 flex items-center gap-1 bg-cyber-primary/5 px-1.5 py-0.5 rounded border border-cyber-primary/10">
                         #{tag}
                      </span>
                   ))}
                </div>
             </div>

             {/* Decorative Corner */}
             <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyber-primary/50 z-20"></div>
          </div>
        ))}
      </div>

      {/* Modal - Tech Interface */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="hud-panel hud-corners w-full max-w-2xl p-8 rounded-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6 border-b border-cyber-primary/20 pb-4">
               <h3 className="text-xl font-bold text-cyber-primary tracking-widest flex items-center gap-3">
                  <Box size={20} />
                  {editingModule ? 'EDIT_MODULE_DATA' : 'INIT_NEW_MODULE'}
               </h3>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-cyber-primary"><X/></button>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelTitle}</label>
                  <input 
                    className="w-full cyber-input px-3 py-2 text-sm"
                    value={title} onChange={e => setTitle(e.target.value)} placeholder={t.library.placeholderTitle}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelType}</label>
                  <select 
                    className="w-full cyber-input px-3 py-2 text-sm"
                    value={type} onChange={e => setType(e.target.value as ModuleType)}
                  >
                    {Object.values(ModuleType).map(t => <option key={t} value={t} className="bg-[#0a0f16]">{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelDesc}</label>
                <input 
                  className="w-full cyber-input px-3 py-2 text-sm"
                  value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelContent}</label>
                <div className="relative">
                  <textarea 
                    className="w-full cyber-input p-4 text-xs h-40 font-mono leading-relaxed"
                    value={content} onChange={e => setContent(e.target.value)} placeholder={t.library.placeholderContent}
                  />
                  <div className="absolute top-0 right-0 p-1 text-[9px] text-cyber-primary bg-black/50 border-l border-b border-cyber-primary/20">RAW_DATA</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelTags}</label>
                    <input 
                      className="w-full cyber-input px-3 py-2 text-sm"
                      value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-cyber-primary/70 uppercase tracking-widest">{t.library.labelImage}</label>
                    <div className="relative">
                      <input 
                        className="w-full cyber-input px-3 py-2 text-sm pl-9"
                        value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                      />
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14}/>
                    </div>
                  </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-cyber-primary/20">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-500 hover:text-white transition-colors text-xs font-bold tracking-widest uppercase">ABORT</button>
              <button onClick={handleSave} className="btn-primary px-8 py-2 text-xs">
                CONFIRM_WRITE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};