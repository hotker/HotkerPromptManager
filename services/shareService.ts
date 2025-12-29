import { Share, CreateShareRequest, ShareAccessRequest } from '../types';

/**
 * 分享管理服务
 */
export const shareService = {
    /**
     * 创建分享
     */
    async createShare(request: CreateShareRequest): Promise<{
        success: boolean;
        shareId: string;
        shareKey: string;
        shareUrl: string;
        hasPassword: boolean;
        expiresAt?: number;
    } | null> {
        try {
            const res = await fetch('/api/shares/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            if (!res.ok) throw new Error('Failed to create share');
            return await res.json();
        } catch (error) {
            console.error('Create share error:', error);
            return null;
        }
    },

    /**
     * 访问分享
     */
    async accessShare(request: ShareAccessRequest): Promise<Share | null> {
        try {
            const res = await fetch('/api/shares/access', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to access share');
            }

            const data = await res.json();
            return data.share;
        } catch (error) {
            console.error('Access share error:', error);
            throw error;
        }
    },

    /**
     * 记录导入
     */
    async trackImport(shareKey: string): Promise<void> {
        try {
            await fetch('/api/shares/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ shareKey })
            });
        } catch (error) {
            console.error('Track import error:', error);
        }
    },

    /**
     * 获取我的分享列表
     */
    async getMyShares(userId: string): Promise<Share[]> {
        try {
            const res = await fetch(`/api/shares/my-shares?userId=${userId}`);
            if (!res.ok) throw new Error('Failed to fetch shares');
            return await res.json();
        } catch (error) {
            console.error('Get shares error:', error);
            return [];
        }
    },

    /**
     * 删除分享
     */
    async deleteShare(shareId: string, userId: string): Promise<boolean> {
        try {
            const res = await fetch(`/api/shares/${shareId}?userId=${userId}`, {
                method: 'DELETE'
            });
            return res.ok;
        } catch (error) {
            console.error('Delete share error:', error);
            return false;
        }
    },

    /**
     * 生成二维码URL（使用第三方服务）
     */
    generateQRCodeUrl(url: string): string {
        return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`;
    }
};
