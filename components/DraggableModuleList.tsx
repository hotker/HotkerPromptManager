import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { PromptModule } from '../types';
import { Language, translations } from '../translations';

interface SortableModuleItemProps {
  id: string;
  module: PromptModule;
  index: number;
  onRemove: (index: number) => void;
  lang: Language;
}

const SortableModuleItem: React.FC<SortableModuleItemProps> = ({
  id,
  module,
  index,
  onRemove,
  lang,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border rounded-lg p-3 flex items-start gap-3 group relative ${
        isDragging ? 'shadow-lg border-blue-400' : 'border-slate-200'
      }`}
    >
      <button
        {...attributes}
        {...listeners}
        className="mt-1 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing touch-none"
        aria-label={lang === 'zh' ? '拖拽排序' : 'Drag to reorder'}
      >
        <GripVertical size={14} />
      </button>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-700 mb-1">{module.title}</h4>
        <p className="text-xs text-slate-500 font-mono line-clamp-2">
          {module.content}
        </p>
      </div>
      <button
        onClick={() => onRemove(index)}
        className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={lang === 'zh' ? '移除模块' : 'Remove module'}
      >
        <X size={16} />
      </button>
    </div>
  );
};

interface DraggableModuleListProps {
  moduleIds: string[];
  modules: PromptModule[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (index: number) => void;
  lang: Language;
}

export const DraggableModuleList: React.FC<DraggableModuleListProps> = ({
  moduleIds,
  modules,
  onReorder,
  onRemove,
  lang,
}) => {
  const t = translations[lang];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px 移动后才触发拖拽
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = moduleIds.indexOf(active.id as string);
      const newIndex = moduleIds.indexOf(over.id as string);
      const newOrder = arrayMove(moduleIds, oldIndex, newIndex);
      onReorder(newOrder);
    }
  };

  const getModule = (id: string) => modules.find((m) => m.id === id);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={moduleIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {moduleIds.map((id, index) => {
            const module = getModule(id);
            if (!module) return null;
            return (
              <SortableModuleItem
                key={id}
                id={id}
                module={module}
                index={index}
                onRemove={onRemove}
                lang={lang}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};
