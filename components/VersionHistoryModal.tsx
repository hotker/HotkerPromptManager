import React, { useState, useEffect } from 'react';
import { ModuleVersion, TemplateVersion, PromptModule, PromptTemplate } from '../types';
import { Clock, Tag, RotateCcw, X, GitBranch, Star, StarOff, AlertCircle, Check } from 'lucide-react';
import { Language, translations } from '../translations';
import { versionService } from '../services/versionService';

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemId: string;
    itemType: 'module' | 'template';
    userId: string;
    onRestore: (version: PromptModule | PromptTemplate) => void;
    lang: Language;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
    isOpen,
    onClose,
    itemId,
    itemType,
    userId,
    onRestore,
    lang
}) => {
    const [versions, setVersions] = useState<(ModuleVersion | TemplateVersion)[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [tagModalOpen, setTagModalOpen] = useState(false);
    const [tagName, setTagName] = useState('');
    const [taggingVersionId, setTaggingVersionId] = useState<string | null>(null);

    const t = translations[lang];

    // 加载版本历史
    useEffect(() => {
        if (isOpen && itemId) {
            loadVersions();
        }
    }, [isOpen, itemId, itemType]);

    const loadVersions = async () => {
        setLoading(true);
        try {
            const data = itemType === 'module'
                ? await versionService.getModuleVersions(itemId, userId)
                : await versionService.getTemplateVersions(itemId, userId);
            setVersions(data);
        } catch (error) {
            console.error('Load versions error:', error);
        } finally {
            setLoading(false);
        }
    };

    // 恢复版本
    const handleRestore = async (versionId: string) => {
        if (!window.confirm(t.library.confirmRestore.replace('{version}', versionId))) {
            return;
        }

        const result = await versionService.restoreVersion(versionId, itemType);
        if (result?.success) {
            onRestore(result.version);
            alert(t.library.restoreSuccess);
            onClose();
        } else {
            alert('恢复失败，请重试');
        }
    };

    // 打开标记对话框
    const openTagModal = (versionId: string, currentTagName?: string) => {
        setTaggingVersionId(versionId);
        setTagName(currentTagName || '');
        setTagModalOpen(true);
    };

    // 保存标签
    const saveTag = async () => {
        if (!taggingVersionId || !tagName.trim()) return;

        const success = await versionService.tagVersion(taggingVersionId, tagName.trim(), itemType);
        if (success) {
            setTagModalOpen(false);
            setTagName('');
            setTaggingVersionId(null);
            loadVersions(); // 重新加载
        } else {
            alert('标记失败，请重试');
        }
    };

    // 取消标签
    const removeTag = async (versionId: string) => {
        const success = await versionService.untagVersion(versionId, itemType);
        if (success) {
            loadVersions();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-slate-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <Clock className="w-6 h-6 text-yellow-400" />
                        <h2 className="text-2xl font-bold text-yellow-400">{t.library.versionHistory}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-700 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="text-center py-12 text-gray-400">
                            <Clock className="w-12 h-12 mx-auto mb-4 animate-spin" />
                            <p>加载版本历史...</p>
                        </div>
                    ) : versions.length === 0 ? (
                        <div className="text-center py-12 text-gray-400">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                            <p>{t.library.noVersionHistory}</p>
                            <p className="text-sm mt-2">{t.library.createFirstVersion}</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {versions.map((version, index) => (
                                <div
                                    key={version.id}
                                    className={`
                    p-4 rounded-lg border-2 transition cursor-pointer
                    ${selectedVersion === version.id
                                            ? 'border-yellow-400 bg-slate-700'
                                            : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                                        }
                  `}
                                    onClick={() => setSelectedVersion(version.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            {/* Version Header */}
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="px-3 py-1 bg-yellow-400/20 text-yellow-400 rounded-full text-sm font-mono">
                                                    v{version.versionNumber}
                                                </span>
                                                {index === 0 && (
                                                    <span className="px-2 py-1 bg-green-400/20 text-green-400 rounded text-xs">
                                                        最新
                                                    </span>
                                                )}
                                                {version.isTagged && (
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-purple-400/20 text-purple-400 rounded text-xs">
                                                        <Star className="w-3 h-3 fill-current" />
                                                        <span>{version.tagName}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Version Info */}
                                            <div className="text-sm text-gray-300 space-y-1">
                                                <p className="font- medium">{itemType === 'module' ? (version as ModuleVersion).title : (version as TemplateVersion).name}</p>
                                                {version.changeSummary && (
                                                    <p className="text-gray-400 italic">{version.changeSummary}</p>
                                                )}
                                                <p className="text-xs text-gray-500">
                                                    {versionService.formatTimestamp(version.createdAt)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex gap-2 ml-4">
                                            {version.isTagged ? (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        removeTag(version.id);
                                                    }}
                                                    className="p-2 hover:bg-purple-400/20 rounded transition"
                                                    title="取消标记"
                                                >
                                                    <StarOff className="w-4 h-4 text-purple-400" />
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openTagModal(version.id, version.tagName);
                                                    }}
                                                    className="p-2 hover:bg-slate-600 rounded transition"
                                                    title={t.library.tagVersion}
                                                >
                                                    <Tag className="w-4 h-4 text-gray-400" />
                                                </button>
                                            )}
                                            {index !== 0 && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRestore(version.id);
                                                    }}
                                                    className="p-2 hover:bg-yellow-400/20 rounded transition"
                                                    title={t.library.restoreVersion}
                                                >
                                                    <RotateCcw className="w-4 h-4 text-yellow-400" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-700 flex justify-between items-center">
                    <p className="text-sm text-gray-400">
                        共 {versions.length} 个版本
                    </p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                    >
                        关闭
                    </button>
                </div>
            </div>

            {/* Tag Modal */}
            {tagModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
                    <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-bold text-yellow-400 mb-4">{t.library.tagVersion}</h3>
                        <input
                            type="text"
                            value={tagName}
                            onChange={(e) => setTagName(e.target.value)}
                            placeholder={t.library.tagName}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:border-yellow-400 focus:outline-none mb-4"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') saveTag();
                                if (e.key === 'Escape') setTagModalOpen(false);
                            }}
                        />
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setTagModalOpen(false)}
                                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition"
                            >
                                取消
                            </button>
                            <button
                                onClick={saveTag}
                                disabled={!tagName.trim()}
                                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                保存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
