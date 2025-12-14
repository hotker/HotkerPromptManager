interface Env {
  NANO_DB: any;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions = async () => {
  return new Response(null, { headers: corsHeaders });
};

export const onRequestPost = async (context: any) => {
  try {
    const { request, env } = context;

    // Database Binding Check
    if (!env.NANO_DB) {
      return new Response(JSON.stringify({ error: '服务端配置错误: NANO_DB 未绑定' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('action');
    let body: any = {};
    
    try {
      body = await request.json();
    } catch (e) {
      return new Response(JSON.stringify({ error: '无效的 JSON 请求体' }), { status: 400, headers: corsHeaders });
    }

    // REGISTER
    if (type === 'register') {
      const { username, password } = body;
      
      if (!username || !password) {
        return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const existing = await env.NANO_DB.get(`USER:${username}`);
      if (existing) {
        return new Response(JSON.stringify({ error: '该用户名已被注册' }), { 
          status: 409,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const newUser = {
        id: crypto.randomUUID(),
        username,
        password, // Note: In production, consider hashing passwords
        provider: 'local',
        createdAt: Date.now(),
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
      };

      await env.NANO_DB.put(`USER:${username}`, JSON.stringify(newUser));
      
      return new Response(JSON.stringify(newUser), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } 
    
    // LOGIN
    if (type === 'login') {
      const { username, password } = body;
      const userStr = await env.NANO_DB.get(`USER:${username}`);
      
      if (!userStr) {
        return new Response(JSON.stringify({ error: '用户不存在' }), { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      const user = JSON.parse(userStr);
      if (user.password !== password) {
        return new Response(JSON.stringify({ error: '密码错误' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
      }
      
      return new Response(JSON.stringify(user), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { 
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'Server Error' }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}