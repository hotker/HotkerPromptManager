interface Env {
  // Fix: Use 'any' as KVNamespace type is not available in current context
  NANO_DB: any;
}

// Fix: Remove explicit PagesFunction type and use 'any' for context to avoid compilation errors
export const onRequestGet = async (context: any) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const userId = url.searchParams.get('userId');

  if (!userId) {
    return new Response('Missing userId', { status: 400 });
  }
  
  // Fetch user data package
  const dataStr = await env.NANO_DB.get(`DATA:${userId}`);
  
  // Return empty structure if new user
  const data = dataStr ? JSON.parse(dataStr) : { modules: [], templates: [], logs: [], apiKey: '' };
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Fix: Remove explicit PagesFunction type and use 'any' for context to avoid compilation errors
export const onRequestPost = async (context: any) => {
  const { request, env } = context;
  const body: any = await request.json();
  const { userId, data } = body;
  
  if (!userId || !data) {
    return new Response('Missing data', { status: 400 });
  }
  
  // Save entire data blob
  // KV value limit is 25MB, sufficient for text prompts
  await env.NANO_DB.put(`DATA:${userId}`, JSON.stringify(data));
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}