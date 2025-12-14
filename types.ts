// Prompt Module Types
export enum ModuleType {
  ROLE = '角色',
  CONTEXT = '背景',
  TASK = '任务',
  CONSTRAINT = '约束',
  FORMAT = '格式',
  TONE = '语气',
  OTHER = '其他'
}

export interface PromptModule {
  id: string;
  title: string;
  description?: string; // Optional description field
  content: string;
  type: ModuleType;
  tags: string[];
  imageUrl?: string;
  createdAt: number;
}

// Config Types
export interface FixedConfig {
  model: string;
  temperature: number;
  topK: number;
  outputFormat: 'text' | 'json';
  aspectRatio: string; // Image generation aspect ratio
  appendString: string; // The "Fixed Ending Parameters"
}

// Template Types
export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  moduleIds: string[]; // Order matters
  config: FixedConfig;
  createdAt: number;
  updatedAt: number;
}

// Execution/Review Types
export interface RunLog {
  id: string;
  templateId: string;
  templateName: string;
  finalPrompt: string;
  output: string;
  status: 'success' | 'failure' | 'pending';
  rating?: number; // 1-5
  notes?: string;
  timestamp: number;
  durationMs: number;
}

// Auth Types
export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  provider: 'local' | 'google';
  createdAt: number;
}

export type ViewState = 'dashboard' | 'library' | 'builder' | 'history';