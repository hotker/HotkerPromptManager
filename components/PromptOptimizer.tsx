import React from 'react';
import { OptimizationResult } from '../services/optimizerService';
import { Language, translations } from '../translations';
import { Sparkles, ArrowRight, X } from 'lucide-react';

interface PromptOptimizerProps {
    optimization: OptimizationResult;
    lang: Language;
    onApply: (optimizedPrompt: string) => void;
    onClose: () => void;
}

export const PromptOptimizer: React.FC<PromptOptimizerProps> = ({
    optimization,
    lang,
    onApply,
    onClose
}) => {
    const t = translations[lang];

    const handleApply = () => {
        onApply(optimization.optimized);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Sparkles className="w-6 h-6 text-purple-600" />
                        <h2 className="text-2xl font-bold text-slate-900">
                            {t.optimizer.optimizationComplete}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Original */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900">
                                    {t.optimizer.original}
                                </h3>
                                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                    {lang === 'zh' ? '原始版本' : 'Original'}
                                </span>
                            </div>
                            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-6 min-h-[300px]">
                                <pre className="font-mono text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
                                    {optimization.original}
                                </pre>
                            </div>
                        </div>

                        {/* Optimized */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    {t.optimizer.optimized}
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                </h3>
                                <span className="text-xs font-semibold text-purple-600 bg-purple-100 px-3 py-1 rounded-full">
                                    {lang === 'zh' ? 'AI 优化' : 'AI Optimized'}
                                </span>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 min-h-[300px]">
                                <pre className="font-mono text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
                                    {optimization.optimized}
                                </pre>
                            </div>
                        </div>
                    </div>

                    {/* Comparison Arrow (visible on large screens) */}
                    <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center justify-center w-16 h-16 bg-white rounded-full shadow-lg border-4 border-purple-200">
                        <ArrowRight className="w-8 h-8 text-purple-600" />
                    </div>

                    {/* Improvements Info */}
                    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-900">
                            <span className="font-bold">💡 {lang === 'zh' ? '提示' : 'Tip'}: </span>
                            {lang === 'zh'
                                ? 'AI 已根据最佳实践优化了您的提示词。请仔细检查优化后的内容，确保符合您的需求。'
                                : 'AI has optimized your prompt based on best practices. Please review the optimized content carefully to ensure it meets your needs.'}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
                    >
                        {lang === 'zh' ? '取消' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleApply}
                        className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-xl font-medium transition flex items-center gap-2 shadow-lg"
                    >
                        <Sparkles className="w-4 h-4" />
                        {t.optimizer.applyOptimization}
                    </button>
                </div>
            </div>
        </div>
    );
};
