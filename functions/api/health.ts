import { Env, PagesContext } from './types';

export const onRequest = async (context: PagesContext) => {
  const { env } = context;
  
  // Check if either KV (NANO_DB) or D1 (DB) is bound
  const isKvBound = env && !!env.NANO_DB;
  const isD1Bound = env && !!env.DB;
  
  const isDbBound = isKvBound || isD1Bound;

  return new Response(JSON.stringify({ 
    status: isDbBound ? 'healthy' : 'degraded',
    services: {
      database: isDbBound ? 'connected' : 'disconnected',
      type: isD1Bound ? 'D1 (SQL)' : (isKvBound ? 'KV (NoSQL)' : 'None')
    },
    timestamp: Date.now(),
    env: 'production'
  }), {
    headers: { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}