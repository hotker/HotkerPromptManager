import React from 'react';
import { AnalysisResult } from '../services/optimizerService';
import { Language, translations } from '../translations';
import { BarChart3, AlertCircle, Lightbulb, TrendingUp } from 'lucide-react';

interface PromptAnalyzerProps {
  analysis: AnalysisResult;
  lang: Language;
  onClose: () => void;
}

export const PromptAnalyzer: React.FC<PromptAnalyzerProps> = ({
  analysis,
  lang,
  onClose
}) => {
  const t = translations[lang];

  const getDimensionColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 90) return lang === 'zh' ? '优秀' : 'Excellent';
    if (score >= 80) return lang === 'zh' ? '良好' : 'Good';
    if (score >= 60) return lang === 'zh' ? '一般' : 'Fair';
    return lang === 'zh' ? '需改进' : 'Needs Improvement';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-slate-900">
              {t.optimizer.analysisComplete}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Overall Score */}
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-600">
                {t.optimizer.overallScore}
              </span>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex items-end gap-4">
              <div className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {analysis.overallScore}
              </div>
              <div className="mb-3">
                <span className="text-2xl font-bold text-slate-400">/100</span>
                <div className="text-sm font-semibold text-slate-600 mt-1">
                  {getScoreLabel(analysis.overallScore)}
                </div>
              </div>
            </div>
          </div>

          {/* Dimension Scores */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {lang === 'zh' ? '维度评分' : 'Dimension Scores'}
            </h3>
            <div className="space-y-3">
              {Object.entries(analysis.dimensions).map(([key, score]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold text-slate-700">
                      {t.optimizer[key as keyof typeof t.optimizer]}
                    </span>
                    <span className="font-bold text-slate-900">{score}</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${getDimensionColor(score)} transition-all duration-500`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          {analysis.issues && analysis.issues.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                {t.optimizer.issues}
              </h3>
              <div className="space-y-2">
                {analysis.issues.map((issue, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-xl"
                  >
                    <span className="text-red-600 font-bold text-sm mt-0.5">•</span>
                    <span className="text-sm text-red-900 flex-1">{issue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions && analysis.suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-600" />
                {t.optimizer.suggestions}
              </h3>
              <div className="space-y-2">
                {analysis.suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    className="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-xl"
                  >
                    <span className="text-yellow-600 font-bold text-sm mt-0.5">💡</span>
                    <span className="text-sm text-yellow-900 flex-1">{suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Issues */}
          {(!analysis.issues || analysis.issues.length === 0) && 
           (!analysis.suggestions || analysis.suggestions.length === 0) && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-semibold text-slate-900 mb-2">
                {t.optimizer.noIssues}
              </p>
              <p className="text-sm text-slate-600">
                {lang === 'zh' ? '您的提示词质量很好！' : 'Your prompt quality is great!'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
          >
            {lang === 'zh' ? '关闭' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
