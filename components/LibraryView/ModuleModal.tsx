import React from 'react';
import { ModuleType } from '../../types';
import { translations } from '../../translations';
import { X as CloseIcon, Image as ImageIcon } from 'lucide-react';
import { ModuleModalProps } from './types';

export const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  editing,
  form,
  isSaving,
  error,
  lang,
  currentUser,
  onClose,
  onSave,
  onFormChange,
}) => {
  const t = translations[lang];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-[850px] bg-white shadow-2xl rounded-[3rem] overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-900">
            {editing ? t.library.modalEdit : t.library.modalCreate}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900">
            <CloseIcon size={24} />
          </button>
        </div>

        <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-10 overflow-y-auto">
          <div className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 text-xs font-bold rounded-xl">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t.library.labelTitle}
              </label>
              <input
                className="prod-input font-bold py-3 px-4"
                value={form.title}
                onChange={e => onFormChange({ title: e.target.value })}
                placeholder={t.library.placeholderTitle}
              />
            </div>

            {/* Type vs Tags */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="w-full sm:w-1/3 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest truncate" title={t.library.labelType}>
                  {t.library.labelType}
                </label>
                <select
                  className="prod-input font-bold py-3 px-4 h-[46px] w-full"
                  value={form.type}
                  onChange={e => onFormChange({ type: e.target.value as ModuleType })}
                >
                  {Object.values(ModuleType).map(v => (
                    <option key={v} value={v}>
                      {t.moduleType[v as keyof typeof t.moduleType] || v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-full sm:w-2/3 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest truncate" title={t.library.labelTags}>
                  {t.library.labelTags}
                </label>
                <input
                  className="prod-input font-bold py-3 px-4 h-[46px] w-full"
                  value={form.tags}
                  onChange={e => onFormChange({ tags: e.target.value })}
                  placeholder={t.library.placeholderTags}
                />
              </div>
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t.library.labelImage}
              </label>
              <div className="flex gap-3 items-center">
                <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0 shadow-inner flex items-center justify-center">
                  {form.imageUrl ? (
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  ) : (
                    <ImageIcon size={16} className="text-slate-300" />
                  )}
                </div>
                <input
                  className="prod-input font-mono text-xs py-3 px-4 flex-1"
                  value={form.imageUrl}
                  onChange={e => onFormChange({ imageUrl: e.target.value })}
                  placeholder={t.library.placeholderImage}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 flex flex-col">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {t.library.labelContent}
            </label>
            <textarea
              className="flex-1 min-h-[250px] bg-slate-50 border border-slate-200 rounded-3xl p-6 font-mono text-xs leading-relaxed outline-none focus:border-blue-500"
              value={form.content}
              onChange={e => onFormChange({ content: e.target.value })}
              placeholder={t.library.placeholderContent}
            />
          </div>

          {/* Change Summary (Edit mode only) */}
          {editing && currentUser && (
            <div className="col-span-2 space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {t.library.changeDescription}
              </label>
              <input
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-mono text-xs outline-none focus:border-blue-500"
                value={form.changeSummary}
                onChange={e => onFormChange({ changeSummary: e.target.value })}
                placeholder={t.library.changeDescPlaceholder}
              />
            </div>
          )}
        </div>

        <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-8 py-3 rounded-xl font-bold text-xs text-slate-400 hover:text-slate-900 uppercase tracking-widest"
          >
            {t.library.btnCancel}
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-12 py-3 bg-slate-900 rounded-xl text-white font-bold text-xs uppercase shadow-xl tracking-widest transition-transform active:scale-95"
          >
            {isSaving ? t.library.saving : t.library.btnSave}
          </button>
        </div>
      </div>
    </div>
  );
};
