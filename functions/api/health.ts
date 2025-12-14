interface Env {
  NANO_DB: any;
}

export const onRequest = async (context: any) => {
  const { env } = context;
  const isDbBound = !!env.NANO_DB;

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