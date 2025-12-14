interface Env {
  // Fix: Use 'any' as KVNamespace type is not available in current context
  NANO_DB: any;
}

// Fix: Remove explicit PagesFunction type and use 'any' for context to avoid compilation errors
export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const type = url.searchParams.get('action');
    const body: any = await request.json();

    // REGISTER
    if (type === 'register') {
      const { username, password } = body;
      
      // Check if user exists
      const existing = await env.NANO_DB.get(`USER:${username}`);
      if (existing) {
        return new Response(JSON.stringify({ error: '该用户名已被注册' }), { 
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const newUser = {
        id: crypto.randomUUID(),
        username,
        password, // Note: In production, use crypto.subtle to hash passwords
        provider: 'local',
        createdAt: Date.now(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      };

      // Save User
      await env.NANO_DB.put(`USER:${username}`, JSON.stringify(newUser));
      
      return new Response(JSON.stringify(newUser), {
        headers: { 'Content-Type': 'application/json' }
      });
    } 
    
    // LOGIN
    if (type === 'login') {
      const { username, password } = body;
      const userStr = await env.NANO_DB.get(`USER:${username}`);
      
      if (!userStr) {
        return new Response(JSON.stringify({ error: '用户不存在' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      
      const user = JSON.parse(userStr);
      if (user.password !== password) {
        return new Response(JSON.stringify({ error: '密码错误' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
      }
      
      return new Response(JSON.stringify(user), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Invalid action', { status: 400 });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
}