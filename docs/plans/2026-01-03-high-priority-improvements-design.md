# High Priority Improvements Design

Date: 2026-01-03

## Overview

Implementation of three high-priority feature improvements:
1. AI Optimization Result Application
2. Module Drag-and-Drop Sorting
3. Undo/Redo Functionality

## Implementation Order

按复杂度从低到高依次实现：
1. **Phase 1**: AI 优化结果应用（修改 2 个文件）
2. **Phase 2**: 拖拽排序（新增依赖 + 修改 1 个文件）
3. **Phase 3**: 撤销/重做（新增 Hook + 修改 2 个文件）

## File Structure Changes

```
hooks/
├── useDebounce.ts          (已存在)
├── useKeyboardShortcuts.ts (已存在 - 修改)
├── useUndoRedo.ts          (新增)

components/
├── BuilderView.tsx         (修改)
├── LibraryView.tsx         (修改)
├── OptimizationApplyModal.tsx (新增)
├── DraggableModuleList.tsx (新增)
```

## Dependencies

```json
{
  "@dnd-kit/core": "^6.1.0",
  "@dnd-kit/sortable": "^8.0.0",
  "@dnd-kit/utilities": "^3.2.2"
}
```

---

## Phase 1: AI Optimization Result Application

### OptimizationApplyModal Component

```tsx
interface OptimizationApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  optimizedPrompt: string;
  originalModuleIds: string[];
  onCreateModule: (content: string) => void;
  onReplaceModules: (content: string) => void;
  lang: Language;
}
```

### User Flow

```
┌─────────────────────────────────────┐
│     应用优化结果                      │
├─────────────────────────────────────┤
│  优化后的 Prompt 预览:               │
│  ┌─────────────────────────────┐    │
│  │ [优化后的内容...]            │    │
│  └─────────────────────────────┘    │
│                                     │
│  请选择如何应用:                     │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌───────┐ │
│  │ 创建新模块│ │替换当前组合│ │仅复制 │ │
│  └─────────┘ └─────────┘ └───────┘ │
│                                     │
│  [取消]                             │
└─────────────────────────────────────┘
```

### Actions

| Action | Behavior |
|--------|----------|
| **创建新模块** | 打开模块编辑弹窗，预填充优化后内容，类型默认"其他" |
| **替换当前组合** | 清空当前选中模块，创建临时模块并选中 |
| **仅复制** | 复制到剪贴板，显示 Toast 提示 |

---

## Phase 2: Drag-and-Drop Sorting

### DraggableModuleList Component

```tsx
interface DraggableModuleListProps {
  moduleIds: string[];
  modules: PromptModule[];
  onReorder: (newOrder: string[]) => void;
  onRemove: (index: number) => void;
  lang: Language;
}
```

### dnd-kit Integration

```tsx
<DndContext
  sensors={sensors}
  collisionDetection={closestCenter}
  onDragEnd={handleDragEnd}
>
  <SortableContext items={selectedModuleIds} strategy={verticalListSortingStrategy}>
    {selectedModuleIds.map((id, index) => (
      <SortableModuleItem key={id} id={id} index={index} ... />
    ))}
  </SortableContext>
</DndContext>
```

### Interaction Details

| Element | Behavior |
|---------|----------|
| **拖拽手柄** | GripVertical 图标作为拖拽触发区域 |
| **拖拽预览** | 半透明卡片跟随鼠标，原位置显示虚线占位 |
| **放置动画** | dnd-kit 内置 CSS 过渡动画 |
| **键盘支持** | 空格键拾起，方向键移动，回车放下 |

### Sensor Configuration

```tsx
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: { distance: 8 }
  }),
  useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  })
);
```

---

## Phase 3: Undo/Redo

### useUndoRedo Hook

```tsx
interface UseUndoRedoOptions<T> {
  maxHistory?: number;  // 默认 20
}

interface UseUndoRedoReturn<T> {
  state: T;
  setState: (newState: T | ((prev: T) => T)) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clearHistory: () => void;
}

function useUndoRedo<T>(initialState: T, options?: UseUndoRedoOptions<T>): UseUndoRedoReturn<T>
```

### Internal Data Structure

```tsx
interface HistoryState<T> {
  past: T[];      // 撤销栈 (最多 maxHistory 条)
  present: T;     // 当前状态
  future: T[];    // 重做栈
}
```

### State Flow

```
初始: past=[], present=A, future=[]

setState(B): past=[A], present=B, future=[]
setState(C): past=[A,B], present=C, future=[]

undo(): past=[A], present=B, future=[C]
undo(): past=[], present=A, future=[B,C]

redo(): past=[A], present=B, future=[C]
```

### Application Scope

| View | Managed State | Trigger |
|------|---------------|---------|
| **BuilderView** | `selectedModuleIds: string[]` | 添加/删除/排序模块 |
| **LibraryView** | `modules: PromptModule[]` | 创建/编辑/删除模块 |

---

## Keyboard Shortcuts

扩展 `useKeyboardShortcuts.ts`:

```tsx
interface KeyboardShortcutsOptions {
  onSave: () => void;      // Cmd/Ctrl + S
  onSearch: () => void;    // Cmd/Ctrl + K
  onNew: () => void;       // Cmd/Ctrl + N
  onUndo?: () => void;     // Cmd/Ctrl + Z (新增)
  onRedo?: () => void;     // Cmd/Ctrl + Shift + Z (新增)
  setView: (v: ViewState) => void;
  enabled: boolean;
}
```

---

## UI Changes

### Builder View Toolbar

```
┌─────────────────────────────────────────┐
│ [↶ 撤销] [↷ 重做]  │  模板名称...       │
└─────────────────────────────────────────┘
```

### Library View Header

```
┌──────────────────────────────────────────────────────┐
│ [模块库]  [搜索...]  [↶] [↷]  [导入] [+ 创建模块]     │
└──────────────────────────────────────────────────────┘
```

### Button States

- 可用：正常颜色
- 不可用（canUndo/canRedo = false）：灰色禁用态

### Toast Messages

- 撤销成功：`已撤销`
- 重做成功：`已重做`
- 复制到剪贴板：`已复制到剪贴板`
