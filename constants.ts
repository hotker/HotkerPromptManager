import { FixedConfig, ModuleType, PromptModule } from "./types";

export const DEFAULT_CONFIG: FixedConfig = {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  topK: 40,
  outputFormat: 'text',
  aspectRatio: 'auto',
  imageSize: '1K',
  appendString: 'Ensure output is strictly professional.'
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
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Fast/Text)' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro (Reasoning)' },
  { id: 'gemini-2.5-flash-image', name: 'Gemini Nano banana' },
];

export const AUTHOR_INFO = {
  name: 'hotker',
  twitter: '@hotker_ai',
  twitterUrl: 'https://x.com/hotker_ai',
  github: 'https://github.com/hotker/HotkerPromptManager',
  website: 'https://hotker.com',
  email: 'hotker@gmail.com'
};

// Commercial Grade Initial Data
export const INITIAL_MODULES: PromptModule[] = [
  { 
    id: 'role-expert', 
    title: 'Role: Senior Architect', 
    content: 'You are a world-class Full Stack Architect with 10 years of experience in React 19, TypeScript, and Cloudflare ecosystems. You prioritize type safety, performance optimization, and clean architecture.', 
    description: 'Sets a high engineering standard.',
    type: ModuleType.ROLE, 
    tags: ['Expert', 'Engineering'], 
    createdAt: Date.now() 
  },
  { 
    id: 'task-refactor', 
    title: 'Task: Code Refactor', 
    content: 'Refactor the provided code. Requirements: 1. Improve readability; 2. DRY (Don\'t Repeat Yourself); 3. Perfect TypeScript types; 4. Maintain original logic.', 
    type: ModuleType.TASK, 
    tags: ['Refactor', 'Code'], 
    createdAt: Date.now() 
  },
  { 
    id: 'constraint-stack', 
    title: 'Constraint: Modern Stack', 
    content: 'Strictly follow: React 19 (Hooks), Tailwind CSS (No styled-components), Lucide React, Vite, Cloudflare Pages.', 
    type: ModuleType.CONSTRAINT, 
    tags: ['Stack', 'React', 'Tailwind'], 
    createdAt: Date.now() 
  },
  { 
    id: 'format-json', 
    title: 'Format: Pure JSON', 
    content: 'Output ONLY valid JSON data. Do not wrap in Markdown code blocks. No other text.', 
    type: ModuleType.FORMAT, 
    tags: ['Data', 'API'], 
    createdAt: Date.now() 
  }
];