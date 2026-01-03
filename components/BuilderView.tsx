
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { PromptModule, PromptTemplate, RunLog, FixedConfig, ModuleType, User } from '../types';
import { AVAILABLE_MODELS, DEFAULT_CONFIG, MODULE_COLORS } from '../constants';
import {
  Plus, Save, Play, X, Settings2, CheckCircle2, Copy, Download,
  Box, Layout, Eye, Search, ArrowRight, GripVertical, AlertCircle,
  Cpu, Thermometer, Layers, ChevronDown, Image as ImageIcon,
  Maximize, Edit2, Check, RefreshCcw, BarChart3, Sparkles,
  Undo2, Redo2
} from 'lucide-react';
import { generateResponse } from '../services/geminiService';
import { Language, translations } from '../translations';
import { optimizerService, AnalysisResult, OptimizationResult } from '../services/optimizerService';
import { PromptAnalyzer } from './PromptAnalyzer';
import { PromptOptimizer } from './PromptOptimizer';
import { OptimizationApplyModal } from './OptimizationApplyModal';
import { DraggableModuleList } from './DraggableModuleList';
import { useUndoRedo } from '../hooks/useUndoRedo';
import { generateUUID } from '../services/uuid';

interface BuilderViewProps {
  modules: PromptModule[];
  templates: PromptTemplate[];
  saveTemplate: (t: PromptTemplate) => void;
  addLog: (l: RunLog) => void;
  onUpdateModule: (m: PromptModule) => void;
  onAddModule: (m: PromptModule) => void;
  userApiKey: string;
  currentUser: User;
  lang: Language;
}

