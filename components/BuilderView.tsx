import React, { useState, useEffect, useMemo } from 'react';
import { PromptModule, PromptTemplate, RunLog, FixedConfig, ModuleType } from '../types';
import { AVAILABLE_MODELS, DEFAULT_CONFIG, MODULE_COLORS } from '../constants';
import { Plus, Save, Play, ChevronRight, X, Settings2, GripVertical, AlertCircle, CheckCircle2, Copy, Download, Image as ImageIcon } from 'lucide-react';
import { generateResponse } from '../services/geminiService';

interface BuilderViewProps {
  modules: PromptModule[];
  templates: PromptTemplate[];
  saveTemplate: (t: PromptTemplate) => void;
  addLog: (l: RunLog) => void;
  userApiKey: string;
}

export const BuilderView: React.FC<BuilderViewProps> = ({ modules, templates, saveTemplate, addLog, userApiKey }) => {
  // Builder State
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState('新建 Nano 模板');
  const [config, setConfig] = useState<FixedConfig>(DEFAULT_CONFIG);
  
  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'modules' | 'config'>('modules');
  const [searchModule, setSearchModule] = useState('');

  // Derived State
  const compiledPrompt = useMemo(() => {
    const parts = selectedModuleIds.map(id => modules.find(m => m.id === id)?.content).filter(Boolean);
    if (config.appendString) {
      parts.push(`\n[系统备注]: ${config.appendString}`);
    }
    return parts.join('\n\n');
  }, [selectedModuleIds, modules, config.appendString]);

  const handleAddModule = (id: string) => {
    setSelectedModuleIds(prev => [...prev, id]);
  };

  const handleRemoveModule = (index: number) => {
    setSelectedModuleIds(prev => prev.filter((_, i) => i !== index));
  };

  const handleRun = async () => {
    if (!compiledPrompt) return;
    setIsRunning(true);
    setResult(null);
    setExecutionError(null);
    const startTime = Date.now();

    try {
      // Pass the userApiKey to the service
      const output = await generateResponse(compiledPrompt, config, userApiKey);
      setResult(output);
      
      addLog({
        id: crypto.randomUUID(),
        templateId: 'unsaved-session', // simplified for demo
        templateName: templateName,
        finalPrompt: compiledPrompt,
        output: output,
        status: 'success',
        timestamp: Date.now(),
        durationMs: Date.now() - startTime
      });
    } catch (e: any) {
      setExecutionError(e.message);
      addLog({
        id: crypto.randomUUID(),
        templateId: 'unsaved-session',
        templateName: templateName,
        finalPrompt: compiledPrompt,
        output: '',
        status: 'failure',
        notes: e.message,
        timestamp: Date.now(),
        durationMs: Date.now() - startTime
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleSaveTemplate = () => {
    const t: PromptTemplate = {
      id: crypto.randomUUID(),
      name: templateName,
      description: '在构建器中创建',
      moduleIds: selectedModuleIds,
      config: config,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveTemplate(t);
    alert('模板已保存！');
  };

  const loadTemplate = (t: PromptTemplate) => {
    setTemplateName(t.name);
    setSelectedModuleIds(t.moduleIds);
    setConfig(t.config);
  };

  const handleDownloadImage = (dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `nano-banana-gen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImageResult = result?.startsWith('[IMAGE GENERATED]');
  const imageSource = isImageResult ? result?.replace('[IMAGE GENERATED] ', '') : '';

  return (
    <div className="h-full flex flex-col md:flex-row bg-zinc-950 overflow-hidden">
      
      {/* LEFT PANEL: Resources */}
      <div className="w-full md:w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/50">
        <div className="p-4 border-b border-zinc-800 flex gap-2">
           <button 
             onClick={() => setActiveTab('modules')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'modules' ? 'bg-zinc-800 text-banana-400' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             模块
           </button>
           <button 
             onClick={() => setActiveTab('config')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'config' ? 'bg-zinc-800 text-banana-400' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             配置
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'modules' ? (
            <div className="space-y-3">
               <input 
                 type="text" 
                 placeholder="搜索积木..." 
                 className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm mb-2 focus:border-banana-500/50 outline-none"
                 value={searchModule}
                 onChange={e => setSearchModule(e.target.value)}
               />
               {modules.filter(m => m.title.toLowerCase().includes(searchModule.toLowerCase())).map(module => (
                 <div key={module.id} className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg group hover:border-banana-500/30 transition-colors cursor-pointer" onClick={() => handleAddModule(module.id)}>
                   <div className="flex justify-between items-center mb-1">
                     <span className={`text-[10px] px-1.5 rounded border ${MODULE_COLORS[module.type]}`}>{module.type}</span>
                     <Plus size={14} className="text-zinc-500 group-hover:text-banana-400" />
                   </div>
                   <p className="text-sm text-zinc-300 font-medium">{module.title}</p>
                   <p className="text-xs text-zinc-500 line-clamp-2 mt-1 font-mono">{module.content}</p>
                 </div>
               ))}
               {modules.length === 0 && <p className="text-zinc-500 text-center text-sm mt-10">未找到模块。请先在库中创建。</p>}
            </div>
          ) : (
            <div className="space-y-6">
               <div>
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">固定结尾参数</label>
                  <textarea 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 h-24 focus:border-banana-500/50 outline-none resize-none"
                    value={config.appendString}
                    onChange={(e) => setConfig({...config, appendString: e.target.value})}
                    placeholder="追加到每个提示词的标准约束..."
                  />
               </div>
               <div>
                 <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">模型</label>
                 <select 
                   className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-300 outline-none"
                   value={config.model}
                   onChange={(e) => setConfig({...config, model: e.target.value})}
                 >
                   {AVAILABLE_MODELS.map(m => (
                     <option key={m.id} value={m.id}>{m.name}</option>
                   ))}
                 </select>
               </div>
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">温度 (Temperature)</label>
                    <input 
                      type="number" step="0.1" min="0" max="2"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-300 outline-none"
                      value={config.temperature}
                      onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">采样 (Top K)</label>
                    <input 
                      type="number"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-300 outline-none"
                      value={config.topK}
                      onChange={(e) => setConfig({...config, topK: parseInt(e.target.value)})}
                    />
                 </div>
               </div>

               <div>
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block flex items-center gap-1">
                    <ImageIcon size={12}/> 图片比例 (Aspect Ratio)
                  </label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-300 outline-none"
                    value={config.aspectRatio || 'auto'}
                    onChange={(e) => setConfig({...config, aspectRatio: e.target.value})}
                  >
                    <option value="auto">Auto (自动)</option>
                    <option value="1:1">1:1 (正方形)</option>
                    <option value="16:9">16:9 (横向宽屏)</option>
                    <option value="9:16">9:16 (手机竖屏)</option>
                    <option value="4:3">4:3 (标准横向)</option>
                    <option value="3:4">3:4 (标准竖向)</option>
                  </select>
               </div>

               <div>
                 <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">已保存模板</label>
                 <div className="space-y-2">
                   {templates.map(t => (
                     <button key={t.id} onClick={() => loadTemplate(t)} className="w-full text-left text-xs text-zinc-400 hover:text-banana-400 py-1 border-b border-zinc-800 last:border-0 truncate">
                       {t.name}
                     </button>
                   ))}
                   {templates.length === 0 && <span className="text-xs text-zinc-600">暂无保存的模板。</span>}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE: Assembly Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
           <input 
             className="bg-transparent text-lg font-bold text-zinc-100 outline-none placeholder-zinc-600" 
             value={templateName} 
             onChange={e => setTemplateName(e.target.value)} 
           />
           <button onClick={handleSaveTemplate} className="flex items-center gap-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg transition-colors">
             <Save size={14} /> 保存模板
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
           {selectedModuleIds.length === 0 && (
             <div className="border-2 border-dashed border-zinc-800 rounded-xl p-10 text-center">
               <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-600">
                 <Plus size={24} />
               </div>
               <p className="text-zinc-500">拖拽模块到此处或点击侧边栏的 <span className="text-banana-500">+</span></p>
             </div>
           )}

           {selectedModuleIds.map((id, index) => {
             const module = modules.find(m => m.id === id);
             if(!module) return null;
             return (
               <div key={`${id}-${index}`} className="group relative bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 hover:border-banana-500/30 transition-all">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab text-zinc-600">
                    <GripVertical size={16} />
                  </div>
                  <div className="pl-6 pr-8">
                     <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${MODULE_COLORS[module.type].split(' ')[1]}`}>{module.type}</span>
                        <h4 className="text-sm font-semibold text-zinc-200">{module.title}</h4>
                     </div>
                     <p className="text-sm font-mono text-zinc-400 whitespace-pre-wrap">{module.content}</p>
                  </div>
                  <button onClick={() => handleRemoveModule(index)} className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    <X size={16} />
                  </button>
               </div>
             )
           })}

           {/* Fixed Ending Visualization */}
           {config.appendString && (
             <div className="opacity-60 border-t border-dashed border-zinc-700 pt-4 mt-4">
                <div className="bg-zinc-900/20 border border-zinc-800 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                     <Settings2 size={12} className="text-banana-500" />
                     <span className="text-xs uppercase font-bold tracking-wider text-banana-500">固定结尾</span>
                  </div>
                  <p className="text-xs font-mono text-zinc-500 whitespace-pre-wrap">{config.appendString}</p>
                </div>
             </div>
           )}
        </div>
      </div>

      {/* RIGHT: Output / Preview */}
      <div className="w-full md:w-96 border-l border-zinc-800 flex flex-col bg-zinc-900">
         <div className="p-4 border-b border-zinc-800">
           <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">提示词实时测试</h3>
           <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
             <span>模型: {AVAILABLE_MODELS.find(m => m.id === config.model)?.name.split(' ')[0]}</span>
             <span>{selectedModuleIds.length} 模块</span>
           </div>
           <button 
             onClick={handleRun}
             disabled={isRunning || selectedModuleIds.length === 0}
             className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
               isRunning ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-gradient-to-r from-banana-500 to-banana-600 text-zinc-950 hover:from-banana-400 hover:to-banana-500 shadow-lg shadow-banana-500/20'
             }`}
           >
             {isRunning ? '思考中...' : <><Play size={16} fill="currentColor" /> 生成输出</>}
           </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 bg-zinc-950 font-mono text-sm">
            {executionError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs mb-4">
                <div className="flex items-center gap-2 mb-1 font-bold"><AlertCircle size={14}/> 错误</div>
                {executionError}
              </div>
            )}
            
            {!result && !isRunning && !executionError && (
              <div className="text-zinc-700 text-center mt-20 italic">
                结果将显示在这里...
              </div>
            )}

            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> 成功</span>
                   <div className="flex gap-2">
                     {isImageResult && (
                       <button 
                         onClick={() => handleDownloadImage(imageSource || '')} 
                         className="text-zinc-500 hover:text-banana-400 transition-colors"
                         title="下载图片"
                       >
                         <Download size={14}/>
                       </button>
                     )}
                     <button onClick={() => navigator.clipboard.writeText(result)} className="text-zinc-500 hover:text-zinc-300 transition-colors" title="复制文本"><Copy size={12}/></button>
                   </div>
                </div>
                {isImageResult ? (
                   <div className="relative group rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
                      <img src={imageSource} alt="Generated" className="w-full h-auto" />
                   </div>
                ) : (
                   <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{result}</div>
                )}
              </div>
            )}
         </div>
      </div>
    </div>
  );
};