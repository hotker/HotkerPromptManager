# Nano Banana 部署指南 (Cloudflare Pages)

## 🚨 紧急修复：访问显示 "Hello World" ?

如果您访问部署后的域名看到 "Hello World" 而不是应用界面，这是因为默认的 Worker 脚本拦截了您的网页。请执行以下检查：

1.  **删除冲突文件 (关键)**: 检查您的项目目录下的 `functions` 文件夹。如果存在 `functions/index.ts`、`functions/helloworld.ts` 或 `worker.js`，**请立即删除它们**。
    *   Nano Banana 的路由是由 `index.html` (前端) 和 `functions/api/*` (后端) 组成的。根目录 `/` 不应由 Functions 接管。
2.  **配置文件修正**: 确保 `wrangler.toml` 包含 `pages_build_output_dir = "dist"` (如下所示)。

---

## 🚀 正确部署步骤

### 1. 准备配置 (wrangler.toml)

```toml
name = "nano-banana"
compatibility_date = "2024-04-01"
pages_build_output_dir = "dist"

[[kv_namespaces]]
binding = "NANO_DB"
id = "您的_KV_ID"
```

### 2. 本地命令部署 (推荐)

不要使用 `wrangler deploy` (这是 Worker 的命令)，请使用以下组合：

```bash
# 1. 安装依赖
npm install

# 2. 绑定数据库 ID (如果没做过)
npx wrangler kv:namespace create NANO_DB
# -> 将生成的 ID 填入 wrangler.toml

# 3. 构建前端
npm run build

# 4. 部署到 Pages (确保 dist 目录存在)
npx wrangler pages deploy dist
```

### 3. Cloudflare Dashboard 设置 (如果是 Git 自动部署)

1.  登录 Cloudflare Dashboard -> Pages -> 点击您的项目。
2.  进入 **Settings** -> **Functions** -> **KV Namespace Bindings**。
3.  添加绑定:
    *   Variable name: `NANO_DB`
    *   Namespace: 选择您的 KV 数据库
4.  进入 **Deployments** 标签页，点击最新部署右侧的三个点 -> **Retry deployment** (重试部署) 以确保绑定生效。

## 本地开发预览

```bash
npm run build
npx wrangler pages dev dist
```