export const BuilderView: React.FC<BuilderViewProps> = ({
  modules,
  templates,
  saveTemplate,
  addLog,
  onUpdateModule,
  onAddModule,
  userApiKey,
  currentUser,
  lang
}) => {
  const t = translations[lang];

  // 使用撤销/重做 Hook 管理选中模块
  const {
    state: selectedModuleIds,
    setState: setSelectedModuleIds,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoRedo<string[]>([], { maxHistory: 20 });

  const [templateName, setTemplateName] = useState(t.builder.defaultTemplateName);
  const [config, setConfig] = useState<FixedConfig>(DEFAULT_CONFIG);

  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  const [searchModule, setSearchModule] = useState('');
  const [mobileSection, setMobileSection] = useState<'resources' | 'assembly' | 'preview'>('assembly');
  const [sectionsOpen, setSectionsOpen] = useState({ structure: true, params: true });

  // 智能优化状态
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showAnalyzer, setShowAnalyzer] = useState(false);
  const [showOptimizer, setShowOptimizer] = useState(false);

  // 优化应用弹窗状态
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [optimizedPromptToApply, setOptimizedPromptToApply] = useState('');

  const compiledPrompt = useMemo(() => {
    const parts = selectedModuleIds.map(id => modules.find(m => m.id === id)?.content).filter(Boolean);
    if (config.appendString) parts.push(`\n[System Note]: ${config.appendString}`);
    return parts.join('\n\n');
  }, [selectedModuleIds, modules, config.appendString]);

  const handleAddModule = useCallback((id: string) => {
    setSelectedModuleIds(prev => [...prev, id]);
    if (window.innerWidth < 768) setMobileSection('assembly');
  }, [setSelectedModuleIds]);

  const handleRemoveModule = useCallback((index: number) => {
    setSelectedModuleIds(prev => prev.filter((_, i) => i !== index));
  }, [setSelectedModuleIds]);

  const handleReorderModules = useCallback((newOrder: string[]) => {
    setSelectedModuleIds(newOrder);
  }, [setSelectedModuleIds]);

  const handleRun = async () => {
    if (!compiledPrompt) return;
    setIsRunning(true);
    setResult(null);
    setExecutionError(null);
    const startTime = Date.now();

    try {
      const output = await generateResponse(compiledPrompt, config, userApiKey);
      if (output.startsWith('ERR_')) throw new Error(output);
      setResult(output);
      addLog({ id: generateUUID(), templateId: 'unsaved', templateName, finalPrompt: compiledPrompt, output, status: 'success', timestamp: Date.now(), durationMs: Date.now() - startTime });
    } catch (e: unknown) {
      const error = e as Error;
      setExecutionError(error.message);
      addLog({ id: generateUUID(), templateId: 'unsaved', templateName, finalPrompt: compiledPrompt, output: '', status: 'failure', notes: error.message, timestamp: Date.now(), durationMs: Date.now() - startTime });
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

  // 分析提示词质量
  const handleAnalyze = async () => {
    if (!compiledPrompt || !userApiKey) {
      alert(lang === 'zh' ? '请先添加模块并配置 API Key' : 'Please add modules and configure API Key first');
      return;
    }

    setIsAnalyzing(true);
    try {
      const result = await optimizerService.analyzePrompt(compiledPrompt, userApiKey);
      if (result) {
        setAnalysis(result);
        setShowAnalyzer(true);
      }
    } catch (error: unknown) {
      const err = error as Error;
      alert(lang === 'zh' ? `分析失败: ${err.message}` : `Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 优化提示词
  const handleOptimize = async () => {
    if (!compiledPrompt || !userApiKey) {
      alert(lang === 'zh' ? '请先添加模块并配置 API Key' : 'Please add modules and configure API Key first');
      return;
    }

    setIsOptimizing(true);
    try {
      const result = await optimizerService.improvePrompt(compiledPrompt, userApiKey);
      if (result) {
        setOptimization(result);
        setShowOptimizer(true);
      }
    } catch (error: unknown) {
      const err = error as Error;
      alert(lang === 'zh' ? `优化失败: ${err.message}` : `Optimization failed: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  // 应用优化后的提示词 - 打开选择弹窗
  const handleApplyOptimization = (optimizedPrompt: string) => {
    setOptimizedPromptToApply(optimizedPrompt);
    setShowOptimizer(false);
    setShowApplyModal(true);
  };

  // 创建新模块
  const handleCreateModuleFromOptimization = (content: string, title: string, type: ModuleType) => {
    const newModule: PromptModule = {
      id: generateUUID(),
      title,
      content,
      type,
      tags: [lang === 'zh' ? 'AI优化' : 'AI Optimized'],
      createdAt: Date.now(),
    };
    onAddModule(newModule);
    // 添加到当前选中列表
    setSelectedModuleIds(prev => [...prev, newModule.id]);
  };

  // 替换当前组合
  const handleReplaceWithOptimization = (content: string) => {
    // 创建一个临时模块替换当前选中的所有模块
    const tempModule: PromptModule = {
      id: generateUUID(),
      title: lang === 'zh' ? '优化后的 Prompt' : 'Optimized Prompt',
      content,
      type: ModuleType.OTHER,
      tags: [lang === 'zh' ? 'AI优化' : 'AI Optimized'],
      createdAt: Date.now(),
    };
    onAddModule(tempModule);
    // 替换当前选中为新模块
    setSelectedModuleIds([tempModule.id]);
  };

  // 复制到剪贴板
  const handleCopyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 overflow-hidden relative font-sans md:rounded-tl-xl md:border-l md:border-t md:border-slate-200">
      {/* Mobile Tab Switcher */}
      <div className="md:hidden flex border-b border-slate-200 bg-white shrink-0 z-20">
        {[{ id: 'resources', icon: Box, label: t.builder.tabResources }, { id: 'assembly', icon: Layout, label: t.builder.tabAssembly }, { id: 'preview', icon: Eye, label: t.builder.tabPreview }].map(tab => (
          <button key={tab.id} onClick={() => setMobileSection(tab.id as 'resources' | 'assembly' | 'preview')} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors ${mobileSection === tab.id ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' : 'text-slate-500'}`}>
            <tab.icon size={14} /> {tab.label}
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <Layers size={14} />
                  <span className="text-xs font-bold uppercase tracking-widest">{t.builder.flowTitle}</span>
                </div>
                <div className="flex items-center gap-2">
                  {/* 撤销/重做按钮 */}
                  <button
                    onClick={undo}
                    disabled={!canUndo}
                    className={`p-1.5 rounded transition-colors ${canUndo ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                    title={lang === 'zh' ? '撤销 (Cmd+Z)' : 'Undo (Cmd+Z)'}
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    onClick={redo}
                    disabled={!canRedo}
                    className={`p-1.5 rounded transition-colors ${canRedo ? 'text-slate-500 hover:text-slate-700 hover:bg-slate-100' : 'text-slate-300 cursor-not-allowed'}`}
                    title={lang === 'zh' ? '重做 (Cmd+Shift+Z)' : 'Redo (Cmd+Shift+Z)'}
                  >
                    <Redo2 size={14} />
                  </button>
                  <div className="w-px h-4 bg-slate-200 mx-1"></div>
                  <button onClick={() => saveTemplate({ id: generateUUID(), name: templateName, description: 'Builder Session', moduleIds: selectedModuleIds, config, createdAt: Date.now(), updatedAt: Date.now() })} className="text-xs flex items-center gap-1.5 text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"><Save size={14} /> <span>{t.builder.saveTemplateBtn}</span></button>
                </div>
              </div>
              <input className="text-2xl font-bold bg-transparent border-none focus:ring-0 p-0 text-slate-900 w-full outline-none" value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder={t.builder.untitledTemplate} />
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center cursor-pointer" onClick={() => setSectionsOpen(p => ({ ...p, structure: !p.structure }))}><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</div><span className="text-xs font-bold text-slate-700 uppercase">{t.builder.structureTitle}</span></div><ChevronDown size={14} className={`text-slate-400 transition-transform ${sectionsOpen.structure ? 'rotate-180' : ''}`} /></div>
              {sectionsOpen.structure && (
                <div className="p-5 bg-slate-50/30">
                  {selectedModuleIds.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 flex flex-col items-center justify-center text-center">
                      <Plus size={20} className="text-slate-400 mb-2" />
                      <p className="text-sm font-medium text-slate-600">{t.builder.startBuilding}</p>
                    </div>
                  ) : (
                    <DraggableModuleList
                      moduleIds={selectedModuleIds}
                      modules={modules}
                      onReorder={handleReorderModules}
                      onRemove={handleRemoveModule}
                      lang={lang}
                    />
                  )}
                </div>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b flex justify-between items-center cursor-pointer" onClick={() => setSectionsOpen(p => ({ ...p, params: !p.params }))}><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">2</div><span className="text-xs font-bold text-slate-700 uppercase">{t.builder.paramTitle}</span></div><ChevronDown size={14} className={`text-slate-400 transition-transform ${sectionsOpen.params ? 'rotate-180' : ''}`} /></div>
              {sectionsOpen.params && (<div className="p-5 space-y-4"><div className="grid grid-cols-2 gap-4"><div><label className="text-[10px] font-bold text-slate-500 uppercase">{t.builder.model}</label><select className="prod-input text-xs" value={config.model} onChange={e => setConfig({ ...config, model: e.target.value })}>{AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</select></div><div><label className="text-[10px] font-bold text-slate-500 uppercase">{t.builder.temperature}: {config.temperature}</label><input type="range" min="0" max="2" step="0.1" className="w-full accent-blue-600" value={config.temperature} onChange={e => setConfig({ ...config, temperature: parseFloat(e.target.value) })} /></div></div><div><label className="text-[10px] font-bold text-slate-500 uppercase">{t.builder.fixedEnding}</label><textarea className="prod-input min-h-[60px] text-xs font-mono" value={config.appendString} onChange={e => setConfig({ ...config, appendString: e.target.value })} /></div></div>)}
            </div>
          </div>
        </div>
      </div>

      <div className={`w-full md:w-96 border-l border-slate-200 flex flex-col bg-white shrink-0 ${mobileSection === 'preview' ? 'flex-1' : 'hidden md:flex'}`}>
        <div className="p-5 border-b sticky top-0 bg-white z-10">
          <h3 className="text-sm font-bold text-slate-800 mb-4">{t.builder.runnerTitle}</h3>
          <button
            onClick={handleRun}
            disabled={isRunning || !selectedModuleIds.length}
            className={`w-full py-3 font-bold flex items-center justify-center gap-2 rounded-lg transition-all mb-3 ${isRunning || !selectedModuleIds.length ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md active:scale-95'}`}
          >
            {isRunning ? <><RefreshCcw size={16} className="animate-spin" /> {t.builder.processing}</> : <><Play size={16} fill="currentColor" /> {t.builder.runBtn}</>}
          </button>

          {/* 智能优化按钮 */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !selectedModuleIds.length}
              className={`py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all ${isAnalyzing || !selectedModuleIds.length ? 'bg-slate-100 text-slate-400' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'}`}
            >
              {isAnalyzing ? <RefreshCcw size={14} className="animate-spin" /> : <BarChart3 size={14} />}
              <span className="text-xs">{isAnalyzing ? t.optimizer.analyzing : t.optimizer.analyze}</span>
            </button>
            <button
              onClick={handleOptimize}
              disabled={isOptimizing || !selectedModuleIds.length}
              className={`py-2.5 text-sm font-semibold flex items-center justify-center gap-2 rounded-lg transition-all ${isOptimizing || !selectedModuleIds.length ? 'bg-slate-100 text-slate-400' : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border border-yellow-200'}`}
            >
              {isOptimizing ? <RefreshCcw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span className="text-xs">{isOptimizing ? t.optimizer.optimizing : t.optimizer.optimize}</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 font-mono text-xs bg-slate-50">
          {executionError && <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg mb-4 flex items-center gap-2 font-bold"><AlertCircle size={14} /> {executionError}</div>}
          {!result && !isRunning && <div className="h-full flex flex-col items-center justify-center text-slate-300"><ArrowRight size={32} className="opacity-20 mb-2" /><p className="text-[10px] uppercase font-bold tracking-widest">{t.builder.awaitingInput}</p></div>}
          {result && (<div className="animate-in fade-in"><div className="flex justify-between items-center mb-3 text-slate-400 uppercase font-bold"><span className="text-[10px]">{t.builder.outputTitle}</span><div className="flex gap-2"><button onClick={() => navigator.clipboard.writeText(result)} className="hover:text-blue-600"><Copy size={14} /></button></div></div>{result.startsWith('[IMAGE') ? <img src={result.split(' ')[2]} className="w-full rounded border" /> : <div className="whitespace-pre-wrap leading-relaxed text-slate-800">{result}</div>}</div>)}
        </div>
      </div>

      {/* 分析模态框 */}
      {showAnalyzer && analysis && (
        <PromptAnalyzer
          analysis={analysis}
          lang={lang}
          onClose={() => setShowAnalyzer(false)}
        />
      )}

      {/* 优化模态框 */}
      {showOptimizer && optimization && (
        <PromptOptimizer
          optimization={optimization}
          lang={lang}
          onApply={handleApplyOptimization}
          onClose={() => setShowOptimizer(false)}
        />
      )}

      {/* 优化应用选择弹窗 */}
      <OptimizationApplyModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        optimizedPrompt={optimizedPromptToApply}
        onCreateModule={handleCreateModuleFromOptimization}
        onReplaceModules={handleReplaceWithOptimization}
        onCopyToClipboard={handleCopyToClipboard}
        lang={lang}
      />
    </div>
  );
};
