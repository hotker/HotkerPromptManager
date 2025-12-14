interface Env {
  NANO_DB: any;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestGet = async (context: any) => {
  const { request, env } = context;
  
  if (!env.NANO_DB) {
     return new Response(JSON.stringify({ error: '服务端 NANO_DB 未绑定' }), { status: 500, headers: corsHeaders });
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response('Missing userId', { status: 400, headers: corsHeaders });
  }
  
  const dataStr = await env.NANO_DB.get(`DATA:${userId}`);
  const data = dataStr ? JSON.parse(dataStr) : { modules: [], templates: [], logs: [], apiKey: '' };
  
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export const onRequestPost = async (context: any) => {
  const { request, env } = context;

  if (!env.NANO_DB) {
     return new Response(JSON.stringify({ error: '服务端 NANO_DB 未绑定' }), { status: 500, headers: corsHeaders });
  }

  try {
    const body: any = await request.json();
    const { userId, data } = body;
    
    if (!userId || !data) {
      return new Response('Missing data', { status: 400, headers: corsHeaders });
    }
    
    await env.NANO_DB.put(`DATA:${userId}`, JSON.stringify(data));
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response('Error parsing JSON', { status: 400, headers: corsHeaders });
  }
}