import { FixedConfig, ModuleType } from "./types";

export const DEFAULT_CONFIG: FixedConfig = {
  model: 'gemini-2.5-flash',
  temperature: 0.7,
  topK: 40,
  outputFormat: 'text',
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