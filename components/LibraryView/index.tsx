import React, { useReducer, useRef, useEffect, useCallback, useMemo } from 'react';
import { PromptModule, ModuleType } from '../../types';
import {
  Plus, Search, Box, ChevronLeft, ChevronRight, Download,
  ChevronsLeft, ChevronsRight, MonitorPlay, Undo2, Redo2
} from 'lucide-react';
import { translations } from '../../translations';
import { VersionHistoryModal } from '../VersionHistoryModal';
import { ShareModal } from '../ShareModal';
import { ImportModal } from '../ImportModal';
import { useUndoRedoWithExternalState } from '../../hooks/useUndoRedo';
import { generateUUID } from '../../services/uuid';
import { versionService } from '../../services/versionService';

import { LibraryViewProps } from './types';
import { libraryReducer, initialLibraryState } from './reducer';
import { ModuleGrid } from './ModuleGrid';
import { ModuleModal } from './ModuleModal';
import { ImmersiveMode } from './ImmersiveMode';
import { Lightbox } from './Lightbox';

const ITEMS_PER_PAGE = 12;

export const LibraryView: React.FC<LibraryViewProps> = ({
  modules,
  setModules,
  lang,
  currentUser
}) => {
  const t = translations[lang];
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Reducer 管理 UI 状态
  const [state, dispatch] = useReducer(libraryReducer, initialLibraryState);

  // 撤销/重做功能
  const { undo, redo, canUndo, canRedo, recordChange } = useUndoRedoWithExternalState(
    modules,
    setModules,
    { maxHistory: 20 }
  );

  // 过滤和分页
  const filteredModules = useMemo(() => {
    return modules.filter(m => {
      const matchesSearch =
        m.title.toLowerCase().includes(state.filter.search.toLowerCase()) ||
        m.content.toLowerCase().includes(state.filter.search.toLowerCase());
      const matchesType = state.filter.type === 'ALL' || m.type === state.filter.type;
      return matchesSearch && matchesType;
    });
  }, [modules, state.filter.search, state.filter.type]);

  const totalPages = Math.ceil(filteredModules.length / ITEMS_PER_PAGE);
  const paginatedModules = filteredModules.slice(
    (state.pagination.page - 1) * ITEMS_PER_PAGE,
    state.pagination.page * ITEMS_PER_PAGE
  );

  // 页面改变时滚动到顶部
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [state.pagination.page]);

  // 撤销/重做快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // 处理保存
  const handleSave = useCallback(async () => {
    if (!state.form.title.trim() || !state.form.content.trim()) {
      dispatch({
        type: 'SET_MODAL_ERROR',
        payload: lang === 'zh' ? '标题和内容不能为空' : 'Title and content are required'
      });
      return;
    }

    dispatch({ type: 'SET_SAVING', payload: true });

    const newModule: PromptModule = {
      id: state.modal.editing ? state.modal.editing.id : generateUUID(),
      title: state.form.title.trim(),
      description: state.form.description.trim(),
      content: state.form.content.trim(),
      type: state.form.type,
      tags: state.form.tags.split(',').map(t => t.trim()).filter(Boolean),
      imageUrl: state.form.imageUrl.trim(),
      createdAt: state.modal.editing ? state.modal.editing.createdAt : Date.now(),
    };

    // 记录撤销历史
    const updatedModules = state.modal.editing
      ? modules.map(m => m.id === state.modal.editing!.id ? newModule : m)
      : [newModule, ...modules];
    recordChange(updatedModules);
    setModules(updatedModules);

    // 创建版本记录
    if (state.modal.editing && currentUser) {
      try {
        await versionService.createModuleVersion(
          state.modal.editing.id,
          currentUser.id,
          newModule,
          state.form.changeSummary || undefined
        );
      } catch (e) {
        console.error("Failed to create version history:", e);
      }
    }

    dispatch({ type: 'SET_SAVING', payload: false });
    dispatch({ type: 'CLOSE_MODAL' });
  }, [state.form, state.modal.editing, modules, setModules, recordChange, currentUser, lang]);

  // 处理删除
  const handleDelete = useCallback((id: string) => {
    if (confirm(t.library.deleteConfirm)) {
      const updatedModules = modules.filter(m => m.id !== id);
      recordChange(updatedModules);
      setModules(updatedModules);
    }
  }, [modules, setModules, recordChange, t.library.deleteConfirm]);

  // 处理导入
  const handleImport = useCallback(async (item: PromptModule, type: 'module' | 'template') => {
    if (type === 'module') {
      const newModule = { ...item, id: generateUUID(), createdAt: Date.now() };

      try {
        const res = await fetch('/api/modules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newModule)
        });

        if (!res.ok) throw new Error('Failed to save imported module');
        setModules(prev => [newModule, ...prev]);
      } catch (error) {
        console.error('Failed to import module:', error);
        alert(lang === 'zh' ? '导入失败，请重试' : 'Import failed, please try again');
      }
    }
  }, [setModules, lang]);

  // 处理版本恢复
  const handleRestoreVersion = useCallback((version: PromptModule) => {
    setModules(prev => prev.map(m => m.id === version.id ? version : m));
  }, [setModules]);

  // 沉浸模式导航
  const handleImmersiveNext = useCallback(() => {
    dispatch({
      type: 'SET_IMMERSIVE_INDEX',
      payload: (state.immersive.index + 1) % filteredModules.length
    });
  }, [state.immersive.index, filteredModules.length]);

  const handleImmersivePrev = useCallback(() => {
    dispatch({
      type: 'SET_IMMERSIVE_INDEX',
      payload: (state.immersive.index - 1 + filteredModules.length) % filteredModules.length
    });
  }, [state.immersive.index, filteredModules.length]);

  // 渲染分页数字
  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, state.pagination.page - 2);
    let end = Math.min(totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => dispatch({ type: 'SET_PAGE', payload: i })}
          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
            state.pagination.page === i
              ? 'bg-slate-900 text-white shadow-md scale-110'
              : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden md:rounded-tl-[3rem] shadow-sm relative border-l border-slate-200">
      {/* Header */}
      <header className="px-10 py-8 bg-white border-b border-slate-200 shrink-0 z-20">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white">
              <Box size={24} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">{t.library.title}</h2>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{modules.length} {t.library.modulesAvailable}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-[320px]">
              <input
                type="text"
                placeholder={t.library.searchPlaceholder}
                value={state.filter.search}
                onChange={(e) => dispatch({ type: 'SET_SEARCH', payload: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3 pl-12 text-sm text-slate-900 outline-none focus:border-blue-500 transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            </div>

            <button
              onClick={() => {
                if (filteredModules.length > 0) {
                  dispatch({ type: 'ENTER_IMMERSIVE', payload: 0 });
                }
              }}
              className="h-[48px] w-[48px] flex items-center justify-center bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 rounded-2xl shadow-sm hover:shadow-md transition-all"
              title={t.library.enterImmersive}
            >
              <MonitorPlay size={20} />
            </button>

            <div className="flex gap-3">
              {/* 撤销/重做按钮 */}
              <div className="flex items-center gap-1">
                <button
                  onClick={undo}
                  disabled={!canUndo}
                  className={`h-[48px] w-[48px] flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-sm transition-all ${canUndo ? 'text-slate-500 hover:text-slate-700 hover:border-slate-300' : 'text-slate-300 cursor-not-allowed'}`}
                  title={lang === 'zh' ? '撤销 (Cmd+Z)' : 'Undo (Cmd+Z)'}
                >
                  <Undo2 size={18} />
                </button>
                <button
                  onClick={redo}
                  disabled={!canRedo}
                  className={`h-[48px] w-[48px] flex items-center justify-center bg-white border border-slate-200 rounded-2xl shadow-sm transition-all ${canRedo ? 'text-slate-500 hover:text-slate-700 hover:border-slate-300' : 'text-slate-300 cursor-not-allowed'}`}
                  title={lang === 'zh' ? '重做 (Cmd+Shift+Z)' : 'Redo (Cmd+Shift+Z)'}
                >
                  <Redo2 size={18} />
                </button>
              </div>

              <button
                onClick={() => dispatch({ type: 'OPEN_IMPORT' })}
                className="px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors font-medium flex items-center gap-2 shadow-sm"
              >
                <Download size={18} />
                <span>{t.library.importPrompt}</span>
              </button>
              <button
                onClick={() => dispatch({ type: 'OPEN_MODAL' })}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-blue-500/30"
              >
                <Plus size={18} />
                <span>{t.library.createBtn}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <nav className="px-10 py-4 bg-white border-b border-slate-100 flex items-center gap-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => dispatch({ type: 'SET_FILTER_TYPE', payload: 'ALL' })}
          className={`px-5 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all border ${state.filter.type === 'ALL' ? 'bg-slate-900 border-slate-900 text-white' : 'bg-transparent border-slate-200 text-slate-500'}`}
        >
          {t.moduleType['ALL']}
        </button>
        {Object.values(ModuleType).map(v => (
          <button
            key={v}
            onClick={() => dispatch({ type: 'SET_FILTER_TYPE', payload: v })}
            className={`px-5 py-1.5 rounded-full text-[11px] font-bold tracking-tight transition-all border ${state.filter.type === v ? 'bg-slate-900 border-slate-900 text-white' : 'bg-transparent border-slate-200 text-slate-500'}`}
          >
            {t.moduleType[v as keyof typeof t.moduleType] || v}
          </button>
        ))}
      </nav>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar" ref={scrollContainerRef}>
        <ModuleGrid
          modules={paginatedModules}
          lang={lang}
          currentUser={currentUser}
          onEdit={(module) => dispatch({ type: 'OPEN_MODAL', payload: module })}
          onDelete={handleDelete}
          onCopy={(content) => navigator.clipboard.writeText(content)}
          onViewImage={(url) => dispatch({ type: 'VIEW_IMAGE', payload: url })}
          onVersionHistory={(moduleId) => dispatch({ type: 'OPEN_VERSION_HISTORY', payload: moduleId })}
          onShare={(module) => dispatch({ type: 'OPEN_SHARE', payload: module })}
        />
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <footer className="px-10 py-3 bg-white border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
              {t.library.showing} {(state.pagination.page - 1) * ITEMS_PER_PAGE + 1} {t.library.to} {Math.min(state.pagination.page * ITEMS_PER_PAGE, filteredModules.length)} {t.library.of} {filteredModules.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={state.pagination.page === 1}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: 1 })}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              disabled={state.pagination.page === 1}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: state.pagination.page - 1 })}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex items-center gap-1 mx-2">{renderPageNumbers()}</div>
            <button
              disabled={state.pagination.page === totalPages}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: state.pagination.page + 1 })}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"
            >
              <ChevronRight size={18} />
            </button>
            <button
              disabled={state.pagination.page === totalPages}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: totalPages })}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-20 transition-all"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </footer>
      )}

      {/* Modal */}
      <ModuleModal
        isOpen={state.modal.isOpen}
        editing={state.modal.editing}
        form={state.form}
        isSaving={state.modal.isSaving}
        error={state.modal.error}
        lang={lang}
        currentUser={currentUser}
        onClose={() => dispatch({ type: 'CLOSE_MODAL' })}
        onSave={handleSave}
        onFormChange={(updates) => dispatch({ type: 'UPDATE_FORM', payload: updates })}
      />

      {/* Lightbox */}
      <Lightbox
        imageUrl={state.lightbox.imageUrl}
        onClose={() => dispatch({ type: 'CLOSE_LIGHTBOX' })}
      />

      {/* Immersive Mode */}
      {state.immersive.active && filteredModules.length > 0 && (
        <ImmersiveMode
          modules={filteredModules}
          currentIndex={state.immersive.index}
          lang={lang}
          onNext={handleImmersiveNext}
          onPrev={handleImmersivePrev}
          onExit={() => dispatch({ type: 'EXIT_IMMERSIVE' })}
          onViewImage={(url) => dispatch({ type: 'VIEW_IMAGE', payload: url })}
          onCopy={(content) => navigator.clipboard.writeText(content)}
        />
      )}

      {/* Version History Modal */}
      {state.versionHistory.isOpen && state.versionHistory.moduleId && currentUser && (
        <VersionHistoryModal
          isOpen={state.versionHistory.isOpen}
          onClose={() => dispatch({ type: 'CLOSE_VERSION_HISTORY' })}
          itemId={state.versionHistory.moduleId}
          itemType="module"
          userId={currentUser.id}
          onRestore={handleRestoreVersion}
          lang={lang}
        />
      )}

      {/* Share Modal */}
      {state.share.isOpen && state.share.module && currentUser && (
        <ShareModal
          isOpen={state.share.isOpen}
          onClose={() => dispatch({ type: 'CLOSE_SHARE' })}
          item={state.share.module}
          itemType="module"
          currentUser={currentUser}
          lang={lang}
        />
      )}

      {/* Import Modal */}
      {state.import.isOpen && (
        <ImportModal
          isOpen={state.import.isOpen}
          onClose={() => dispatch({ type: 'CLOSE_IMPORT' })}
          onImport={handleImport}
          lang={lang}
        />
      )}
    </div>
  );
};
