

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
  imageSize: string; // Image generation resolution/size
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

export type ViewState = 'dashboard' | 'library' | 'builder' | 'history' | 'myShares';

// Global declarations for Gemini API Studio environment
declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}

// Version Control Types
export interface ModuleVersion {
  id: string;
  moduleId: string;
  userId: string;
  versionNumber: number;
  title: string;
  description?: string;
  content: string;
  type: ModuleType;
  tags: string[];
  imageUrl?: string;
  createdAt: number;
  createdBy: string;
  changeSummary?: string;
  isTagged: boolean;
  tagName?: string;
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  userId: string;
  versionNumber: number;
  name: string;
  description: string;
  moduleIds: string[];
  config: FixedConfig;
  createdAt: number;
  createdBy: string;
  changeSummary?: string;
  isTagged: boolean;
  tagName?: string;
}

export interface VersionDiff {
  field: string;
  oldValue: unknown;
  newValue: unknown;
  changeType: 'added' | 'removed' | 'modified';
}

// Sharing Types
export type ShareType = 'module' | 'template' | 'batch_modules' | 'batch_templates';

export interface Share {
  id: string;
  shareKey: string;
  userId: string;
  shareType: ShareType;
  title: string;
  description?: string;
  dataJson: PromptModule | PromptTemplate;
  passwordHash?: string;
  expireAt?: number;
  viewCount: number;
  importCount: number;
  createdAt: number;
  lastAccessedAt?: number;
  isExpired?: boolean;
}

export interface CreateShareRequest {
  userId: string;
  shareType: ShareType;
  title: string;
  description?: string;
  data: PromptModule | PromptTemplate | PromptModule[] | PromptTemplate[];
  password?: string;
  expiresInDays?: number;
}

export interface ShareAccessRequest {
  shareKey: string;
  password?: string;
}
