import React, { useState } from 'react';
import { PromptModule, ModuleType } from '../types';
import { MODULE_COLORS } from '../constants';
import { Plus, Trash2, Edit2, Search, Tag, Image as ImageIcon, Copy, Check, ExternalLink, FileText } from 'lucide-react';
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
    <div className="h-full flex flex-col p-6 md:p-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">{t.library.title}</h2>
          <p className="text-zinc-500 text-sm mt-1">{t.library.subtitle}</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-black px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl shadow-white/5 text-sm"
        >
          <Plus size={18} />
          <span>{t.library.createBtn}</span>
        </button>
      </div>

      {/* Filters Bar - Glass */}
      <div className="glass-panel rounded-xl p-2 flex flex-col md:flex-row gap-2 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text" 
            placeholder={t.library.searchPlaceholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent border-none outline-none pl-10 pr-4 py-2 text-zinc-200 text-sm placeholder-zinc-600"
          />
        </div>
        <div className="w-px bg-white/10 hidden md:block my-1"></div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-transparent border-none outline-none px-4 py-2 text-zinc-400 text-sm hover:text-zinc-200 cursor-pointer"
        >
          <option value="ALL" className="bg-zinc-900">{t.library.allTypes}</option>
          {Object.values(ModuleType).map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-20 pr-2">
        {filteredModules.map(module => (
          <div key={module.id} className="glass-card rounded-2xl p-5 group relative flex flex-col h-full hover:-translate-y-1">
             <div className="flex justify-between items-start mb-4">
               <span className={`text-[10px] px-2 py-1 rounded-md border font-mono font-bold tracking-wide ${MODULE_COLORS[module.type]}`}>
                 {module.type}
               </span>
               <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                    onClick={() => handleCopy(module.content, module.id)} 
                    className={`p-1.5 rounded-lg transition-colors ${copiedId === module.id ? 'bg-green-500/20 text-green-400' : 'hover:bg-zinc-800 text-zinc-400'}`}
                 >
                    {copiedId === module.id ? <Check size={14} /> : <Copy size={14} />}
                 </button>
                 <button onClick={() => openModal(module)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-banana-400"><Edit2 size={14} /></button>
                 <button onClick={() => handleDelete(module.id)} className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-red-400"><Trash2 size={14} /></button>
               </div>
             </div>

             {module.imageUrl && (
               <div className="mb-4 rounded-xl overflow-hidden border border-white/5 aspect-video bg-black/50 relative group-hover:shadow-lg transition-all">
                 <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
               </div>
             )}

             <h3 className="font-bold text-zinc-100 mb-2 truncate text-base">{module.title}</h3>
             
             {module.description && (
                <p className="text-xs text-zinc-500 mb-4 line-clamp-2 leading-relaxed h-8">
                  {module.description}
                </p>
             )}

             <div className="bg-black/30 border border-white/5 rounded-lg p-3 mb-4 flex-1 overflow-hidden relative group-hover:border-white/10 transition-colors">
               <div className="text-zinc-400 text-xs font-mono line-clamp-4 leading-relaxed opacity-80 select-all">
                 {module.content}
               </div>
               <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
             </div>
             
             <div className="flex flex-wrap gap-2 mt-auto">
               {module.tags.map((tag, i) => (
                 <span key={i} className="text-[10px] text-zinc-500 flex items-center gap-1 bg-white/5 px-2 py-1 rounded-md border border-white/5">
                   <Tag size={8} /> {tag}
                 </span>
               ))}
             </div>
          </div>
        ))}
      </div>

      {/* Modal - Modernized */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-2xl p-8 rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto border border-white/10">
            <h3 className="text-2xl font-bold text-zinc-100 mb-6 flex items-center gap-3">
              <div className="p-2 bg-banana-500/10 rounded-lg text-banana-500 border border-banana-500/20">
                 {editingModule ? <Edit2 size={20}/> : <Plus size={20}/>}
              </div>
              {editingModule ? t.library.modalEdit : t.library.modalCreate}
            </h3>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.library.labelTitle}</label>
                  <input 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-zinc-200 focus:border-banana-500/50 outline-none transition-colors text-sm"
                    value={title} onChange={e => setTitle(e.target.value)} placeholder={t.library.placeholderTitle}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.library.labelType}</label>
                  <select 
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-zinc-200 focus:border-banana-500/50 outline-none transition-colors text-sm"
                    value={type} onChange={e => setType(e.target.value as ModuleType)}
                  >
                    {Object.values(ModuleType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.library.labelContent}</label>
                <textarea 
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-300 font-mono text-sm h-40 focus:border-banana-500/50 outline-none resize-none transition-colors leading-relaxed"
                  value={content} onChange={e => setContent(e.target.value)} placeholder={t.library.placeholderContent}
                />
              </div>

              {/* Advanced toggle or condensed section could go here, keeping it simple for now */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.library.labelTags}</label>
                    <input 
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-zinc-200 focus:border-banana-500/50 outline-none transition-colors text-sm"
                      value={tags} onChange={e => setTags(e.target.value)} placeholder="tag1, tag2..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t.library.labelImage}</label>
                    <div className="relative">
                      <input 
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-zinc-200 focus:border-banana-500/50 outline-none transition-colors text-sm pl-10"
                        value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://..."
                      />
                      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" size={16}/>
                    </div>
                  </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-white/5">
              <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-zinc-400 hover:text-white transition-colors text-sm font-medium">{t.library.btnCancel}</button>
              <button onClick={handleSave} className="px-6 py-2.5 bg-zinc-100 hover:bg-white text-black font-bold rounded-xl transition-all text-sm shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                {t.library.btnSave}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};