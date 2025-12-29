import React, { useState } from 'react';
import { PromptModule, PromptTemplate, User } from '../types';
import { Share2, Copy, QrCode, Lock, Calendar, X, Check } from 'lucide-react';
import { Language, translations } from '../translations';
import { shareService } from '../services/shareService';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: PromptModule | PromptTemplate;
    itemType: 'module' | 'template';
    currentUser: User;
    lang: Language;
}

export const ShareModal: React.FC<ShareModalProps> = ({
    isOpen,
    onClose,
    item,
    itemType,
    currentUser,
    lang
}) => {
    const [password, setPassword] = useState('');
    const [expiresInDays, setExpiresInDays] = useState<number | null>(7);
    const [isCreating, setIsCreating] = useState(false);
    const [shareResult, setShareResult] = useState<{
        shareUrl: string;
        shareKey: string;
        hasPassword: boolean;
    } | null>(null);
    const [showQRCode, setShowQRCode] = useState(false);

    const t = translations[lang];

    const handleCreateShare = async () => {
        setIsCreating(true);
        try {
            const result = await shareService.createShare({
                userId: currentUser.id,
                shareType: itemType,
                title: 'title' in item ? item.title : item.name,
                description: item.description || '',
                data: item,
                password: password || undefined,
                expiresInDays: expiresInDays || undefined
            });

            if (result) {
                setShareResult({
                    shareUrl: result.shareUrl,
                    shareKey: result.shareKey,
                    hasPassword: result.hasPassword
                });
            }
        } catch (error) {
            alert('创建分享失败，请重试');
        } finally {
            setIsCreating(false);
        }
    };

    const handleCopyLink = () => {
        if (shareResult) {
            navigator.clipboard.writeText(shareResult.shareUrl);
            alert(t.library.linkCopied);
        }
    };

    const handleCopyKey = () => {
        if (shareResult) {
            navigator.clipboard.writeText(shareResult.shareKey);
            alert(t.library.linkCopied);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                        <Share2 className="w-6 h-6 text-blue-600" />
                        <h2 className="text-2xl font-bold text-slate-900">{t.library.shareModule}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                        <X className="w-5 h-5 text-slate-600" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {!shareResult ? (
                        <div className="space-y-6">
                            {/* Item Info */}
                            <div className="bg-slate-50 rounded-xl p-4">
                                <h3 className="font-bold text-slate-900 mb-2">
                                    {'title' in item ? item.title : item.name}
                                </h3>
                                {item.description && (
                                    <p className="text-sm text-slate-600">{item.description}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Lock className="w-4 h-4" />
                                    {t.library.setPassword}
                                </label>
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t.library.passwordOptional}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:border-blue-500 focus:outline-none"
                                />
                                <p className="text-xs text-slate-500">
                                    {lang === 'zh' ? '留空表示无需密码即可访问' : 'Leave empty for public access'}
                                </p>
                            </div>

                            {/* Expiration */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                                    <Calendar className="w-4 h-4" />
                                    {t.library.expiresIn}
                                </label>
                                <div className="flex gap-2">
                                    {[1, 7, 30].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => setExpiresInDays(days)}
                                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${expiresInDays === days
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            {days} {t.library.days}
                                        </button>
                                    ))}
                                    <button
                                        onClick={() => setExpiresInDays(null)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${expiresInDays === null
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                            }`}
                                    >
                                        {t.library.neverExpire}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Success Message */}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
                                <Check className="w-5 h-5 text-green-600 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-green-900">{t.library.shareCreated}</p>
                                    <p className="text-sm text-green-700 mt-1">
                                        {lang === 'zh' ? '其他人可以通过以下链接或分享码导入此提示词' : 'Others can import this prompt using the link or share code below'}
                                    </p>
                                </div>
                            </div>

                            {/* Share Link */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    {t.library.shareLink}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shareResult.shareUrl}
                                        readOnly
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                                    />
                                    <button
                                        onClick={handleCopyLink}
                                        className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition flex items-center gap-2"
                                    >
                                        <Copy className="w-4 h-4" />
                                        {t.library.copyLink}
                                    </button>
                                </div>
                            </div>

                            {/* Share Key */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-700">
                                    {lang === 'zh' ? '分享码' : 'Share Code'}
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={shareResult.shareKey}
                                        readOnly
                                        className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-center text-2xl font-bold tracking-wider"
                                    />
                                    <button
                                        onClick={handleCopyKey}
                                        className="px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl transition"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="space-y-2">
                                <button
                                    onClick={() => setShowQRCode(!showQRCode)}
                                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                                >
                                    <QrCode className="w-4 h-4" />
                                    {showQRCode ? (lang === 'zh' ? '隐藏二维码' : 'Hide QR Code') : t.library.qrCode}
                                </button>
                                {showQRCode && (
                                    <div className="flex justify-center p-4 bg-white rounded-xl border border-slate-200">
                                        <img
                                            src={shareService.generateQRCodeUrl(shareResult.shareUrl)}
                                            alt="QR Code"
                                            className="w-48 h-48"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Info */}
                            {shareResult.hasPassword && (
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                    <p className="text-sm text-yellow-800">
                                        <Lock className="w-4 h-4 inline mr-1" />
                                        {lang === 'zh' ? '此分享已设置密码保护' : 'This share is password protected'}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
                    {!shareResult ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition"
                            >
                                {lang === 'zh' ? '取消' : 'Cancel'}
                            </button>
                            <button
                                onClick={handleCreateShare}
                                disabled={isCreating}
                                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                {isCreating ? (lang === 'zh' ? '创建中...' : 'Creating...') : t.library.createShare}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition"
                        >
                            {lang === 'zh' ? '完成' : 'Done'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
