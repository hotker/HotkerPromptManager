import React, { useState, useEffect, useMemo } from 'react';
import { PromptModule, PromptTemplate, RunLog, FixedConfig, ModuleType, User } from '../types';
import { AVAILABLE_MODELS, DEFAULT_CONFIG, MODULE_COLORS } from '../constants';
import { 
  Plus, Save, Play, X, Settings2, CheckCircle2, Copy, Download, 
  Box, Layout, Eye, Search, ArrowRight, GripVertical, AlertCircle,
  Cpu, Thermometer, Layers, ChevronDown, Info, Image as ImageIcon,
  Maximize, Edit2, Check
} from 'lucide-react';
import { generateResponse } from '../services/geminiService';
import { Language, translations } from '../translations';

interface BuilderViewProps {
  modules: PromptModule[];
  templates: PromptTemplate[];
  saveTemplate: (t: PromptTemplate) => void;
  addLog: (l: RunLog) => void;
  onUpdateModule: (m: PromptModule) => void;
  userApiKey: string;
  currentUser: User;
  lang: Language;
}

export const BuilderView: React.FC<BuilderViewProps> = ({ modules, templates, saveTemplate, addLog, onUpdateModule, userApiKey, currentUser, lang }) => {
  const t = translations[lang];

  // Builder State
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState(t.builder.defaultTemplateName);
  const [config, setConfig] = useState<FixedConfig>(DEFAULT_CONFIG);
  
  // Edit State
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // Execution State
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // UI State
  const [searchModule, setSearchModule] = useState('');
  const [mobileSection, setMobileSection] = useState<'resources' | 'assembly' | 'preview'>('assembly');

  // Collapse sections state
  const [sectionsOpen, setSectionsOpen] = useState({
    structure: true,
    params: true
  });

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

  // Editing logic
  const startEditing = (module: PromptModule) => {
    setEditingModuleId(module.id);
    setEditingContent(module.content);
  };

  const saveEditing = (module: PromptModule) => {
    if (editingContent.trim() !== module.content) {
      onUpdateModule({
        ...module,
        content: editingContent
      });
    }
    setEditingModuleId(null);
  };

  const cancelEditing = () => {
    setEditingModuleId(null);
    setEditingContent('');
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
  const isReady = selectedModuleIds.length > 0;

  // Group modules by type for the library sidebar
  const groupedModules = useMemo(() => {
    const groups: Partial<Record<ModuleType, PromptModule[]>> = {};
    const filtered = modules.filter(m => 
      m.title.toLowerCase().includes(searchModule.toLowerCase()) || 
      m.tags.some(tag => tag.toLowerCase().includes(searchModule.toLowerCase()))
    );
    
    filtered.forEach(m => {
      if (!groups[m.type]) groups[m.type] = [];
      groups[m.type]?.push(m);
    });
    return groups;
  }, [modules, searchModule]);

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


      {/* COLUMN 1: Module Library */}
      <div className={`w-full md:w-72 border-r border-slate-200 flex flex-col bg-white shrink-0 ${mobileSection === 'resources' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-slate-100 bg-white sticky top-0 z-10">
           <div className="relative">
              <input 
                type="text" 
                placeholder={t.builder.searchModules}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 pl-9 text-xs focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                value={searchModule}
                onChange={e => setSearchModule(e.target.value)}
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
           {Object.keys(groupedModules).length === 0 && (
              <div className="text-center py-8 text-slate-400 text-xs">
                {t.builder.noModulesFound}
              </div>
           )}

           {(Object.keys(groupedModules) as ModuleType[]).map(type => (
              <div key={type}>
                 <div className="flex items-center gap-2 mb-2 px-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${MODULE_COLORS[type].split(' ')[0].replace('bg-', 'bg-')}`}></span>
                    <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {t.moduleType[type as keyof typeof t.moduleType] || type}
                    </h3>
                 </div>
                 <div className="space-y-2">
                    {groupedModules[type]?.map(module => (
                      <div 
                        key={module.id} 
                        className="group bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer select-none active:scale-[0.98] relative overflow-hidden" 
                        onClick={() => handleAddModule(module.id)}
                      >
                         <div className="flex justify-between items-start gap-2">
                           <p className="text-xs text-slate-800 font-semibold truncate leading-tight">{module.title}</p>
                           <Plus size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors shrink-0" />
                         </div>
                         <p className="text-[10px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">{module.content}</p>
                      </div>
                    ))}
                 </div>
              </div>
           ))}
           
           {/* Saved Templates Quick Access */}
           {templates.length > 0 && (
             <div className="pt-4 border-t border-slate-100">
               <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">{t.builder.savedTemplates}</h3>
               <div className="space-y-1">
                 {templates.map(tmpl => (
                   <button key={tmpl.id} onClick={() => loadTemplate(tmpl)} className="w-full text-left text-xs text-slate-600 hover:text-blue-700 px-3 py-2 rounded hover:bg-slate-50 transition-colors flex items-center gap-2 border border-transparent hover:border-slate-200">
                     <Layout size={12}/> {tmpl.name}
                   </button>
                 ))}
               </div>
             </div>
           )}
        </div>
      </div>

      {/* COLUMN 2: Build Canvas (Center) */}
      <div className={`flex-1 flex flex-col min-w-0 bg-slate-50 relative ${mobileSection === 'assembly' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
         
         <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6 pb-20">
               
               {/* Builder Header (New - replaced Step 1) */}
               <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-slate-400">
                        <Layers size={14} />
                        <span className="text-xs font-bold uppercase tracking-widest">Builder Flow</span>
                    </div>
                    <button 
                      onClick={handleSaveTemplate} 
                      className="text-xs flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                      title={t.builder.saveTemplateBtn}
                    >
                      <Save size={14} /> <span>Save</span>
                    </button>
                  </div>
                  <input 
                    className="text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900 placeholder-slate-300 w-full outline-none"
                    value={templateName} 
                    onChange={e => setTemplateName(e.target.value)}
                    placeholder="Untitled Template" 
                  />
               </div>

               {/* Step 1: Structure (Renumbered) */}
               <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden min-h-[150px]">
                  <div 
                     className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center cursor-pointer"
                     onClick={() => setSectionsOpen(prev => ({...prev, structure: !prev.structure}))}
                  >
                     <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div>
                        <span className="text-xs font-bold text-slate-700 uppercase">Prompt Structure</span>
                        <span className="bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full text-[10px] font-mono">{selectedModuleIds.length}</span>
                     </div>
                     <ChevronDown size={14} className={`text-slate-400 transition-transform ${sectionsOpen.structure ? 'rotate-180' : ''}`} />
                  </div>

                  {sectionsOpen.structure && (
                    <div className="p-5 bg-slate-50/30">
                       {selectedModuleIds.length === 0 ? (
                          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                             <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mb-3">
                                <Plus size={20} />
                             </div>
                             <p className="text-sm font-medium text-slate-600">Start Building</p>
                             <p className="text-xs text-slate-400 mt-1 max-w-[200px]">{t.builder.dragTip}</p>
                          </div>
                       ) : (
                          <div className="space-y-0 relative">
                             {/* Connecting Line for items */}
                             {selectedModuleIds.length > 1 && (
                                <div className="absolute left-[19px] top-4 bottom-4 w-px bg-slate-200 -z-0"></div>
                             )}

                             {selectedModuleIds.map((id, index) => {
                               const module = modules.find(m => m.id === id);
                               if(!module) return null;
                               
                               const isEditing = editingModuleId === module.id;

                               return (
                                 <div key={`${id}-${index}`} className="group relative pl-10 pb-4 last:pb-0 z-10">
                                    {/* Node Dot */}
                                    <div className="absolute left-[11px] top-3.5 w-[17px] h-[17px] bg-white border-2 border-slate-200 rounded-full flex items-center justify-center z-10">
                                       <div className={`w-1.5 h-1.5 rounded-full ${MODULE_COLORS[module.type].split(' ')[0].replace('bg-', 'bg-')}`}></div>
                                    </div>

                                    <div className={`bg-white border rounded-lg shadow-sm transition-colors ${isEditing ? 'border-blue-400 ring-1 ring-blue-100' : 'border-slate-200 group-hover:border-blue-300'}`}>
                                        <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-50">
                                            <GripVertical size={12} className="text-slate-300 cursor-move" />
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">{t.moduleType[module.type as keyof typeof t.moduleType] || module.type}</span>
                                            <div className="flex-1"></div>
                                            
                                            {isEditing ? (
                                              <>
                                                <button onClick={() => saveEditing(module)} className="text-emerald-500 hover:bg-emerald-50 p-1 rounded transition-colors" title="Save changes">
                                                  <Check size={14} />
                                                </button>
                                                <button onClick={cancelEditing} className="text-slate-400 hover:bg-slate-100 p-1 rounded transition-colors" title="Cancel">
                                                  <X size={14} />
                                                </button>
                                              </>
                                            ) : (
                                              <>
                                                <button onClick={() => startEditing(module)} className="text-slate-400 hover:text-blue-600 transition-colors p-1" title="Edit Content">
                                                  <Edit2 size={12} />
                                                </button>
                                                <button onClick={() => handleRemoveModule(index)} className="text-slate-400 hover:text-red-500 transition-colors p-1" title="Remove">
                                                  <X size={14} />
                                                </button>
                                              </>
                                            )}
                                        </div>
                                        <div className="px-3 py-2">
                                           <h4 className="text-xs font-bold text-slate-700 mb-1">{module.title}</h4>
                                           
                                           {isEditing ? (
                                              <textarea 
                                                className="w-full text-xs font-mono border border-slate-200 rounded p-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none min-h-[100px]"
                                                value={editingContent}
                                                onChange={(e) => setEditingContent(e.target.value)}
                                                autoFocus
                                              />
                                           ) : (
                                              <p className="text-xs text-slate-500 font-mono line-clamp-3 whitespace-pre-wrap">{module.content}</p>
                                           )}
                                        </div>
                                    </div>
                                 </div>
                               )
                             })}
                          </div>
                       )}
                    </div>
                  )}
               </div>

               {/* Connector */}
               <div className="flex justify-center h-4"><div className="w-px bg-slate-200 h-full"></div></div>

               {/* Step 2: Parameters (Config) (Renumbered) */}
               <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                   <div 
                     className="px-4 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center cursor-pointer"
                     onClick={() => setSectionsOpen(prev => ({...prev, params: !prev.params}))}
                   >
                     <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div>
                        <span className="text-xs font-bold text-slate-700 uppercase">Parameters</span>
                     </div>
                     <ChevronDown size={14} className={`text-slate-400 transition-transform ${sectionsOpen.params ? 'rotate-180' : ''}`} />
                  </div>

                  {sectionsOpen.params && (
                     <div className="p-5 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                 <Cpu size={12} /> {t.builder.model}
                              </label>
                              <select 
                                className="prod-input text-xs"
                                value={config.model}
                                onChange={(e) => setConfig({...config, model: e.target.value})}
                              >
                                {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                 <Thermometer size={12} /> {t.builder.temperature}: {config.temperature}
                              </label>
                              <input 
                                type="range" min="0" max="2" step="0.1" 
                                className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                value={config.temperature} 
                                onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})} 
                              />
                           </div>
                           <div>
                              <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                 <ImageIcon size={12} /> {t.builder.aspectRatio}
                              </label>
                              <select 
                                className="prod-input text-xs"
                                value={config.aspectRatio || 'auto'}
                                onChange={(e) => setConfig({...config, aspectRatio: e.target.value})}
                              >
                                <option value="auto">Auto</option>
                                <option value="1:1">1:1 (Square)</option>
                                <option value="16:9">16:9 (Landscape)</option>
                                <option value="9:16">9:16 (Portrait)</option>
                                <option value="4:3">4:3 (Standard)</option>
                                <option value="3:4">3:4 (Portrait)</option>
                              </select>
                           </div>
                           <div>
                              <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                                 <Maximize size={12} /> {t.builder.resolution}
                              </label>
                              <select 
                                className="prod-input text-xs"
                                value={config.imageSize || '1K'}
                                onChange={(e) => setConfig({...config, imageSize: e.target.value})}
                              >
                                <option value="1K">1K</option>
                                <option value="2K">2K</option>
                                <option value="4K">4K</option>
                              </select>
                           </div>
                        </div>

                        <div>
                           <label className="text-xs font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                              <Settings2 size={12} /> {t.builder.fixedEnding}
                           </label>
                           <textarea 
                              className="prod-input min-h-[80px] font-mono text-xs"
                              value={config.appendString}
                              onChange={(e) => setConfig({...config, appendString: e.target.value})}
                              placeholder="System instructions appended to the end..."
                           />
                        </div>
                     </div>
                  )}
               </div>

            </div>
         </div>
      </div>

      {/* COLUMN 3: Run & Output (Right) */}
      <div className={`w-full md:w-96 border-l border-slate-200 flex flex-col bg-white shrink-0 ${mobileSection === 'preview' ? 'flex-1 overflow-hidden' : 'hidden md:flex'}`}>
         
         {/* 3.1 Runner Header */}
         <div className="p-5 border-b border-slate-200 bg-white sticky top-0 z-10 space-y-4">
            <div className="flex items-center justify-between">
               <h3 className="text-sm font-bold text-slate-800">Runner</h3>
               <div className="flex items-center gap-1.5">
                  {isReady ? (
                     <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={10} /> Ready
                     </span>
                  ) : (
                     <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle size={10} /> Missing Steps
                     </span>
                  )}
               </div>
            </div>

            <button 
               onClick={handleRun}
               disabled={isRunning || !isReady}
               className={`w-full py-3 font-bold flex items-center justify-center gap-2 transition-all text-sm rounded-lg shadow-md ${
                  isRunning 
                  ? 'bg-slate-100 text-slate-400 cursor-wait shadow-none' 
                  : !isReady
                     ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                     : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg active:scale-[0.98]'
               }`}
            >
               {isRunning ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full"></div>
                    {t.builder.processing}
                  </>
               ) : (
                  <><Play size={16} fill="currentColor" /> {t.builder.runBtn}</>
               )}
            </button>
            
            {!isReady && (
               <p className="text-[10px] text-center text-slate-400">
                  Add at least one module to start.
               </p>
            )}
         </div>

         {/* 3.2 Output Area */}
         <div className="flex-1 overflow-y-auto p-5 font-mono text-sm custom-scrollbar bg-slate-50 relative">
            {executionError && (
               <div className="p-4 bg-red-50 border border-red-100 rounded-lg text-red-600 mb-4 text-xs animate-in slide-in-from-top-2">
                 <p className="font-bold mb-1 flex items-center gap-1"><AlertCircle size={12}/> Execution Error</p>
                 {executionError}
               </div>
            )}
            
            {!result && !isRunning && !executionError && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 pointer-events-none select-none">
                 <ArrowRight size={32} className="mb-2 opacity-20" />
                 <p className="text-xs font-medium uppercase tracking-wide opacity-50">{t.builder.awaitingInput}</p>
              </div>
            )}

            {isRunning && !result && (
               <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-200 rounded w-5/6"></div>
                  <div className="h-4 bg-slate-200 rounded w-2/3"></div>
               </div>
            )}

            {result && (
              <div className="animate-in fade-in duration-500">
                <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-50/95 backdrop-blur py-2 border-b border-slate-200 z-10">
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Output</span>
                   <div className="flex gap-1">
                     {isImageResult && (
                       <button onClick={() => { 
                          const link = document.createElement('a');
                          link.href = imageSource;
                          link.download = `hotker-${Date.now()}.png`;
                          link.click();
                       }} className="btn-icon bg-white border border-slate-200" title={t.builder.downloadImage}><Download size={12}/></button>
                     )}
                     <button onClick={() => navigator.clipboard.writeText(result)} className="btn-icon bg-white border border-slate-200" title={t.builder.copy}><Copy size={12}/></button>
                   </div>
                </div>
                
                {isImageResult ? (
                   <div className="overflow-hidden rounded-lg border border-slate-200 shadow-sm bg-white">
                      <img src={imageSource} alt="Generated" className="w-full h-auto" />
                   </div>
                ) : (
                   <div className="text-slate-800 whitespace-pre-wrap leading-relaxed text-xs">
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