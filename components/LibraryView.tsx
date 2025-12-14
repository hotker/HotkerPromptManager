import React, { useState } from 'react';
import { PromptModule, ModuleType } from '../types';
import { MODULE_COLORS } from '../constants';
import { Plus, Trash2, Edit2, Search, Tag, Image as ImageIcon, Copy, Check, ExternalLink } from 'lucide-react';

interface LibraryViewProps {
  modules: PromptModule[];
  setModules: React.Dispatch<React.SetStateAction<PromptModule[]>>;
}

export const LibraryView: React.FC<LibraryViewProps> = ({ modules, setModules }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<PromptModule | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<ModuleType>(ModuleType.ROLE);
  const [tags, setTags] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<ModuleType | '全部'>('全部');

  const openModal = (module?: PromptModule) => {
    if (module) {
      setEditingModule(module);
      setTitle(module.title);
      setContent(module.content);
      setType(module.type);
      setTags(module.tags.join(', '));
      setImageUrl(module.imageUrl || '');
    } else {
      setEditingModule(null);
      setTitle('');
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
    if (confirm('确定要删除此模块吗？')) {
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
                          m.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === '全部' || m.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="h-full flex flex-col p-6 bg-zinc-950">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-zinc-100">模块库</h2>
          <p className="text-zinc-400 text-sm mt-1">管理可复用的提示词片段 (Nano Banana 积木)</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-banana-500 hover:bg-banana-400 text-zinc-950 px-4 py-2 rounded-lg font-semibold transition-colors"
        >
          <Plus size={18} />
          创建模块
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="搜索模块..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-200 focus:outline-none focus:border-banana-500/50"
          />
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as any)}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-200 focus:outline-none focus:border-banana-500/50"
        >
          <option value="全部">全部类型</option>
          {Object.values(ModuleType).map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-20">
        {filteredModules.map(module => (
          <div key={module.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors group relative flex flex-col h-full">
             <div className="flex justify-between items-start mb-3">
               <span className={`text-xs px-2 py-0.5 rounded border font-medium ${MODULE_COLORS[module.type]}`}>
                 {module.type}
               </span>
               <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                    onClick={() => handleCopy(module.content, module.id)} 
                    className={`transition-colors ${copiedId === module.id ? 'text-green-500' : 'text-zinc-400 hover:text-banana-400'}`}
                    title="复制提示词"
                 >
                    {copiedId === module.id ? <Check size={16} /> : <Copy size={16} />}
                 </button>
                 <button onClick={() => openModal(module)} className="text-zinc-400 hover:text-banana-400" title="编辑"><Edit2 size={16} /></button>
                 <button onClick={() => handleDelete(module.id)} className="text-zinc-400 hover:text-red-400" title="删除"><Trash2 size={16} /></button>
               </div>
             </div>

             {module.imageUrl && (
               <div className="mb-3 rounded-lg overflow-hidden border border-zinc-800/50 aspect-video bg-zinc-950 group-hover:border-banana-500/30 transition-colors relative">
                 <img src={module.imageUrl} alt={module.title} className="w-full h-full object-cover" />
                 <a 
                   href={module.imageUrl} 
                   target="_blank" 
                   rel="noopener noreferrer"
                   className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 rounded-md text-white opacity-0 group-hover:opacity-100 transition-opacity"
                   title="查看原图"
                 >
                   <ExternalLink size={12} />
                 </a>
               </div>
             )}

             <h3 className="font-semibold text-zinc-100 mb-2 truncate" title={module.title}>{module.title}</h3>
             <p className="text-zinc-400 text-sm line-clamp-3 font-mono bg-zinc-950/50 p-2 rounded mb-3 flex-1 select-all">
               {module.content}
             </p>
             <div className="flex flex-wrap gap-2 mt-auto">
               {module.tags.map((tag, i) => (
                 <span key={i} className="text-xs text-zinc-500 flex items-center gap-1">
                   <Tag size={10} /> {tag}
                 </span>
               ))}
             </div>
          </div>
        ))}
      </div>

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-zinc-100 mb-4">{editingModule ? '编辑模块' : '新建模块'}</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">标题</label>
                  <input 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:border-banana-500/50 outline-none"
                    value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：资深 React 工程师角色"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">类型</label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:border-banana-500/50 outline-none"
                    value={type} onChange={e => setType(e.target.value as ModuleType)}
                  >
                    {Object.values(ModuleType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">图片链接 (可选)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <input 
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-2 py-2 text-zinc-200 focus:border-banana-500/50 outline-none font-mono text-sm"
                      value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://example.com/image.png"
                    />
                  </div>
                </div>
                {imageUrl && (
                   <div className="mt-2 w-24 h-24 rounded-lg border border-zinc-800 overflow-hidden bg-zinc-950">
                      <img src={imageUrl} alt="预览" className="w-full h-full object-cover" />
                   </div>
                )}
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">提示词内容</label>
                <textarea 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 font-mono text-sm h-48 focus:border-banana-500/50 outline-none resize-none"
                  value={content} onChange={e => setContent(e.target.value)} placeholder="在此输入提示词文本块..."
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-400 mb-1">标签 (逗号分隔)</label>
                <input 
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-zinc-200 focus:border-banana-500/50 outline-none"
                  value={tags} onChange={e => setTags(e.target.value)} placeholder="编程, react, 营销..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-zinc-400 hover:text-zinc-200">取消</button>
              <button onClick={handleSave} className="px-6 py-2 bg-banana-500 hover:bg-banana-400 text-zinc-950 font-semibold rounded-lg">
                保存模块
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};