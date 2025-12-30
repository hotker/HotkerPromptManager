import React, { useState, useEffect } from 'react';
import { Link2, Copy, Trash2, Eye, Download, Clock, Lock, Unlock, ExternalLink, RefreshCw, Package, FileText } from 'lucide-react';
import { User, Share } from '../types';
import { shareService } from '../services/shareService';
import { useToast } from './Toast';
import { Language, translations } from '../translations';

interface MySharesViewProps {
    currentUser: User;
    lang: Language;
}

interface ShareItem {
    id: string;
    shareKey: string;
    shareType: string;
    title: string;
    description?: string;
    viewCount: number;
    importCount: number;
    createdAt: number;
    expireAt?: number;
    hasPassword: boolean;
    isExpired: boolean;
}

export const MySharesView: React.FC<MySharesViewProps> = ({ currentUser, lang }) => {
    const [shares, setShares] = useState<ShareItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState<string | null>(null);
    const toast = useToast();
    const t = translations[lang];

    const loadShares = async () => {
        setLoading(true);
        try {
            const data = await shareService.getMyShares(currentUser.id);
            // Server returns data with hasPassword and isExpired fields
            setShares(data as any[]);
        } catch (e) {
            toast.error('加载分享列表失败');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadShares();
    }, [currentUser.id]);

    const handleCopyLink = (shareKey: string) => {
        const url = `${window.location.origin}/share/${shareKey}`;
        navigator.clipboard.writeText(url);
        toast.success('链接已复制');
    };

    const handleDelete = async (shareId: string) => {
        if (!confirm('确定要删除这个分享吗？删除后无法恢复。')) return;

        setDeleting(shareId);
        try {
            const success = await shareService.deleteShare(shareId, currentUser.id);
            if (success) {
                setShares(prev => prev.filter(s => s.id !== shareId));
                toast.success('删除成功');
            } else {
                toast.error('删除失败');
            }
        } catch (e) {
            toast.error('删除失败');
        } finally {
            setDeleting(null);
        }
    };

    const formatDate = (ts: number) => {
        return new Date(ts).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getShareTypeIcon = (type: string) => {
        if (type.includes('module')) return <FileText className="w-4 h-4" />;
        if (type.includes('template')) return <Package className="w-4 h-4" />;
        return <FileText className="w-4 h-4" />;
    };

    const getShareTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'module': '模块',
            'template': '模板',
            'batch_modules': '批量模块',
            'batch_templates': '批量模板'
        };
        return labels[type] || type;
    };

    return (
        <div className="h-full flex flex-col bg-white md:rounded-lg md:shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex-shrink-0 px-4 md:px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <Link2 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold text-slate-900">我的分享</h1>
                            <p className="text-sm text-slate-500">管理所有分享链接</p>
                        </div>
                    </div>
                    <button
                        onClick={loadShares}
                        disabled={loading}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 md:p-6">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : shares.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                        <Link2 className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-lg font-medium">暂无分享</p>
                        <p className="text-sm mt-1">在提示词库中选择模块进行分享</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {shares.map(share => (
                            <div
                                key={share.id}
                                className={`p-4 rounded-xl border transition-all ${share.isExpired
                                    ? 'bg-slate-50 border-slate-200 opacity-60'
                                    : 'bg-white border-slate-200 hover:border-violet-300 hover:shadow-md'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-700 rounded-full">
                                                {getShareTypeIcon(share.shareType)}
                                                {getShareTypeLabel(share.shareType)}
                                            </span>
                                            {share.hasPassword && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
                                                    <Lock className="w-3 h-3" />
                                                    密码保护
                                                </span>
                                            )}
                                            {share.isExpired && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                                    <Clock className="w-3 h-3" />
                                                    已过期
                                                </span>
                                            )}
                                        </div>

                                        <h3 className="font-medium text-slate-900 truncate">{share.title}</h3>
                                        {share.description && (
                                            <p className="text-sm text-slate-500 mt-1 line-clamp-2">{share.description}</p>
                                        )}

                                        <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatDate(share.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {share.viewCount} 次查看
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Download className="w-3 h-3" />
                                                {share.importCount} 次导入
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => handleCopyLink(share.shareKey)}
                                            className="p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                                            title="复制链接"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <a
                                            href={`/share/${share.shareKey}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="打开分享"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                        <button
                                            onClick={() => handleDelete(share.id)}
                                            disabled={deleting === share.id}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                            title="删除分享"
                                        >
                                            {deleting === share.id ? (
                                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            {!loading && shares.length > 0 && (
                <div className="flex-shrink-0 px-4 md:px-6 py-3 border-t border-slate-200 bg-slate-50/50">
                    <div className="flex items-center justify-between text-sm text-slate-500">
                        <span>共 {shares.length} 个分享</span>
                        <span>
                            总计 {shares.reduce((sum, s) => sum + s.viewCount, 0)} 次查看 ·
                            {shares.reduce((sum, s) => sum + s.importCount, 0)} 次导入
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};
