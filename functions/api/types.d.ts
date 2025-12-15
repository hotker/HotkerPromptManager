export interface Env {
  NANO_DB: any;
  DB?: any; // Optional D1 support
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
}

export type PagesContext = {
  request: Request;
  env: Env;
  params: Record<string, string | string[]>;
  data: Record<string, unknown>;
  next: () => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
};