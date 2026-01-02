import { ModuleVersion, TemplateVersion, VersionDiff, PromptModule, PromptTemplate } from '../types';

/**
 * 版本管理服务
 * 提供版本历史的增删查改功能
 */
export const versionService = {
    /**
     * 获取模块版本历史
     */
    async getModuleVersions(moduleId: string, userId: string): Promise<ModuleVersion[]> {
        try {
            const res = await fetch(`/api/versions/module/${moduleId}?userId=${userId}`);
            if (!res.ok) throw new Error('Failed to fetch module versions');
            return await res.json();
        } catch (error) {
            console.error('Get module versions error:', error);
            return [];
        }
    },

    /**
     * 获取模板版本历史
     */
    async getTemplateVersions(templateId: string, userId: string): Promise<TemplateVersion[]> {
        try {
            const res = await fetch(`/api/versions/template/${templateId}?userId=${userId}`);
            if (!res.ok) throw new Error('Failed to fetch template versions');
            return await res.json();
        } catch (error) {
            console.error('Get template versions error:', error);
            return [];
        }
    },

    /**
     * 创建模块版本
     */
    async createModuleVersion(
        moduleId: string,
        userId: string,
        module: PromptModule,
        changeSummary?: string
    ): Promise<{ success: boolean; versionNumber: number; versionId: string } | null> {
        try {
            const res = await fetch('/api/versions/module', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ moduleId, userId, module, changeSummary })
            });
            if (!res.ok) throw new Error('Failed to create module version');
            return await res.json();
        } catch (error) {
            console.error('Create module version error:', error);
            return null;
        }
    },

    /**
     * 创建模板版本
     */
    async createTemplateVersion(
        templateId: string,
        userId: string,
        template: PromptTemplate,
        changeSummary?: string
    ): Promise<{ success: boolean; versionNumber: number; versionId: string } | null> {
        try {
            const res = await fetch('/api/versions/template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ templateId, userId, template, changeSummary })
            });
            if (!res.ok) throw new Error('Failed to create template version');
            return await res.json();
        } catch (error) {
            console.error('Create template version error:', error);
            return null;
        }
    },

    /**
     * 标记版本
     */
    async tagVersion(versionId: string, tagName: string, type: 'module' | 'template'): Promise<boolean> {
        try {
            const res = await fetch('/api/versions/tag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId, tagName, type })
            });
            return res.ok;
        } catch (error) {
            console.error('Tag version error:', error);
            return false;
        }
    },

    /**
     * 取消标记版本
     */
    async untagVersion(versionId: string, type: 'module' | 'template'): Promise<boolean> {
        try {
            const res = await fetch('/api/versions/untag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId, type })
            });
            return res.ok;
        } catch (error) {
            console.error('Untag version error:', error);
            return false;
        }
    },

    /**
     * 恢复到指定版本
     */
    async restoreVersion(
        versionId: string,
        type: 'module' | 'template'
    ): Promise<{ success: boolean; version: PromptModule | PromptTemplate } | null> {
        try {
            const res = await fetch('/api/versions/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ versionId, type })
            });
            if (!res.ok) throw new Error('Failed to restore version');
            return await res.json();
        } catch (error) {
            console.error('Restore version error:', error);
            return null;
        }
    },

    /**
     * 计算两个版本之间的差异
     */
    calculateDiff(oldVersion: Record<string, unknown>, newVersion: Record<string, unknown>): VersionDiff[] {
        const diffs: VersionDiff[] = [];
        const allKeys = new Set([...Object.keys(oldVersion), ...Object.keys(newVersion)]);

        allKeys.forEach(key => {
            // 跳过内部字段
            if (['id', 'createdAt', 'updatedAt', 'userId', 'createdBy'].includes(key)) {
                return;
            }

            const oldValue = oldVersion[key];
            const newValue = newVersion[key];

            // 值相同，无变化
            if (JSON.stringify(oldValue) === JSON.stringify(newValue)) {
                return;
            }

            // 新增字段
            if (oldValue === undefined) {
                diffs.push({ field: key, oldValue: null, newValue, changeType: 'added' });
            }
            // 删除字段
            else if (newValue === undefined) {
                diffs.push({ field: key, oldValue, newValue: null, changeType: 'removed' });
            }
            // 修改字段
            else {
                diffs.push({ field: key, oldValue, newValue, changeType: 'modified' });
            }
        });

        return diffs;
    },

    /**
     * 格式化时间戳为可读文本
     */
    formatTimestamp(timestamp: number): string {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return '刚刚';
        if (diffMins < 60) return `${diffMins} 分钟前`;
        if (diffHours < 24) return `${diffHours} 小时前`;
        if (diffDays < 7) return `${diffDays} 天前`;

        return date.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};
