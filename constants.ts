

import { FixedConfig, ModuleType, PromptModule } from "./types";

export const DEFAULT_CONFIG: FixedConfig = {
  // Use recommended gemini-3-flash-preview for basic text tasks
  model: 'gemini-3-flash-preview',
  temperature: 0.7,
  topK: 40,
  outputFormat: 'text',
  aspectRatio: 'auto',
  imageSize: '1K',
  appendString: '请确保输出内容专业且严谨。' // Localized default
};

// Professional, low-saturation colors for light theme
export const MODULE_COLORS: Record<ModuleType, string> = {
  [ModuleType.ROLE]: 'bg-blue-50 text-blue-700 border-blue-200',
  [ModuleType.CONTEXT]: 'bg-purple-50 text-purple-700 border-purple-200',
  [ModuleType.TASK]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [ModuleType.CONSTRAINT]: 'bg-rose-50 text-rose-700 border-rose-200',
  [ModuleType.FORMAT]: 'bg-orange-50 text-orange-700 border-orange-200',
  [ModuleType.TONE]: 'bg-pink-50 text-pink-700 border-pink-200',
  [ModuleType.OTHER]: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const AVAILABLE_MODELS = [
  // Update to use the latest model names from guidelines
  { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash (快速/文本)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (推理/复杂)' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini Nano banana (图像)' },
  { id: 'gemini-3-pro-image-preview', name: 'Gemini 3.0 Pro Image (高清绘图)' },
];

export const AUTHOR_INFO = {
  name: 'hotker',
  twitter: '@hotker_ai',
  twitterUrl: 'https://x.com/hotker_ai',
  github: 'https://github.com/hotker/HotkerPromptManager',
  website: 'https://hotker.com',
  email: 'hotker@gmail.com'
};

// Commercial Grade Initial Data (Localized to Chinese)
export const INITIAL_MODULES: PromptModule[] = [
  { 
    id: 'role-expert', 
    title: '角色：资深架构师', 
    content: '你是一位世界级的全栈架构师，拥有10年 React 19、TypeScript 和 Cloudflare 生态系统经验。你优先考虑类型安全、性能优化和整洁的架构设计。', 
    description: '设定高工程标准。',
    type: ModuleType.ROLE, 
    tags: ['专家', '工程'], 
    createdAt: Date.now() 
  },
  { 
    id: 'task-refactor', 
    title: '任务：代码重构', 
    content: '重构提供的代码。要求：1. 提高可读性；2. DRY（不要重复自己）；3. 完善 TypeScript 类型；4. 保持原有逻辑不变。', 
    type: ModuleType.TASK, 
    tags: ['重构', '代码'], 
    createdAt: Date.now() 
  },
  { 
    id: 'constraint-stack', 
    title: '约束：现代技术栈', 
    content: '严格遵循：React 19 (Hooks), Tailwind CSS (不使用 styled-components), Lucide React, Vite, Cloudflare Pages。', 
    type: ModuleType.CONSTRAINT, 
    tags: ['技术栈', 'React', 'Tailwind'], 
    createdAt: Date.now() 
  },
  { 
    id: 'format-json', 
    title: '格式：纯 JSON', 
    content: '仅输出有效的 JSON 数据。不要将其包裹在 Markdown 代码块中。不要输出其他文本。', 
    type: ModuleType.FORMAT, 
    tags: ['数据', 'API'], 
    createdAt: Date.now() 
  }
];
