import React from 'react';
import { X, Plus, RefreshCcw, Copy, Check } from 'lucide-react';
import { Language, translations } from '../translations';
import { ModuleType } from '../types';

interface OptimizationApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  optimizedPrompt: string;
  onCreateModule: (content: string, title: string, type: ModuleType) => void;
  onReplaceModules: (content: string) => void;
  onCopyToClipboard: (content: string) => void;
  lang: Language;
}

export const OptimizationApplyModal: React.FC<OptimizationApplyModalProps> = ({
  isOpen,
  onClose,
  optimizedPrompt,
  onCreateModule,
  onReplaceModules,
  onCopyToClipboard,
  lang,
}) => {
  const t = translations[lang];
  const [copied, setCopied] = React.useState(false);
  const [showCreateForm, setShowCreateForm] = React.useState(false);
  const [newModuleTitle, setNewModuleTitle] = React.useState('');
  const [newModuleType, setNewModuleType] = React.useState<ModuleType>(ModuleType.OTHER);

  if (!isOpen) return null;

  const handleCopy = () => {
    onCopyToClipboard(optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateModule = () => {
    if (!newModuleTitle.trim()) return;
    onCreateModule(optimizedPrompt, newModuleTitle.trim(), newModuleType);
    setShowCreateForm(false);
    setNewModuleTitle('');
    onClose();
  };

  const handleReplace = () => {
    onReplaceModules(optimizedPrompt);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-slate-900">
            {lang === 'zh' ? '应用优化结果' : 'Apply Optimization'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Preview */}
        <div className="px-8 py-6">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">
            {lang === 'zh' ? '优化后的 Prompt' : 'Optimized Prompt'}
          </label>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-h-[300px] overflow-y-auto">
            <pre className="font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {optimizedPrompt}
            </pre>
          </div>
        </div>

        {/* Create Module Form (Conditional) */}
        {showCreateForm && (
          <div className="px-8 py-4 bg-blue-50 border-t border-blue-100">
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
                  {lang === 'zh' ? '模块标题' : 'Module Title'}
                </label>
                <input
                  type="text"
                  value={newModuleTitle}
                  onChange={(e) => setNewModuleTitle(e.target.value)}
                  placeholder={lang === 'zh' ? '输入模块标题...' : 'Enter module title...'}
                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="w-32">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
                  {lang === 'zh' ? '类型' : 'Type'}
                </label>
                <select
                  value={newModuleType}
                  onChange={(e) => setNewModuleType(e.target.value as ModuleType)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                >
                  {Object.values(ModuleType).map((type) => (
                    <option key={type} value={type}>
                      {t.moduleType[type as keyof typeof t.moduleType] || type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700"
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleCreateModule}
                disabled={!newModuleTitle.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lang === 'zh' ? '创建' : 'Create'}
              </button>
            </div>
          </div>
        )}

        {/* Actions */}
        {!showCreateForm && (
          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-4">
              {lang === 'zh' ? '请选择如何应用优化结果:' : 'Choose how to apply the optimization:'}
            </p>
            <div className="grid grid-cols-3 gap-3">
              {/* Create New Module */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {lang === 'zh' ? '创建新模块' : 'Create Module'}
                </span>
                <span className="text-[10px] text-slate-400 text-center">
                  {lang === 'zh' ? '添加到模块库' : 'Add to library'}
                </span>
              </button>

              {/* Replace Current */}
              <button
                onClick={handleReplace}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-yellow-400 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center group-hover:bg-yellow-500 group-hover:text-white transition-colors">
                  <RefreshCcw size={20} />
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {lang === 'zh' ? '替换当前组合' : 'Replace Current'}
                </span>
                <span className="text-[10px] text-slate-400 text-center">
                  {lang === 'zh' ? '用优化结果替换' : 'Use as current'}
                </span>
              </button>

              {/* Copy Only */}
              <button
                onClick={handleCopy}
                className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-2xl hover:border-green-400 hover:shadow-md transition-all group"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                  copied
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-600 group-hover:bg-green-600 group-hover:text-white'
                }`}>
                  {copied ? <Check size={20} /> : <Copy size={20} />}
                </div>
                <span className="text-xs font-semibold text-slate-700">
                  {copied
                    ? (lang === 'zh' ? '已复制' : 'Copied!')
                    : (lang === 'zh' ? '仅复制' : 'Copy Only')}
                </span>
                <span className="text-[10px] text-slate-400 text-center">
                  {lang === 'zh' ? '复制到剪贴板' : 'To clipboard'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
