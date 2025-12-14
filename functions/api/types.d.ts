import { KVNamespace, EventContext } from '@cloudflare/workers-types';

export interface Env {
  NANO_DB: KVNamespace;
}

export type PagesContext = EventContext<Env, any, any>;