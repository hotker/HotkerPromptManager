import React, { useState } from 'react';
import { PromptModule, PromptTemplate } from '../types';
import { Download, Lock, AlertCircle, X } from 'lucide-react';
import { Language, translations } from '../translations';
import { shareService } from '../services/shareService';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (item: PromptModule | PromptTemplate, type: 'module' | 'template') => void;
    lang: Language;
}

export const ImportModal: React.FC<ImportModalProps> = ({
    isOpen,
    onClose,
    onImport,
    lang
}) => {
    const [shareInput, setShareInput] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [requiresPassword, setRequiresPassword] = useState(false);

    const t = translations[lang];

    const extractShareKey = (input: string): string => {
        // 从完整 URL 中提取分享码
        const urlMatch = input.match(/\/share\/([a-z0-9]+)/i);
        if (urlMatch) return urlMatch[1];

        // 直接返回输入（假设是分享码）
        return input.trim();
    };

    const handleImport = async () => {
        if (!shareInput.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const shareKey = extractShareKey(shareInput);
            const share = await shareService.accessShare({
                shareKey,
                password: password || undefined
            });

            if (share) {
                // 记录导入统计
                await shareService.trackImport(shareKey);

                // 导入数据
                const itemType = share.shareType as 'module' | 'template';
                onImport(share.dataJson as any, itemType);

                // 显示成功消息
                alert(t.library.importSuccess);

                // 重置并关闭
                setShareInput('');
                setPassword('');
                setRequiresPassword(false);
                onClose();
            }
        } catch (err: any) {
            console.error('Import error:', err);

            if (err.message.includes('password')) {
                setRequiresPassword(true);
                setError(t.library.wrongPassword);
            } else if (err.message.includes('expired')) {
                setError(t.library.shareExpired);
            } else if (err.message.includes('not found')) {
                setError(t.library.invalidShare);
            } else {
                setError(err.message || (lang === 'zh' ? '导入失败' : 'Import failed'));
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setShareInput('');
        setPassword('');
        setError(null);
        setRequiresPassword(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Download className="w-6 h-6 text-green-600" />
                        <h2 className="text-2xl font-bold text-slate-900">{t.library.importPrompt}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                                <p className="text-sm font-semibold text-red-900">{error}</p>
                            </div>
                            <button
                                onClick={handleReset}
                                className="text-xs text-red-600 hover:text-red-700 font-medium"
                            >
                                {lang === 'zh' ? '重试' : 'Retry'}
                            </button>
                        </div>
                    )}

                    {/* Share Link/Code Input */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-slate-700">
                            {t.library.enterShareLink}
                        </label>
                        <input
                            type="text"
                            value={shareInput}
                            onChange={(e) => setShareInput(e.target.value)}
                            placeholder={lang === 'zh' ? '粘贴分享链接或输入分享码' : 'Paste share link or enter share code'}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-green-500 focus:outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && shareInput.trim()) {
                                    handleImport();
                                }
                            }}
                        />
                        <p className="text-xs text-slate-500">
                            {lang === 'zh'
                                ? '支持完整链接（http://...）或分享码'
                                : 'Supports full URL (http://...) or share code'}
                        </p>
                    </div>

                    {/* Password Input (conditional) */}
                    {requiresPassword && (
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                <Lock className="w-4 h-4" />
                                {t.library.enterPassword}
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={lang === 'zh' ? '此分享需要密码' : 'This share requires a password'}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-green-500 focus:outline-none"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && password.trim()) {
                                        handleImport();
                                    }
                                }}
                                autoFocus
                            />
                        </div>
                    )}

                    {/* Instructions */}
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                        <p className="text-sm text-blue-900 font-semibold mb-2">
                            {lang === 'zh' ? '📝 使用说明' : '📝 Instructions'}
                        </p>
                        <ul className="text-xs text-blue-800 space-y-1">
                            <li>• {lang === 'zh' ? '从他人获取分享链接或分享码' : 'Get a share link or code from others'}</li>
                            <li>• {lang === 'zh' ? '粘贴到上方输入框中' : 'Paste it in the input above'}</li>
                            <li>• {lang === 'zh' ? '如需密码，输入后点击导入' : 'Enter password if required'}</li>
                            <li>• {lang === 'zh' ? '导入的提示词会自动添加到你的库中' : 'Imported prompts will be added to your library'}</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
                    >
                        {lang === 'zh' ? '取消' : 'Cancel'}
                    </button>
                    <button
                        onClick={handleImport}
                        disabled={isLoading || !shareInput.trim()}
                        className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        {isLoading ? (lang === 'zh' ? '导入中...' : 'Importing...') : (lang === 'zh' ? '导入' : 'Import')}
                    </button>
                </div>
            </div>
        </div>
    );
};
