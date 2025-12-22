
import React, { useState, useEffect, useMemo } from 'react';
import { PromptModule, PromptTemplate, RunLog, FixedConfig, ModuleType, User } from '../types';
import { AVAILABLE_MODELS, DEFAULT_CONFIG, MODULE_COLORS } from '../constants';
import { 
  Plus, Save, Play, X, Settings2, CheckCircle2, Copy, Download, 
  Box, Layout, Eye, Search, ArrowRight, GripVertical, AlertCircle,
  Cpu, Thermometer, Layers, ChevronDown, Image as ImageIcon,
  Maximize, Edit2, Check, RefreshCcw
} from 'lucide-react';
import { generateResponse } from '../services/geminiService';
import { Language, translations } from '../translations';

interface BuilderViewProps {
  modules: PromptModule[];
  templates: PromptTemplate[];
  saveTemplate: (t: PromptTemplate) => void;
  addLog: (l: RunLog) => void;
  onUpdateModule: (m: PromptModule) => void;
  userApiKey: string; // Deprecated, kept for prop compatibility
  currentUser: User;
  lang: Language;
}

export const BuilderView: React.FC<BuilderViewProps> = ({ modules, templates, saveTemplate, addLog, onUpdateModule, userApiKey, currentUser, lang }) => {
  const t = translations[lang];

  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([]);
  const [templateName, setTemplateName] = useState(t.builder.defaultTemplateName);
  const [config, setConfig] = useState<FixedConfig>(DEFAULT_CONFIG);
  
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [searchModule, setSearchModule] = useState('');
  const [mobileSection, setMobileSection] = useState<'resources' | 'assembly' | 'preview'>('assembly');
  const [sectionsOpen, setSectionsOpen] = useState({ structure: true, params: true });

  const compiledPrompt = useMemo(() => {
    const parts = selectedModuleIds.map(id => modules.find(m => m.id === id)?.content).filter(Boolean);
    if (config.appendString) parts.push(`\n[System Note]: ${config.appendString}`);
    return parts.join('\n\n');
  }, [selectedModuleIds, modules, config.appendString]);

  const handleAddModule = (id: string) => {
    setSelectedModuleIds(prev => [...prev, id]);
    if (window.innerWidth < 768) setMobileSection('assembly');
  };

  const handleRun = async () => {
    if (!compiledPrompt) return;
    setIsRunning(true);
    setResult(null);
    setExecutionError(null);
    const startTime = Date.now();

    try {
      // Guidelines: geminiService now obtains API key from environment internally, or uses provided user key
      const output = await generateResponse(compiledPrompt, config, userApiKey);
      if (output.startsWith('ERR_')) throw new Error(output);
      setResult(output);
      addLog({ id: crypto.randomUUID(), templateId: 'unsaved', templateName, finalPrompt: compiledPrompt, output, status: 'success', timestamp: Date.now(), durationMs: Date.now() - startTime });
    } catch (e: any) {
      setExecutionError(e.message);
      addLog({ id: crypto.randomUUID(), templateId: 'unsaved', templateName, finalPrompt: compiledPrompt, output: '', status: 'failure', notes: e.message, timestamp: Date.now(), durationMs: Date.now() - startTime });
    } finally {
      setIsRunning(false);
    }
  };

  const groupedModules = useMemo(() => {
    const groups: Partial<Record<ModuleType, PromptModule[]>> = {};
    const filtered = modules.filter(m => m.title.toLowerCase().includes(searchModule.toLowerCase()) || m.tags.some(tag => tag.toLowerCase().includes(searchModule.toLowerCase())));
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
        {[{ id: 'resources', icon: Box, label: t.builder.tabResources }, { id: 'assembly', icon: Layout, label: t.builder.tabAssembly }, { id: 'preview', icon: Eye, label: t.builder.tabPreview }].map(tab => (
           <button key={tab.id} onClick={() => setMobileSection(tab.id as any)} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${mobileSection === tab.id ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-slate-500'}`}>
            <tab.icon size={14}/> {tab.label}
          </button>
        ))}
      </div>

      <div className={`w-full md:w-72 border-r border-slate-200 flex flex-col bg-white shrink-0 ${mobileSection === 'resources' ? 'flex-1' : 'hidden md:flex'}`}>
        <div className="p-4 border-b border-slate-100"><div className="relative"><input type="text" placeholder={t.builder.searchModules} className="prod-input pl-9 text-xs" value={searchModule} onChange={e => setSearchModule(e.target.value)} /><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /></div></div>
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-6">
           {(Object.keys(groupedModules) as ModuleType[]).map(type => (
              <div key={type}>
                 <div className="flex items-center gap-2 mb-2 px-1"><span className={`w-1.5 h-1.5 rounded-full ${MODULE_COLORS[type].split(' ')[0]}`}></span><h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t.moduleType[type] || type}</h3></div>
                 <div className="space-y-2">{groupedModules[type]?.map(module => (<div key={module.id} className="group bg-white border border-slate-200 rounded-lg p-3 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer select-none active:scale-95" onClick={() => handleAddModule(module.id)}><div className="flex justify-between items-start gap-2"><p className="text-xs text-slate-800 font-semibold truncate leading-tight">{module.title}</p><Plus size={14} className="text-slate-300 group-hover:text-blue-600" /></div><p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{module.content}</p></div>))}</div>
              </div>
           ))}
        </div>
      </div>

      <div className={`flex-1 flex flex-col min-w-0 bg-slate-50 relative ${mobileSection === 'assembly' ? 'flex-1' : 'hidden md:flex'}`}>
         <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
            <div className="max-w-2xl mx-auto space-y-6 pb-20">
               <div className="mb-4">
                  <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-2 text-slate-400"><Layers size={14} /><span className="text-xs font-bold uppercase tracking-widest">{t.builder.flowTitle}</span></div><button onClick={() => saveTemplate({ id: crypto.randomUUID(), name: templateName, description: 'Builder Session', moduleIds: selectedModuleIds, config, createdAt: Date.now(), updatedAt: Date.now() })} className="text-xs flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"><Save size={14} /> <span>{t.builder.saveTemplateBtn}</span></button></div>
                  <input className="text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900 w-full outline-none" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder={t.builder.untitledTemplate} />
               </div>

               <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center cursor-pointer" onClick={() => setSectionsOpen(p => ({...p, structure: !p.structure}))}><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div><span className="text-xs font-bold text-slate-700 uppercase">{t.builder.structureTitle}</span></div><ChevronDown size={14} className={`text-slate-400 transition-transform ${sectionsOpen.structure ? 'rotate-180' : ''}`} /></div>
                  {sectionsOpen.structure && (<div className="p-5 bg-slate-50/30">{selectedModuleIds.length === 0 ? (<div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center"><Plus size={20} className="text-slate-400 mb-2"/><p className="text-sm font-medium text-slate-600">{t.builder.startBuilding}</p></div>) : (<div className="space-y-3">{selectedModuleIds.map((id, index) => { const m = modules.find(x => x.id === id); return m ? (<div key={index} className="bg-white border rounded-lg p-3 flex items-start gap-3 group relative"><GripVertical size={14} className="mt-1 text-slate-300"/><div className="flex-1 min-w-0"><h4 className="text-xs font-bold text-slate-700 mb-1">{m.title}</h4><p className="text-xs text-slate-500 font-mono line-clamp-2">{m.content}</p></div><button onClick={() => setSelectedModuleIds(prev => prev.filter((_, i) => i !== index))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><X size={16}/></button></div>) : null; })}</div>)}</div>)}
               </div>

               <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center cursor-pointer" onClick={() => setSectionsOpen(p => ({...p, params: !p.params}))}><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div><span className="text-xs font-bold text-slate-700 uppercase">{t.builder.paramTitle}</span></div><ChevronDown size={14} className={`text-slate-400 transition-transform ${sectionsOpen.params ? 'rotate-180' : ''}`} /></div>
                  {sectionsOpen.params && (<div className="p-5 space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-slate-500 uppercase">{t.builder.model}</label><select className="prod-input text-xs" value={config.model} onChange={e => setConfig({...config, model: e.target.value})}>{AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div><label className="text-[10px] font-bold text-slate-500 uppercase">{t.builder.temperature}: {config.temperature}</label><input type="range" min="0" max="2" step="0.1" className="w-full accent-blue-600" value={config.temperature} onChange={e => setConfig({...config, temperature: parseFloat(e.target.value)})} /></div></div><div><label className="text-[10px] font-bold text-slate-500 uppercase">{t.builder.fixedEnding}</label><textarea className="prod-input min-h-[60px] text-xs font-mono" value={config.appendString} onChange={e => setConfig({...config, appendString: e.target.value})} /></div></div>)}
               </div>
            </div>
         </div>
      </div>

      <div className={`w-full md:w-96 border-l border-slate-200 flex flex-col bg-white shrink-0 ${mobileSection === 'preview' ? 'flex-1' : 'hidden md:flex'}`}>
         <div className="p-5 border-b sticky top-0 bg-white z-10"><h3 className="text-sm font-bold text-slate-800 mb-4">{t.builder.runnerTitle}</h3><button onClick={handleRun} disabled={isRunning || !selectedModuleIds.length} className={`w-full py-3 font-bold flex items-center justify-center gap-2 rounded-lg transition-all ${isRunning || !selectedModuleIds.length ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95'}`}>{isRunning ? <><RefreshCcw size={16} className="animate-spin"/> {t.builder.processing}</> : <><Play size={16} fill="currentColor"/> {t.builder.runBtn}</>}</button></div>
         <div className="flex-1 overflow-y-auto p-5 font-mono text-xs bg-slate-50">
            {executionError && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg mb-4 flex items-center gap-2 font-bold"><AlertCircle size={14}/> {executionError}</div>}
            {!result && !isRunning && <div className="h-full flex flex-col items-center justify-center text-slate-300"><ArrowRight size={32} className="opacity-20 mb-2"/><p className="text-[10px] uppercase font-bold tracking-widest">{t.builder.awaitingInput}</p></div>}
            {result && (<div className="animate-in fade-in"><div className="flex justify-between items-center mb-3 text-slate-400 uppercase font-bold"><span className="text-[10px]">{t.builder.outputTitle}</span><div className="flex gap-2"><button onClick={() => navigator.clipboard.writeText(result)} className="hover:text-blue-600"><Copy size={14}/></button></div></div>{result.startsWith('[IMAGE') ? <img src={result.split(' ')[2]} className="w-full rounded border" /> : <div className="whitespace-pre-wrap leading-relaxed text-slate-800">{result}</div>}</div>)}
         </div>
      </div>
    </div>
  );
};
