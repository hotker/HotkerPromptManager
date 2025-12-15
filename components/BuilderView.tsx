import React, { useState, useEffect, useMemo } from 'react';
import { PromptModule, PromptTemplate, RunLog, FixedConfig, ModuleType, User } from '../types';
import { AVAILABLE_MODELS, DEFAULT_CONFIG, MODULE_COLORS } from '../constants';
import { Plus, Save, Play, ChevronRight, X, Settings2, GripVertical, AlertCircle, CheckCircle2, Copy, Download, Image as ImageIcon, Box, Layout, Eye, Trash2 } from 'lucide-react';
import { generateResponse } from '../services/geminiService';
import { Language, translations } from '../translations';

interface BuilderViewProps {
  modules: PromptModule[];
  templates: PromptTemplate[];
  saveTemplate: (t: PromptTemplate) => void;
  addLog: (l: RunLog) => void;
  userApiKey: string;
  currentUser: User;
  lang: Language;
}

export const BuilderView: React.FC<BuilderViewProps> = ({ modules, templates, saveTemplate, addLog, userApiKey, currentUser, lang }) => {
  const t = translations[lang];

  // Builder State
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState(t.builder.defaultTemplateName);
  const [config, setConfig] = useState<FixedConfig>(DEFAULT_CONFIG);
  
  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // UI State
  const [activeTab, setActiveTab] = useState<'modules' | 'config'>('modules');
  const [searchModule, setSearchModule] = useState('');
  const [mobileSection, setMobileSection] = useState<'resources' | 'assembly' | 'preview'>('assembly');

  useEffect(() => {
     if (templateName === translations['zh'].builder.defaultTemplateName || templateName === translations['en'].builder.defaultTemplateName) {
         setTemplateName(t.builder.defaultTemplateName);
     }
  }, [lang]);

  const compiledPrompt = useMemo(() => {
    const parts = selectedModuleIds.map(id => modules.find(m => m.id === id)?.content).filter(Boolean);
    if (config.appendString) {
      parts.push(`\n[System Note]: ${config.appendString}`);
    }
    return parts.join('\n\n');
  }, [selectedModuleIds, modules, config.appendString]);

  const handleAddModule = (id: string) => {
    setSelectedModuleIds(prev => [...prev, id]);
    if (window.innerWidth < 768) setMobileSection('assembly');
  };

  const handleRemoveModule = (index: number) => {
    setSelectedModuleIds(prev => prev.filter((_, i) => i !== index));
  };

  const handleRun = async () => {
    if (!compiledPrompt) return;
    if (window.innerWidth < 768) setMobileSection('preview');

    setIsRunning(true);
    setResult(null);
    setExecutionError(null);
    const startTime = Date.now();

    try {
      const output = await generateResponse(compiledPrompt, config, {
        apiKey: userApiKey,
        allowSystemKey: false 
      });

      setResult(output);
      addLog({
        id: crypto.randomUUID(),
        templateId: 'unsaved-session',
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
    const tmpl: PromptTemplate = {
      id: crypto.randomUUID(),
      name: templateName,
      description: 'Builder Session',
      moduleIds: selectedModuleIds,
      config: config,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveTemplate(tmpl);
    alert('Template Saved!');
  };

  const loadTemplate = (tmpl: PromptTemplate) => {
    setTemplateName(tmpl.name);
    setSelectedModuleIds(tmpl.moduleIds);
    setConfig(tmpl.config);
    if (window.innerWidth < 768) setMobileSection('assembly');
  };

  const isImageResult = result?.startsWith('[IMAGE GENERATED]');
  const imageSource = isImageResult ? result?.replace('[IMAGE GENERATED] ', '') : '';

  return (
    <div className="h-full flex flex-col md:flex-row bg-zinc-950 overflow-hidden relative">
      
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-zinc-800 bg-black shrink-0 z-20">
        {[
          { id: 'resources', icon: Box, label: t.builder.tabResources },
          { id: 'assembly', icon: Layout, label: t.builder.tabAssembly },
          { id: 'preview', icon: Eye, label: t.builder.tabPreview }
        ].map(tab => (
           <button 
            key={tab.id}
            onClick={() => setMobileSection(tab.id as any)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileSection === tab.id ? 'text-banana-400 bg-white/5' : 'text-zinc-500'}`}
          >
            <tab.icon size={14}/> {tab.label}
            {tab.id === 'assembly' && <span className="bg-zinc-800 text-zinc-300 px-1.5 rounded-full text-[10px]">{selectedModuleIds.length}</span>}
          </button>
        ))}
      </div>


      {/* LEFT: Resources (Glass Sidebar) */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-zinc-900/30 backdrop-blur-sm ${mobileSection === 'resources' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-white/5 flex gap-2">
           <button onClick={() => setActiveTab('modules')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'modules' ? 'bg-white/10 text-banana-400' : 'text-zinc-500 hover:text-zinc-300'}`}>{t.builder.tabModules}</button>
           <button onClick={() => setActiveTab('config')} className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'config' ? 'bg-white/10 text-banana-400' : 'text-zinc-500 hover:text-zinc-300'}`}>{t.builder.tabConfig}</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'modules' ? (
            <div className="space-y-3">
               <div className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder={t.builder.searchModules}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs focus:border-banana-500/50 outline-none text-zinc-300"
                    value={searchModule}
                    onChange={e => setSearchModule(e.target.value)}
                  />
               </div>
               <div className="space-y-2">
                  {modules.filter(m => m.title.toLowerCase().includes(searchModule.toLowerCase())).map(module => (
                    <div key={module.id} className="bg-black/40 border border-white/5 p-3 rounded-lg group hover:border-banana-500/50 hover:bg-zinc-900/60 transition-all cursor-pointer select-none" onClick={() => handleAddModule(module.id)}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${MODULE_COLORS[module.type]}`}>{module.type}</span>
                        <Plus size={12} className="text-zinc-600 group-hover:text-banana-400" />
                      </div>
                      <p className="text-xs text-zinc-300 font-bold">{module.title}</p>
                      <p className="text-[10px] text-zinc-500 line-clamp-2 mt-1 font-mono opacity-70">{module.content}</p>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">{t.builder.model}</label>
                    <select 
                      className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-banana-500/50"
                      value={config.model}
                      onChange={(e) => setConfig({...config, model: e.target.value})}
                    >
                      {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">{t.builder.temperature}</label>
                        <input type="number" step="0.1" min="0" max="2" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-banana-500/50" value={config.temperature} onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">{t.builder.topK}</label>
                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-zinc-300 outline-none focus:border-banana-500/50" value={config.topK} onChange={(e) => setConfig({...config, topK: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                      <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">{t.builder.fixedEnding}</label>
                      <textarea 
                        className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs font-mono text-zinc-400 h-24 focus:border-banana-500/50 outline-none resize-none"
                        value={config.appendString}
                        onChange={(e) => setConfig({...config, appendString: e.target.value})}
                      />
                  </div>
               </div>

               <div className="pt-4 border-t border-white/5">
                 <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2 block">{t.builder.savedTemplates}</label>
                 <div className="space-y-1">
                   {templates.map(tmpl => (
                     <button key={tmpl.id} onClick={() => loadTemplate(tmpl)} className="w-full text-left text-xs text-zinc-400 hover:text-white px-2 py-1.5 rounded hover:bg-white/5 truncate transition-colors">
                       {tmpl.name}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE: Assembly Area (Blueprint Grid) */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#050505] relative ${mobileSection === 'assembly' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
        {/* Tech Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000000_100%)] pointer-events-none"></div>

        <div className="p-4 border-b border-white/5 flex justify-between items-center relative z-10 bg-black/50 backdrop-blur-sm">
           <div className="flex items-center gap-3 w-full">
              <div className="w-2 h-2 rounded-full bg-banana-500 shadow-[0_0_10px_#fbbf24]"></div>
              <input 
                className="bg-transparent text-lg font-bold text-zinc-200 outline-none placeholder-zinc-700 w-full font-mono" 
                value={templateName} 
                onChange={e => setTemplateName(e.target.value)} 
              />
           </div>
           <button onClick={handleSaveTemplate} className="flex-shrink-0 flex items-center gap-2 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-4 py-2 rounded-lg transition-colors border border-white/10">
             <Save size={14} /> <span className="hidden sm:inline">{t.builder.saveTemplateBtn}</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 relative z-10">
           {selectedModuleIds.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center opacity-40">
               <div className="w-20 h-20 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center mb-4">
                 <Plus size={32} className="text-zinc-700" />
               </div>
               <p className="text-zinc-500 font-mono text-sm uppercase tracking-widest">{t.builder.dragTip}</p>
             </div>
           )}

           {selectedModuleIds.map((id, index) => {
             const module = modules.find(m => m.id === id);
             if(!module) return null;
             return (
               <div key={`${id}-${index}`} className="group relative bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 hover:border-banana-500/50 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all animate-in slide-in-from-bottom-2 backdrop-blur-md">
                  {/* Connector Line Visual */}
                  {index < selectedModuleIds.length - 1 && (
                    <div className="absolute left-1/2 -bottom-6 w-px h-6 bg-gradient-to-b from-zinc-800 to-zinc-800/0 z-0"></div>
                  )}
                  
                  <div className="flex justify-between items-start mb-2">
                     <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${module.type === ModuleType.ROLE ? 'bg-blue-500' : module.type === ModuleType.TASK ? 'bg-green-500' : 'bg-zinc-500'}`}></span>
                        <span className="text-xs font-mono text-zinc-500 uppercase">{module.type}</span>
                     </div>
                     <button onClick={() => handleRemoveModule(index)} className="text-zinc-600 hover:text-red-400 transition-colors">
                        <X size={14} />
                     </button>
                  </div>
                  <h4 className="text-sm font-bold text-zinc-200 mb-2">{module.title}</h4>
                  <div className="bg-black/40 rounded p-3 border border-white/5 font-mono text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap">
                    {module.content}
                  </div>
               </div>
             )
           })}

           {/* Fixed Ending Node */}
           {config.appendString && (
             <div className="opacity-70 mt-4 relative">
                <div className="bg-zinc-900/40 border border-zinc-800 border-dashed rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                     <Settings2 size={12} className="text-banana-500" />
                     <span className="text-xs uppercase font-bold tracking-wider text-banana-500">{t.builder.fixedEnding}</span>
                  </div>
                  <p className="text-xs font-mono text-zinc-500 whitespace-pre-wrap">{config.appendString}</p>
                </div>
             </div>
           )}
           
           <div className="h-20 md:hidden"></div>
           <button 
             onClick={handleRun}
             disabled={isRunning || selectedModuleIds.length === 0}
             className="md:hidden fixed bottom-24 right-6 bg-banana-500 text-black rounded-2xl p-4 shadow-[0_0_30px_rgba(251,191,36,0.4)] z-50 disabled:opacity-50 disabled:shadow-none"
           >
             {isRunning ? <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full"></div> : <Play fill="currentColor" size={24} />}
           </button>
        </div>
      </div>

      {/* RIGHT: Output / Preview (Terminal Style) */}
      <div className={`w-full md:w-96 border-l border-white/5 flex flex-col bg-[#0a0a0b] ${mobileSection === 'preview' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
         <div className="p-4 border-b border-white/5 bg-zinc-900/20">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                Console Output
              </h3>
           </div>
           
           <button 
             onClick={handleRun}
             disabled={isRunning || selectedModuleIds.length === 0}
             className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-sm ${
               isRunning ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-zinc-100 hover:bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.1)]'
             }`}
           >
             {isRunning ? 'PROCESSING...' : <><Play size={14} fill="currentColor" /> {t.builder.runBtn}</>}
           </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 font-mono text-xs custom-scrollbar relative bg-black/50">
            {executionError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 mb-4 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2 font-bold mb-1"><AlertCircle size={14}/> Error</div>
                <p className="opacity-80">{executionError}</p>
              </div>
            )}
            
            {!result && !isRunning && !executionError && (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-700 pointer-events-none">
                 <div className="text-center">
                    <div className="text-4xl mb-2 opacity-20">_</div>
                    <p>Ready for input</p>
                 </div>
              </div>
            )}

            {result && (
              <div className="animate-in fade-in duration-500 pb-10">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#0a0a0b]/90 backdrop-blur py-2 border-b border-white/5 z-10">
                   <span className="text-green-500 font-bold flex items-center gap-2">
                     <CheckCircle2 size={14}/> Status: OK
                   </span>
                   <div className="flex gap-2">
                     {isImageResult && (
                       <button onClick={() => { 
                          const link = document.createElement('a');
                          link.href = imageSource;
                          link.download = `hotker-${Date.now()}.png`;
                          link.click();
                       }} className="text-zinc-500 hover:text-white"><Download size={14}/></button>
                     )}
                     <button onClick={() => navigator.clipboard.writeText(result)} className="text-zinc-500 hover:text-white"><Copy size={14}/></button>
                   </div>
                </div>
                
                {isImageResult ? (
                   <div className="rounded-xl overflow-hidden border border-white/10 shadow-2xl">
                      <img src={imageSource} alt="Generated" className="w-full h-auto" />
                   </div>
                ) : (
                   <div className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                     {result.split('\n').map((line, i) => (
                       <div key={i} className="flex">
                         <span className="text-zinc-700 mr-3 select-none">{i + 1}</span>
                         <span>{line}</span>
                       </div>
                     ))}
                   </div>
                )}
              </div>
            )}
         </div>
      </div>
    </div>
  );
};