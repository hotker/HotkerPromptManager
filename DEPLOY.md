# Nano Banana 部署指南 (Cloudflare Pages)

## 🚨 部署修复检查清单

### 1. 配置文件 (已自动创建)
项目根目录现已包含 `wrangler.toml`。此文件至关重要，它告诉 Cloudflare：
- 这是一个 **Pages** 项目。
- 构建输出位于 `dist` 目录。
- 需要绑定 `NANO_DB` 数据库。

### 2. Cloudflare Dashboard 设置 (请务必核对)
登录 Cloudflare Dashboard -> Pages -> Settings -> Builds & deployments：

*   **Build command**: `npm run build`
    *   (⚠️ 注意：如果这里之前写了 `npx wrangler deploy`，请去掉它，或者保留它均可，因为现在有了 `wrangler.toml`，该命令也能正常工作了，但推荐只用 `npm run build`)。
*   **Build output directory**: `dist`

### 3. KV 数据库配置 (最后一步)
为了让登录功能正常工作，您需要填入真实的 KV ID：

1.  **本地/命令行**:
    *   运行: `npx wrangler kv:namespace create NANO_DB`
    *   复制生成的 ID，修改 `wrangler.toml` 中的 `id = "..."`。

2.  **Cloudflare 后台 (生产环境)**:
    *   进入 **Settings** -> **Functions** -> **KV Namespace Bindings**。
    *   添加绑定: Variable name: `NANO_DB`, Namespace: 选择您创建的数据库。

---

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器 (会自动读取 wrangler.toml)
npm run build
npx wrangler pages dev dist
```
