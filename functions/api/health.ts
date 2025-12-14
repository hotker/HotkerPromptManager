import { Env, PagesContext } from './types';

export const onRequest = async (context: PagesContext) => {
  const { env } = context;
  // Check if env object exists and NANO_DB property is present
  const isDbBound = env && !!env.NANO_DB;

  return new Response(JSON.stringify({ 
    status: isDbBound ? 'healthy' : 'degraded',
    services: {
      database: isDbBound ? 'connected' : 'disconnected'
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