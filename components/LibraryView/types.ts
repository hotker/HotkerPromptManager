import { PromptModule, ModuleType, User } from '../../types';
import { Language } from '../../translations';

// LibraryView 的状态类型
export interface LibraryState {
  // 弹窗状态
  modal: {
    isOpen: boolean;
    editing: PromptModule | null;
    isSaving: boolean;
    error: string | null;
  };
  // 表单数据
  form: {
    title: string;
    description: string;
    content: string;
    type: ModuleType;
    tags: string;
    imageUrl: string;
    changeSummary: string;
  };
  // 筛选状态
  filter: {
    search: string;
    type: ModuleType | 'ALL';
  };
  // 分页状态
  pagination: {
    page: number;
    perPage: number;
  };
  // 沉浸模式
  immersive: {
    active: boolean;
    index: number;
  };
  // 查看图片
  lightbox: {
    imageUrl: string | null;
  };
  // 版本历史
  versionHistory: {
    isOpen: boolean;
    moduleId: string | null;
  };
  // 分享
  share: {
    isOpen: boolean;
    module: PromptModule | null;
  };
  // 导入
  import: {
    isOpen: boolean;
  };
}

// Action 类型
export type LibraryAction =
  // 弹窗操作
  | { type: 'OPEN_MODAL'; payload?: PromptModule }
  | { type: 'CLOSE_MODAL' }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'SET_MODAL_ERROR'; payload: string | null }
  // 表单操作
  | { type: 'UPDATE_FORM'; payload: Partial<LibraryState['form']> }
  | { type: 'RESET_FORM' }
  // 筛选操作
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'SET_FILTER_TYPE'; payload: ModuleType | 'ALL' }
  // 分页操作
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'RESET_PAGINATION' }
  // 沉浸模式
  | { type: 'ENTER_IMMERSIVE'; payload: number }
  | { type: 'EXIT_IMMERSIVE' }
  | { type: 'SET_IMMERSIVE_INDEX'; payload: number }
  // 查看图片
  | { type: 'VIEW_IMAGE'; payload: string }
  | { type: 'CLOSE_LIGHTBOX' }
  // 版本历史
  | { type: 'OPEN_VERSION_HISTORY'; payload: string }
  | { type: 'CLOSE_VERSION_HISTORY' }
  // 分享
  | { type: 'OPEN_SHARE'; payload: PromptModule }
  | { type: 'CLOSE_SHARE' }
  // 导入
  | { type: 'OPEN_IMPORT' }
  | { type: 'CLOSE_IMPORT' };

// Props 类型
export interface LibraryViewProps {
  modules: PromptModule[];
  setModules: React.Dispatch<React.SetStateAction<PromptModule[]>>;
  lang: Language;
  syncStatus?: 'saved' | 'saving' | 'error' | 'offline';
  currentUser?: User;
}

// 子组件 Props
export interface ModuleGridProps {
  modules: PromptModule[];
  lang: Language;
  currentUser?: User;
  onEdit: (module: PromptModule) => void;
  onDelete: (id: string) => void;
  onCopy: (content: string) => void;
  onViewImage: (url: string) => void;
  onVersionHistory: (moduleId: string) => void;
  onShare: (module: PromptModule) => void;
}

export interface ModuleModalProps {
  isOpen: boolean;
  editing: PromptModule | null;
  form: LibraryState['form'];
  isSaving: boolean;
  error: string | null;
  lang: Language;
  currentUser?: User;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (updates: Partial<LibraryState['form']>) => void;
}

export interface ImmersiveModeProps {
  modules: PromptModule[];
  currentIndex: number;
  lang: Language;
  onNext: () => void;
  onPrev: () => void;
  onExit: () => void;
  onViewImage: (url: string) => void;
  onCopy: (content: string) => void;
}

export interface MobileNavProps {
  activeSection: 'grid' | 'filters';
  onSectionChange: (section: 'grid' | 'filters') => void;
}
