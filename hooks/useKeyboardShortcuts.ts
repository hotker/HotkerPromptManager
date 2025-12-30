import { useEffect, useCallback } from 'react';
import { ViewState } from '../types';

interface KeyboardShortcutsOptions {
    onSave?: () => void;
    onSearch?: () => void;
    onNew?: () => void;
    onEscape?: () => void;
    setView?: (view: ViewState) => void;
    enabled?: boolean;
}

/**
 * 全局快捷键 Hook
 * 
 * 支持的快捷键：
 * - Cmd/Ctrl + S: 保存
 * - Cmd/Ctrl + K: 搜索
 * - Cmd/Ctrl + N: 新建
 * - Escape: 关闭模态框
 * - Cmd/Ctrl + 1-4: 切换视图
 */
export const useKeyboardShortcuts = ({
    onSave,
    onSearch,
    onNew,
    onEscape,
    setView,
    enabled = true
}: KeyboardShortcutsOptions) => {

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (!enabled) return;

        const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        const isModKey = isMac ? e.metaKey : e.ctrlKey;

        // 忽略在输入框中的快捷键（除了 Escape）
        const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].includes(
            (e.target as HTMLElement)?.tagName || ''
        );

        // Escape - 总是生效
        if (e.key === 'Escape' && onEscape) {
            e.preventDefault();
            onEscape();
            return;
        }

        // 在输入框中忽略其他快捷键
        if (isInputFocused) return;

        // Cmd/Ctrl + S: 保存
        if (isModKey && e.key === 's') {
            e.preventDefault();
            onSave?.();
            return;
        }

        // Cmd/Ctrl + K: 搜索
        if (isModKey && e.key === 'k') {
            e.preventDefault();
            onSearch?.();
            return;
        }

        // Cmd/Ctrl + N: 新建
        if (isModKey && e.key === 'n') {
            e.preventDefault();
            onNew?.();
            return;
        }

        // Cmd/Ctrl + 1-4: 切换视图
        if (isModKey && setView) {
            const viewMap: Record<string, ViewState> = {
                '1': 'dashboard',
                '2': 'library',
                '3': 'builder',
                '4': 'history'
            };

            if (viewMap[e.key]) {
                e.preventDefault();
                setView(viewMap[e.key]);
                return;
            }
        }
    }, [enabled, onSave, onSearch, onNew, onEscape, setView]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);
};

// 快捷键提示组件数据
export const KEYBOARD_SHORTCUTS = [
    { keys: ['⌘/Ctrl', 'S'], description: '保存' },
    { keys: ['⌘/Ctrl', 'K'], description: '搜索' },
    { keys: ['⌘/Ctrl', 'N'], description: '新建' },
    { keys: ['Esc'], description: '关闭' },
    { keys: ['⌘/Ctrl', '1-4'], description: '切换视图' }
];
