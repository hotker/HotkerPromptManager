import { ModuleType } from '../../types';
import { LibraryState, LibraryAction } from './types';

// 初始表单状态
const initialForm: LibraryState['form'] = {
  title: '',
  description: '',
  content: '',
  type: ModuleType.ROLE,
  tags: '',
  imageUrl: '',
  changeSummary: '',
};

// 初始状态
export const initialLibraryState: LibraryState = {
  modal: {
    isOpen: false,
    editing: null,
    isSaving: false,
    error: null,
  },
  form: initialForm,
  filter: {
    search: '',
    type: 'ALL',
  },
  pagination: {
    page: 1,
    perPage: 12,
  },
  immersive: {
    active: false,
    index: 0,
  },
  lightbox: {
    imageUrl: null,
  },
  versionHistory: {
    isOpen: false,
    moduleId: null,
  },
  share: {
    isOpen: false,
    module: null,
  },
  import: {
    isOpen: false,
  },
};

// Reducer 函数
export function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    // 弹窗操作
    case 'OPEN_MODAL':
      if (action.payload) {
        // 编辑模式：填充表单
        return {
          ...state,
          modal: { isOpen: true, editing: action.payload, isSaving: false, error: null },
          form: {
            title: action.payload.title,
            description: action.payload.description || '',
            content: action.payload.content,
            type: action.payload.type,
            tags: action.payload.tags.join(', '),
            imageUrl: action.payload.imageUrl || '',
            changeSummary: '',
          },
        };
      }
      // 创建模式：重置表单
      return {
        ...state,
        modal: { isOpen: true, editing: null, isSaving: false, error: null },
        form: initialForm,
      };

    case 'CLOSE_MODAL':
      return {
        ...state,
        modal: { ...state.modal, isOpen: false },
      };

    case 'SET_SAVING':
      return {
        ...state,
        modal: { ...state.modal, isSaving: action.payload },
      };

    case 'SET_MODAL_ERROR':
      return {
        ...state,
        modal: { ...state.modal, error: action.payload },
      };

    // 表单操作
    case 'UPDATE_FORM':
      return {
        ...state,
        form: { ...state.form, ...action.payload },
      };

    case 'RESET_FORM':
      return {
        ...state,
        form: initialForm,
      };

    // 筛选操作
    case 'SET_SEARCH':
      return {
        ...state,
        filter: { ...state.filter, search: action.payload },
        pagination: { ...state.pagination, page: 1 }, // 搜索时重置分页
      };

    case 'SET_FILTER_TYPE':
      return {
        ...state,
        filter: { ...state.filter, type: action.payload },
        pagination: { ...state.pagination, page: 1 }, // 筛选时重置分页
      };

    // 分页操作
    case 'SET_PAGE':
      return {
        ...state,
        pagination: { ...state.pagination, page: action.payload },
      };

    case 'RESET_PAGINATION':
      return {
        ...state,
        pagination: { ...state.pagination, page: 1 },
      };

    // 沉浸模式
    case 'ENTER_IMMERSIVE':
      return {
        ...state,
        immersive: { active: true, index: action.payload },
      };

    case 'EXIT_IMMERSIVE':
      return {
        ...state,
        immersive: { ...state.immersive, active: false },
      };

    case 'SET_IMMERSIVE_INDEX':
      return {
        ...state,
        immersive: { ...state.immersive, index: action.payload },
      };

    // 查看图片
    case 'VIEW_IMAGE':
      return {
        ...state,
        lightbox: { imageUrl: action.payload },
      };

    case 'CLOSE_LIGHTBOX':
      return {
        ...state,
        lightbox: { imageUrl: null },
      };

    // 版本历史
    case 'OPEN_VERSION_HISTORY':
      return {
        ...state,
        versionHistory: { isOpen: true, moduleId: action.payload },
      };

    case 'CLOSE_VERSION_HISTORY':
      return {
        ...state,
        versionHistory: { ...state.versionHistory, isOpen: false },
      };

    // 分享
    case 'OPEN_SHARE':
      return {
        ...state,
        share: { isOpen: true, module: action.payload },
      };

    case 'CLOSE_SHARE':
      return {
        ...state,
        share: { isOpen: false, module: null },
      };

    // 导入
    case 'OPEN_IMPORT':
      return {
        ...state,
        import: { isOpen: true },
      };

    case 'CLOSE_IMPORT':
      return {
        ...state,
        import: { isOpen: false },
      };

    default:
      return state;
  }
}
