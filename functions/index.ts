// Cloudflare Pages Functions
// 这是一个“放行”处理程序。
// 它告诉 Cloudflare：对于根路径 "/"，请不要返回 API 响应，
// 而是继续处理请求，这通常意味着提供静态资源 (dist/index.html)。

export const onRequest = async (context: any) => {
  return context.next();
};