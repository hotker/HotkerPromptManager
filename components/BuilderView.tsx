import React, { useState, useEffect, useMemo } from 'react';
import { PromptModule, PromptTemplate, RunLog, FixedConfig, ModuleType, User } from '../types';
import { AVAILABLE_MODELS, DEFAULT_CONFIG, MODULE_COLORS } from '../constants';
import { Plus, Save, Play, X, Settings2, CheckCircle2, Copy, Download, Box, Layout, Eye, Search, ArrowRight, GripVertical } from 'lucide-react';
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

      if (output.startsWith('ERR_')) {
          throw new Error(output);
      }

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
    alert(t.builder.success);
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
    <div className="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden relative font-sans md:rounded-tl-xl md:border-l md:border-t md:border-slate-200">
      
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-slate-200 bg-white shrink-0 z-20">
        {[
          { id: 'resources', icon: Box, label: t.builder.tabResources },
          { id: 'assembly', icon: Layout, label: t.builder.tabAssembly },
          { id: 'preview', icon: Eye, label: t.builder.tabPreview }
        ].map(tab => (
           <button 
            key={tab.id}
            onClick={() => setMobileSection(tab.id as any)}
            className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${mobileSection === tab.id ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-slate-500'}`}
          >
            <tab.icon size={14}/> {tab.label}
            {tab.id === 'assembly' && <span className="bg-slate-200 text-slate-600 px-1.5 rounded-full text-[9px] min-w-[1.2em]">{selectedModuleIds.length}</span>}
          </button>
        ))}
      </div>


      {/* LEFT: Resources Sidebar */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col bg-white ${mobileSection === 'resources' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
        <div className="p-2 border-b border-slate-100 flex gap-1 bg-slate-50">
           <button onClick={() => setActiveTab('modules')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'modules' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{t.builder.tabModules}</button>
           <button onClick={() => setActiveTab('config')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'config' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>{t.builder.tabConfig}</button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50/50">
          {activeTab === 'modules' ? (
            <div className="space-y-3">
               <div className="relative mb-2">
                  <input 
                    type="text" 
                    placeholder={t.builder.searchModules}
                    className="prod-input pl-8"
                    value={searchModule}
                    onChange={e => setSearchModule(e.target.value)}
                  />
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
               </div>
               <div className="space-y-2">
                  {modules.filter(m => m.title.toLowerCase().includes(searchModule.toLowerCase())).map(module => (
                    <div key={module.id} className="bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group select-none active:scale-[0.98]" onClick={() => handleAddModule(module.id)}>
                      <div className="flex justify-between items-center mb-1">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${MODULE_COLORS[module.type]}`}>{t.moduleType[module.type as keyof typeof t.moduleType] || module.type}</span>
                        <div className="w-5 h-5 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                            <Plus size={12} />
                        </div>
                      </div>
                      <p className="text-xs text-slate-800 font-medium truncate mb-0.5">{module.title}</p>
                      <p className="text-[10px] text-slate-400 line-clamp-2">{module.content}</p>
                    </div>
                  ))}
               </div>
            </div>
          ) : (
            <div className="space-y-6 px-1">
               <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 mb-1 block">{t.builder.model}</label>
                    <select 
                      className="prod-input"
                      value={config.model}
                      onChange={(e) => setConfig({...config, model: e.target.value})}
                    >
                      {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">{t.builder.temperature}</label>
                        <input type="number" step="0.1" min="0" max="2" className="prod-input" value={config.temperature} onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})} />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-slate-700 mb-1 block">{t.builder.topK}</label>
                        <input type="number" className="prod-input" value={config.topK} onChange={(e) => setConfig({...config, topK: parseInt(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">{t.builder.fixedEnding}</label>
                      <textarea 
                        className="prod-input min-h-[80px]"
                        value={config.appendString}
                        onChange={(e) => setConfig({...config, appendString: e.target.value})}
                      />
                  </div>
               </div>

               <div className="pt-4 border-t border-slate-200">
                 <label className="text-xs font-semibold text-slate-500 mb-2 block uppercase tracking-wider">{t.builder.savedTemplates}</label>
                 <div className="space-y-1">
                   {templates.length === 0 && <div className="text-xs text-slate-400 italic p-2">No templates yet.</div>}
                   {templates.map(tmpl => (
                     <button key={tmpl.id} onClick={() => loadTemplate(tmpl)} className="w-full text-left text-xs text-slate-600 hover:text-blue-700 px-3 py-2 rounded hover:bg-slate-100 transition-colors flex items-center gap-2">
                       <Layout size={12}/> {tmpl.name}
                     </button>
                   ))}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE: Assembly Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-slate-50 relative ${mobileSection === 'assembly' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-white shadow-sm z-10">
           <input 
              className="bg-transparent text-lg font-bold text-slate-900 outline-none placeholder-slate-400 w-full" 
              value={templateName} 
              onChange={e => setTemplateName(e.target.value)} 
           />
           <button onClick={handleSaveTemplate} className="btn-secondary text-xs whitespace-nowrap">
             <Save size={14} /> <span className="hidden sm:inline">{t.builder.saveTemplateBtn}</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 relative custom-scrollbar">
           {selectedModuleIds.length === 0 && (
             <div className="h-full flex flex-col items-center justify-center opacity-40">
               <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-4 text-slate-400">
                 <Layout size={32} />
               </div>
               <p className="text-slate-500 font-medium">{t.builder.dragTip}</p>
             </div>
           )}

           {selectedModuleIds.map((id, index) => {
             const module = modules.find(m => m.id === id);
             if(!module) return null;
             return (
               <div key={`${id}-${index}`} className="group relative bg-white border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100 bg-slate-50/50 rounded-t-lg">
                      <GripVertical size={14} className="text-slate-300 cursor-move" />
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${MODULE_COLORS[module.type]}`}>{t.moduleType[module.type as keyof typeof t.moduleType] || module.type}</span>
                      <h4 className="text-xs font-semibold text-slate-700 truncate">{module.title}</h4>
                      <button onClick={() => handleRemoveModule(index)} className="ml-auto text-slate-400 hover:text-red-500 transition-colors p-1">
                        <X size={14} />
                      </button>
                  </div>
                  <div className="p-4 text-sm text-slate-600 font-mono leading-relaxed whitespace-pre-wrap bg-white rounded-b-lg">
                    {module.content}
                  </div>
                  
                  {/* Connector Line */}
                  {index < selectedModuleIds.length - 1 && (
                    <div className="absolute left-1/2 -bottom-6 w-px h-6 bg-slate-300 z-0"></div>
                  )}
               </div>
             )
           })}

           {/* Fixed Ending Node */}
           {config.appendString && (
             <div className="mt-8 border-t-2 border-dashed border-slate-200 pt-6 relative">
                <span className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-50 px-2 text-[10px] text-slate-400 uppercase font-bold tracking-wider">System Append</span>
                <div className="bg-slate-100 border border-slate-200 p-4 rounded-lg opacity-75">
                  <div className="flex items-center gap-2 mb-2 text-slate-500">
                     <Settings2 size={12} />
                     <span className="text-[10px] font-bold uppercase">{t.builder.fixedEnding}</span>
                  </div>
                  <p className="text-xs font-mono text-slate-600 whitespace-pre-wrap">{config.appendString}</p>
                </div>
             </div>
           )}
           
           <div className="h-24 md:hidden"></div>
           <button 
             onClick={handleRun}
             disabled={isRunning || selectedModuleIds.length === 0}
             className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 disabled:bg-slate-300 disabled:shadow-none transition-all active:scale-90"
           >
             {isRunning ? <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div> : <Play fill="currentColor" size={24} />}
           </button>
        </div>
      </div>

      {/* RIGHT: Output / Preview */}
      <div className={`w-full md:w-[400px] border-l border-slate-200 flex flex-col bg-white ${mobileSection === 'preview' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
         <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col gap-3">
           <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ArrowRight size={14} className="text-blue-500" />
                {t.builder.terminalOutput}
              </h3>
           </div>
           
           <button 
             onClick={handleRun}
             disabled={isRunning || selectedModuleIds.length === 0}
             className={`w-full py-2.5 font-medium flex items-center justify-center gap-2 transition-all text-sm rounded-md shadow-sm ${
               isRunning ? 'bg-slate-100 text-slate-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700 text-white'
             }`}
           >
             {isRunning ? t.builder.processing : <><Play size={14} fill="currentColor" /> {t.builder.runBtn}</>}
           </button>
         </div>

         <div className="flex-1 overflow-y-auto p-6 font-mono text-sm custom-scrollbar bg-slate-50 relative">
            {executionError && (
               <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 mb-4 text-xs">
                 <p className="font-bold mb-1">Execution Error</p>
                 {executionError}
               </div>
            )}
            
            {!result && !isRunning && !executionError && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300 pointer-events-none select-none">
                 <div className="text-center">
                    <p className="text-sm font-medium">{t.builder.awaitingInput}</p>
                 </div>
              </div>
            )}

            {result && (
              <div className="animate-in fade-in duration-300 pb-10">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-50/95 backdrop-blur py-2 border-b border-slate-200 z-10">
                   <span className="text-emerald-600 font-bold flex items-center gap-1.5 text-xs">
                     <CheckCircle2 size={14}/> {t.builder.processComplete}
                   </span>
                   <div className="flex gap-1">
                     {isImageResult && (
                       <button onClick={() => { 
                          const link = document.createElement('a');
                          link.href = imageSource;
                          link.download = `hotker-${Date.now()}.png`;
                          link.click();
                       }} className="btn-icon" title={t.builder.downloadImage}><Download size={14}/></button>
                     )}
                     <button onClick={() => navigator.clipboard.writeText(result)} className="btn-icon" title={t.builder.copy}><Copy size={14}/></button>
                   </div>
                </div>
                
                {isImageResult ? (
                   <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-white">
                      <img src={imageSource} alt="Generated" className="w-full h-auto" />
                   </div>
                ) : (
                   <div className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                     {result.split('\n').map((line, i) => (
                       <div key={i} className="min-h-[1.5em]">
                         {line}
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