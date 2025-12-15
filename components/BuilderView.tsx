import React, { useState, useEffect, useMemo } from 'react';
import { PromptModule, PromptTemplate, RunLog, FixedConfig, ModuleType, User } from '../types';
import { AVAILABLE_MODELS, DEFAULT_CONFIG, MODULE_COLORS } from '../constants';
import { Plus, Save, Play, ChevronRight, X, Settings2, GripVertical, AlertCircle, CheckCircle2, Copy, Download, Image as ImageIcon, Box, Layout, Eye } from 'lucide-react';
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
  
  // Mobile Tab State (Resources | Builder | Preview)
  const [mobileSection, setMobileSection] = useState<'resources' | 'assembly' | 'preview'>('assembly');

  // Sync default name when lang changes, if user hasn't typed a custom name
  useEffect(() => {
     if (templateName === translations['zh'].builder.defaultTemplateName || templateName === translations['en'].builder.defaultTemplateName) {
         setTemplateName(t.builder.defaultTemplateName);
     }
  }, [lang]);

  // Derived State
  const compiledPrompt = useMemo(() => {
    const parts = selectedModuleIds.map(id => modules.find(m => m.id === id)?.content).filter(Boolean);
    if (config.appendString) {
      parts.push(`\n[System Note]: ${config.appendString}`);
    }
    return parts.join('\n\n');
  }, [selectedModuleIds, modules, config.appendString]);

  const handleAddModule = (id: string) => {
    setSelectedModuleIds(prev => [...prev, id]);
    // On mobile, auto-switch to assembly view after adding
    if (window.innerWidth < 768) {
      setMobileSection('assembly');
    }
  };

  const handleRemoveModule = (index: number) => {
    setSelectedModuleIds(prev => prev.filter((_, i) => i !== index));
  };

  const handleRun = async () => {
    if (!compiledPrompt) return;
    
    // On mobile, switch to preview immediately
    if (window.innerWidth < 768) {
       setMobileSection('preview');
    }

    setIsRunning(true);
    setResult(null);
    setExecutionError(null);
    const startTime = Date.now();

    // Check Permissions
    const isPrivilegedUser = currentUser.username === 'hotker@gmail.com';

    try {
      // Call service with explicit permissions
      const output = await generateResponse(compiledPrompt, config, {
        apiKey: userApiKey,
        allowSystemKey: isPrivilegedUser
      });

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
    // On mobile, switch to assembly
    if (window.innerWidth < 768) {
      setMobileSection('assembly');
    }
  };

  const handleDownloadImage = (dataUrl: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `hotker-gen-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImageResult = result?.startsWith('[IMAGE GENERATED]');
  const imageSource = isImageResult ? result?.replace('[IMAGE GENERATED] ', '') : '';

  return (
    <div className="h-full flex flex-col md:flex-row bg-zinc-950 overflow-hidden relative">
      
      {/* 
         MOBILE: Tab Switcher (Visible only on mobile) 
         Use z-20 to stay below fixed top/bottom bars but above content 
      */}
      <div className="md:hidden flex border-b border-zinc-800 bg-zinc-950 shrink-0">
        <button 
          onClick={() => setMobileSection('resources')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileSection === 'resources' ? 'text-banana-400 border-b-2 border-banana-400' : 'text-zinc-500'}`}
        >
          <Box size={14}/> {t.builder.tabResources}
        </button>
        <button 
          onClick={() => setMobileSection('assembly')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileSection === 'assembly' ? 'text-banana-400 border-b-2 border-banana-400' : 'text-zinc-500'}`}
        >
          <Layout size={14}/> {t.builder.tabAssembly} <span className="bg-zinc-800 text-zinc-300 px-1.5 rounded-full text-[10px]">{selectedModuleIds.length}</span>
        </button>
        <button 
          onClick={() => setMobileSection('preview')}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 ${mobileSection === 'preview' ? 'text-banana-400 border-b-2 border-banana-400' : 'text-zinc-500'}`}
        >
          <Eye size={14}/> {t.builder.tabPreview}
        </button>
      </div>


      {/* LEFT PANEL: Resources */}
      <div className={`w-full md:w-80 border-r border-zinc-800 flex flex-col bg-zinc-900/50 ${mobileSection === 'resources' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-zinc-800 flex gap-2">
           <button 
             onClick={() => setActiveTab('modules')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'modules' ? 'bg-zinc-800 text-banana-400' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             {t.builder.tabModules}
           </button>
           <button 
             onClick={() => setActiveTab('config')}
             className={`flex-1 py-2 text-sm font-medium rounded-lg ${activeTab === 'config' ? 'bg-zinc-800 text-banana-400' : 'text-zinc-500 hover:text-zinc-300'}`}
           >
             {t.builder.tabConfig}
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'modules' ? (
            <div className="space-y-3">
               <input 
                 type="text" 
                 placeholder={t.builder.searchModules}
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
               {modules.length === 0 && <p className="text-zinc-500 text-center text-sm mt-10">{t.builder.noModulesFound}</p>}
            </div>
          ) : (
            <div className="space-y-6">
               <div>
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">{t.builder.fixedEnding}</label>
                  <textarea 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 h-24 focus:border-banana-500/50 outline-none resize-none"
                    value={config.appendString}
                    onChange={(e) => setConfig({...config, appendString: e.target.value})}
                  />
               </div>
               <div>
                 <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">{t.builder.model}</label>
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
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">{t.builder.temperature}</label>
                    <input 
                      type="number" step="0.1" min="0" max="2"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-300 outline-none"
                      value={config.temperature}
                      onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
                    />
                 </div>
                 <div>
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">{t.builder.topK}</label>
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
                    <ImageIcon size={12}/> {t.builder.aspectRatio}
                  </label>
                  <select 
                    className="w-full bg-zinc-950 border border-zinc-800 rounded p-2 text-sm text-zinc-300 outline-none"
                    value={config.aspectRatio || 'auto'}
                    onChange={(e) => setConfig({...config, aspectRatio: e.target.value})}
                  >
                    <option value="auto">Auto</option>
                    <option value="1:1">1:1 (Square)</option>
                    <option value="16:9">16:9 (Landscape)</option>
                    <option value="9:16">9:16 (Portrait)</option>
                  </select>
               </div>

               <div>
                 <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider mb-2 block">{t.builder.savedTemplates}</label>
                 <div className="space-y-2">
                   {templates.map(tmpl => (
                     <button key={tmpl.id} onClick={() => loadTemplate(tmpl)} className="w-full text-left text-xs text-zinc-400 hover:text-banana-400 py-1 border-b border-zinc-800 last:border-0 truncate">
                       {tmpl.name}
                     </button>
                   ))}
                   {templates.length === 0 && <span className="text-xs text-zinc-600">{t.builder.noSavedTemplates}</span>}
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE: Assembly Area */}
      <div className={`flex-1 flex flex-col min-w-0 bg-zinc-950 ${mobileSection === 'assembly' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
           <input 
             className="bg-transparent text-lg font-bold text-zinc-100 outline-none placeholder-zinc-600 w-full" 
             value={templateName} 
             onChange={e => setTemplateName(e.target.value)} 
           />
           <button onClick={handleSaveTemplate} className="flex-shrink-0 flex items-center gap-2 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg transition-colors ml-2">
             <Save size={14} /> <span className="hidden sm:inline">{t.builder.saveTemplateBtn}</span>
           </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
           {selectedModuleIds.length === 0 && (
             <div className="border-2 border-dashed border-zinc-800 rounded-xl p-10 text-center">
               <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-600">
                 <Plus size={24} />
               </div>
               <p className="text-zinc-500">{t.builder.dragTip}</p>
               <button 
                  onClick={() => setMobileSection('resources')} 
                  className="md:hidden mt-4 text-xs bg-zinc-800 text-zinc-300 px-3 py-2 rounded-lg"
               >
                 {t.builder.mobileAddTip}
               </button>
             </div>
           )}

           {selectedModuleIds.map((id, index) => {
             const module = modules.find(m => m.id === id);
             if(!module) return null;
             return (
               <div key={`${id}-${index}`} className="group relative bg-zinc-900/40 border border-zinc-800 rounded-lg p-4 hover:border-banana-500/30 transition-all">
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 cursor-grab text-zinc-600 hidden md:block">
                    <GripVertical size={16} />
                  </div>
                  <div className="md:pl-6 md:pr-8">
                     <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] uppercase font-bold tracking-wider ${MODULE_COLORS[module.type].split(' ')[1]}`}>{module.type}</span>
                        <h4 className="text-sm font-semibold text-zinc-200">{module.title}</h4>
                     </div>
                     <p className="text-sm font-mono text-zinc-400 whitespace-pre-wrap">{module.content}</p>
                  </div>
                  <button onClick={() => handleRemoveModule(index)} className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-400 md:opacity-0 group-hover:opacity-100 transition-opacity">
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
                     <span className="text-xs uppercase font-bold tracking-wider text-banana-500">{t.builder.fixedEnding}</span>
                  </div>
                  <p className="text-xs font-mono text-zinc-500 whitespace-pre-wrap">{config.appendString}</p>
                </div>
             </div>
           )}
           
           {/* Mobile FAB to run prompt */}
           <div className="md:hidden h-12"></div> {/* Spacer */}
           <button 
             onClick={handleRun}
             disabled={isRunning || selectedModuleIds.length === 0}
             className="md:hidden fixed bottom-24 right-4 bg-banana-500 text-zinc-950 rounded-full p-4 shadow-xl z-20 disabled:opacity-50"
           >
             {isRunning ? <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full"></div> : <Play fill="currentColor" size={24} />}
           </button>
        </div>
      </div>

      {/* RIGHT: Output / Preview */}
      <div className={`w-full md:w-96 border-l border-zinc-800 flex flex-col bg-zinc-900 ${mobileSection === 'preview' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
         <div className="p-4 border-b border-zinc-800">
           <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">{t.builder.tabPreview}</h3>
           <div className="flex items-center justify-between text-xs text-zinc-500 mb-2">
             <span>{t.builder.model}: {AVAILABLE_MODELS.find(m => m.id === config.model)?.name.split(' ')[0]}</span>
             <span>{selectedModuleIds.length} {t.builder.tabModules}</span>
           </div>
           <button 
             onClick={handleRun}
             disabled={isRunning || selectedModuleIds.length === 0}
             className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
               isRunning ? 'bg-zinc-800 text-zinc-500 cursor-wait' : 'bg-gradient-to-r from-banana-500 to-banana-600 text-zinc-950 hover:from-banana-400 hover:to-banana-500 shadow-lg shadow-banana-500/20'
             }`}
           >
             {isRunning ? t.builder.thinking : <><Play size={16} fill="currentColor" /> {t.builder.runBtn}</>}
           </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4 bg-zinc-950 font-mono text-sm relative">
            {executionError && (
              <div className="absolute inset-x-4 top-4 z-10 p-4 bg-zinc-900/95 border border-red-500/50 rounded-xl text-red-400 text-xs shadow-xl backdrop-blur animate-in slide-in-from-top-2">
                <div className="flex justify-between items-start mb-2">
                   <div className="flex items-center gap-2 font-bold text-red-500"><AlertCircle size={16}/> {t.builder.failed}</div>
                   <button onClick={() => setExecutionError(null)} className="text-zinc-500 hover:text-zinc-300"><X size={14}/></button>
                </div>
                <p className="leading-relaxed mb-3">{executionError}</p>
                <div className="text-[10px] text-zinc-500 bg-black/30 p-2 rounded">
                   Check API Key or permissions.
                </div>
              </div>
            )}
            
            {!result && !isRunning && !executionError && (
              <div className="text-zinc-700 text-center mt-20 italic">
                {t.history.result} will appear here...
              </div>
            )}

            {result && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                <div className="flex justify-between items-center mb-2">
                   <span className="text-xs text-green-500 flex items-center gap-1"><CheckCircle2 size={12}/> {t.builder.success}</span>
                   <div className="flex gap-2">
                     {isImageResult && (
                       <button 
                         onClick={() => handleDownloadImage(imageSource || '')} 
                         className="text-zinc-500 hover:text-banana-400 transition-colors"
                         title={t.builder.downloadImage}
                       >
                         <Download size={14}/>
                       </button>
                     )}
                     <button onClick={() => navigator.clipboard.writeText(result)} className="text-zinc-500 hover:text-zinc-300 transition-colors" title={t.builder.copy}><Copy size={12}/></button>
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