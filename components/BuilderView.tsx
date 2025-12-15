import React, { useState, useEffect, useMemo } from 'react';
import { PromptModule, PromptTemplate, RunLog, FixedConfig, ModuleType, User } from '../types';
import { AVAILABLE_MODELS, DEFAULT_CONFIG, MODULE_COLORS } from '../constants';
import { Plus, Save, Play, ChevronRight, X, Settings2, GripVertical, AlertCircle, CheckCircle2, Copy, Download, Image as ImageIcon, Box, Layout, Eye, Trash2, Cpu } from 'lucide-react';
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
    <div className="h-full flex flex-col md:flex-row bg-[#030508] overflow-hidden relative font-mono">
      
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-white/10 bg-[#080c14] shrink-0 z-20">
        {[
          { id: 'resources', icon: Box, label: t.builder.tabResources },
          { id: 'assembly', icon: Layout, label: t.builder.tabAssembly },
          { id: 'preview', icon: Eye, label: t.builder.tabPreview }
        ].map(tab => (
           <button 
            key={tab.id}
            onClick={() => setMobileSection(tab.id as any)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileSection === tab.id ? 'text-cyber-primary bg-white/5 border-b-2 border-cyber-primary' : 'text-gray-500'}`}
          >
            <tab.icon size={14}/> {tab.label}
            {tab.id === 'assembly' && <span className="bg-cyber-primary text-black font-bold px-1.5 rounded text-[9px]">{selectedModuleIds.length}</span>}
          </button>
        ))}
      </div>


      {/* LEFT: Resources (Glass Sidebar) */}
      <div className={`w-full md:w-80 border-r border-white/5 flex flex-col bg-[#0a0e17]/50 backdrop-blur-sm ${mobileSection === 'resources' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-white/5 flex gap-2">
           <button onClick={() => setActiveTab('modules')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest clip-tech transition-colors ${activeTab === 'modules' ? 'bg-cyber-primary/20 text-cyber-primary' : 'bg-black/20 text-gray-500 hover:text-white'}`}>{t.builder.tabModules}</button>
           <button onClick={() => setActiveTab('config')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest clip-tech transition-colors ${activeTab === 'config' ? 'bg-cyber-primary/20 text-cyber-primary' : 'bg-black/20 text-gray-500 hover:text-white'}`}>{t.builder.tabConfig}</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          {activeTab === 'modules' ? (
            <div className="space-y-3">
               <div className="relative mb-4">
                  <input 
                    type="text" 
                    placeholder={t.builder.searchModules}
                    className="w-full bg-black/40 border border-white/10 px-3 py-2 text-xs focus:border-cyber-primary outline-none text-zinc-300 clip-tech"
                    value={searchModule}
                    onChange={e => setSearchModule(e.target.value)}
                  />
               </div>
               <div className="space-y-2">
                  {modules.filter(m => m.title.toLowerCase().includes(searchModule.toLowerCase())).map(module => (
                    <div key={module.id} className="bg-black/40 border-l-2 border-white/10 p-3 hover:border-l-cyber-primary hover:bg-white/5 transition-all cursor-pointer select-none group" onClick={() => handleAddModule(module.id)}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[9px] font-bold uppercase tracking-wider ${MODULE_COLORS[module.type].split(' ')[1]}`}>{module.type}</span>
                        <Plus size={12} className="text-gray-600 group-hover:text-cyber-primary" />
                      </div>
                      <p className="text-xs text-gray-300 font-bold truncate">{module.title}</p>
                      <p className="text-[10px] text-gray-600 line-clamp-1 mt-0.5 font-mono">{module.content.substring(0, 40)}</p>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="space-y-6">
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-cyber-primary font-bold uppercase tracking-wider mb-2 block">{t.builder.model}</label>
                    <select 
                      className="w-full bg-black/40 border-b border-white/10 py-2 text-xs text-gray-300 outline-none focus:border-cyber-primary"
                      value={config.model}
                      onChange={(e) => setConfig({...config, model: e.target.value})}
                    >
                      {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id} className="bg-black">{m.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">{t.builder.temperature}</label>
                        <input type="number" step="0.1" min="0" max="2" className="w-full bg-black/40 border-b border-white/10 py-2 text-xs text-gray-300 outline-none focus:border-cyber-primary" value={config.temperature} onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">{t.builder.topK}</label>
                        <input type="number" className="w-full bg-black/40 border-b border-white/10 py-2 text-xs text-gray-300 outline-none focus:border-cyber-primary" value={config.topK} onChange={(e) => setConfig({...config, topK: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                      <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">{t.builder.fixedEnding}</label>
                      <textarea 
                        className="w-full bg-black/40 border border-white/10 p-2 text-xs font-mono text-gray-400 h-24 focus:border-cyber-primary outline-none resize-none"
                        value={config.appendString}
                        onChange={(e) => setConfig({...config, appendString: e.target.value})}
                      />
                  </div>
               </div>

               <div className="pt-4 border-t border-white/5">
                 <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2 block">{t.builder.savedTemplates}</label>
                 <div className="space-y-1">
                   {templates.map(tmpl => (
                     <button key={tmpl.id} onClick={() => loadTemplate(tmpl)} className="w-full text-left text-xs text-gray-400 hover:text-cyber-primary px-2 py-2 border-b border-white/5 hover:bg-white/5 transition-colors flex items-center gap-2">
                       <Box size={10}/> {tmpl.name}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE: Assembly Area (Blueprint Grid) */}
      <div className={`flex-1 flex flex-col min-w-0 bg-[#050608] relative ${mobileSection === 'assembly' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
        {/* Tech Grid Background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-50 pointer-events-none"></div>

        <div className="p-4 border-b border-white/5 flex justify-between items-center relative z-10 bg-[#0a0e17]/80 backdrop-blur-sm">
           <div className="flex items-center gap-3 w-full">
              <Cpu size={18} className="text-cyber-primary animate-pulse"/>
              <input 
                className="bg-transparent text-lg font-bold text-white outline-none placeholder-gray-700 w-full tracking-wider" 
                value={templateName} 
                onChange={e => setTemplateName(e.target.value)} 
              />
           </div>
           <button onClick={handleSaveTemplate} className="flex-shrink-0 flex items-center gap-2 text-xs font-bold bg-white/5 hover:bg-white/10 text-white px-4 py-2 clip-tech transition-colors border border-white/10 hover:border-cyber-primary">
             <Save size={14} /> <span className="hidden sm:inline">{t.builder.saveTemplateBtn}</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8 relative z-10">
           {selectedModuleIds.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center opacity-30">
               <div className="w-24 h-24 border border-dashed border-cyber-primary flex items-center justify-center mb-4 rotate-45">
                 <div className="-rotate-45"><Plus size={32} className="text-cyber-primary" /></div>
               </div>
               <p className="text-cyber-primary font-mono text-xs uppercase tracking-[0.2em]">{t.builder.dragTip}</p>
             </div>
           )}

           {selectedModuleIds.map((id, index) => {
             const module = modules.find(m => m.id === id);
             if(!module) return null;
             return (
               <div key={`${id}-${index}`} className="group relative bg-[#0c121d] border-l-2 border-cyber-primary p-5 shadow-[0_0_20px_rgba(0,0,0,0.5)] transition-all animate-in slide-in-from-bottom-4 clip-tech-border">
                  {/* Energy Line Visual */}
                  {index < selectedModuleIds.length - 1 && (
                    <div className="absolute left-6 -bottom-8 w-0.5 h-8 bg-cyber-primary/30 z-0">
                       <div className="w-full h-2 bg-cyber-primary animate-float blur-[2px]"></div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-3">
                     <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 border ${MODULE_COLORS[module.type]}`}>{module.type}</span>
                     </div>
                     <button onClick={() => handleRemoveModule(index)} className="text-gray-600 hover:text-red-500 transition-colors">
                        <X size={14} />
                     </button>
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2 tracking-wide">{module.title}</h4>
                  <div className="bg-black/30 p-3 border border-white/5 text-[11px] text-gray-400 font-mono leading-relaxed whitespace-pre-wrap">
                    {module.content}
                  </div>
               </div>
             )
           })}

           {/* Fixed Ending Node */}
           {config.appendString && (
             <div className="opacity-60 mt-8 relative pl-8 border-l border-dashed border-gray-700 ml-4">
                <div className="bg-black/20 border border-white/5 p-4 rounded-sm">
                  <div className="flex items-center gap-2 mb-2">
                     <Settings2 size={12} className="text-gray-500" />
                     <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500">{t.builder.fixedEnding}</span>
                  </div>
                  <p className="text-[10px] font-mono text-gray-600 whitespace-pre-wrap">{config.appendString}</p>
                </div>
             </div>
           )}
           
           <div className="h-24 md:hidden"></div>
           <button 
             onClick={handleRun}
             disabled={isRunning || selectedModuleIds.length === 0}
             className="md:hidden fixed bottom-24 right-6 bg-cyber-primary text-black rounded-none p-4 shadow-[0_0_30px_rgba(0,240,255,0.4)] z-50 disabled:opacity-50 disabled:shadow-none clip-tech"
           >
             {isRunning ? <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full"></div> : <Play fill="currentColor" size={24} />}
           </button>
        </div>
      </div>

      {/* RIGHT: Output / Preview (Terminal Style) */}
      <div className={`w-full md:w-[450px] border-l border-white/5 flex flex-col bg-[#080c14] ${mobileSection === 'preview' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
         <div className="p-4 border-b border-white/5 bg-[#0a0e17]">
           <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold text-cyber-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyber-primary shadow-[0_0_5px_#00f0ff] animate-pulse"></span>
                TERMINAL_OUTPUT
              </h3>
           </div>
           
           <button 
             onClick={handleRun}
             disabled={isRunning || selectedModuleIds.length === 0}
             className={`w-full py-3 font-bold flex items-center justify-center gap-2 transition-all text-xs tracking-widest uppercase clip-tech ${
               isRunning ? 'bg-white/5 text-gray-500 cursor-wait' : 'btn-tech shadow-[0_0_20px_rgba(0,240,255,0.2)]'
             }`}
           >
             {isRunning ? 'PROCESSING_DATA...' : <><Play size={14} fill="currentColor" /> {t.builder.runBtn}</>}
           </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 font-mono text-xs custom-scrollbar relative bg-[#050608]">
            {executionError && (
              <div className="p-4 bg-red-900/10 border border-red-500/50 text-red-400 mb-4 animate-in slide-in-from-top-2 flex items-start gap-3">
                <AlertCircle size={16} className="shrink-0 mt-0.5"/> 
                <div>
                   <div className="font-bold mb-1">SYSTEM_ERROR</div>
                   <p className="opacity-80 leading-relaxed">{executionError}</p>
                </div>
              </div>
            )}
            
            {!result && !isRunning && !executionError && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-800 pointer-events-none select-none">
                 <div className="text-center">
                    <div className="text-6xl mb-4 opacity-10 font-black">_</div>
                    <p className="tracking-[0.2em] text-[10px]">AWAITING_INPUT_STREAM</p>
                 </div>
              </div>
            )}

            {result && (
              <div className="animate-in fade-in duration-500 pb-10">
                <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#050608]/90 backdrop-blur py-2 border-b border-white/5 z-10">
                   <span className="text-green-400 font-bold flex items-center gap-2 text-[10px] tracking-wider">
                     <CheckCircle2 size={12}/> PROCESS_COMPLETE
                   </span>
                   <div className="flex gap-2">
                     {isImageResult && (
                       <button onClick={() => { 
                          const link = document.createElement('a');
                          link.href = imageSource;
                          link.download = `hotker-${Date.now()}.png`;
                          link.click();
                       }} className="text-gray-500 hover:text-white transition-colors"><Download size={14}/></button>
                     )}
                     <button onClick={() => navigator.clipboard.writeText(result)} className="text-gray-500 hover:text-white transition-colors"><Copy size={14}/></button>
                   </div>
                </div>
                
                {isImageResult ? (
                   <div className="overflow-hidden border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                      <img src={imageSource} alt="Generated" className="w-full h-auto" />
                   </div>
                ) : (
                   <div className="text-gray-300 whitespace-pre-wrap leading-loose">
                     {result.split('\n').map((line, i) => (
                       <div key={i} className="flex hover:bg-white/5 transition-colors -mx-2 px-2 py-0.5">
                         <span className="text-gray-700 mr-4 select-none w-6 text-right opacity-50">{i + 1}</span>
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