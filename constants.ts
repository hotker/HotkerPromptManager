import { FixedConfig, ModuleType, PromptModule } from "./types";

export const DEFAULT_CONFIG: FixedConfig = {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  topK: 40,
  outputFormat: 'text',
  aspectRatio: 'auto',
  appendString: '确保输出严格专业，并遵循上述格式。不要包含闲聊或无意义的填充内容。'
};

export const MODULE_COLORS: Record<ModuleType, string> = {
  [ModuleType.ROLE]: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  [ModuleType.CONTEXT]: 'bg-purple-500/20 text-purple-400 border-purple-500/50',
  [ModuleType.TASK]: 'bg-green-500/20 text-green-400 border-green-500/50',
  [ModuleType.CONSTRAINT]: 'bg-red-500/20 text-red-400 border-red-500/50',
  [ModuleType.FORMAT]: 'bg-banana-500/20 text-banana-400 border-banana-500/50',
  [ModuleType.TONE]: 'bg-pink-500/20 text-pink-400 border-pink-500/50',
  [ModuleType.OTHER]: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/50',
};

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (文本/极速)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (复杂推理)' },
  { id: 'gemini-2.5-flash-image', name: 'Nano Banana (图像生成)' },
];

// Commercial Grade Initial Data
export const INITIAL_MODULES: PromptModule[] = [
  { 
    id: 'role-expert', 
    title: '角色: 全栈架构师 (Expert)', 
    content: '你是一位拥有10年经验的世界级全栈架构师，精通 React 19、TypeScript 和 Cloudflare 生态系统。你极其注重代码的类型安全、性能优化和架构整洁。', 
    description: '设定高标准的工程视角。',
    type: ModuleType.ROLE, 
    tags: ['专家', '工程'], 
    createdAt: Date.now() 
  },
  { 
    id: 'task-refactor', 
    title: '任务: 代码重构 (Refactor)', 
    content: '请对提供的代码进行重构。要求：1. 提高可读性；2. 消除重复逻辑 (DRY)；3. 完善 TypeScript 类型定义；4. 保持原有业务逻辑不变。', 
    type: ModuleType.TASK, 
    tags: ['重构', '代码'], 
    createdAt: Date.now() 
  },
  { 
    id: 'constraint-stack', 
    title: '约束: 现代技术栈', 
    content: '严格遵守以下技术栈要求：\n- 框架: React 19 (Functional Components + Hooks)\n- 样式: Tailwind CSS (禁止使用外部 CSS 文件或 styled-components)\n- 图标: Lucide React\n- 构建: Vite\n- 部署: Cloudflare Pages', 
    type: ModuleType.CONSTRAINT, 
    tags: ['Tech Stack', 'React', 'Tailwind'], 
    createdAt: Date.now() 
  },
  { 
    id: 'constraint-no-yapping', 
    title: '语气: 极简 (No Yapping)', 
    content: '请直接输出结果，不要包含任何“好的，这是您的代码”之类的开场白或结束语。只提供核心代码和必要的简短注释。', 
    type: ModuleType.TONE, 
    tags: ['高效率', '极简'], 
    createdAt: Date.now() 
  },
  { 
    id: 'format-json', 
    title: '格式: 纯 JSON', 
    content: '请仅输出有效的 JSON 格式数据，不要使用 Markdown 代码块包裹，也不要包含任何其他文本。', 
    type: ModuleType.FORMAT, 
    tags: ['数据', 'API'], 
    createdAt: Date.now() 
  },
  {
    id: 'context-deploy',
    title: '背景: Cloudflare Pages 部署',
    content: '当前环境是 Cloudflare Pages。文件系统是只读的，没有传统 Node.js 服务器。API 使用 Cloudflare Functions 实现。请确保代码兼容 Edge Runtime。',
    type: ModuleType.CONTEXT,
    tags: ['Cloudflare', 'Serverless'],
    createdAt: Date.now()
  }
];