# Nano Banana 部署与修复指南

## 🚨 紧急修复：部署失败 (Error: Workers-specific command)

如果您的部署日志出现 `It looks like you've run a Workers-specific command in a Pages project`，请严格按照以下步骤检查 Cloudflare 设置。

### 1. 检查 Cloudflare Pages 设置 (最常见原因)

1.  登录 Cloudflare Dashboard。
2.  进入您的 Pages 项目。
3.  点击 **Settings (设置)** -> **Build & deployments (构建与部署)**。
4.  点击 **Edit (编辑)**。
5.  **检查以下配置**：
    *   ✅ **Build command (构建命令)**: `npm run build`
    *   ✅ **Build output directory (构建输出目录)**: `dist`
    *   ❌ **Deploy command (部署命令)**: **必须为空！** (Leave Blank)

> **解释**：Cloudflare Pages 会在构建完成后自动检测并上传 `dist` 目录。如果您在 "Deploy command" 中填入了 `npx wrangler deploy` 或 `npm run deploy`，它会尝试在构建容器内再次运行部署命令，从而导致上述错误。

### 2. 本地部署

如果您是在本地终端运行部署，请使用以下命令：

```bash
# 不要运行 wrangler deploy (这是 Worker 命令)
# 请运行：
npm run deploy
```

(该命令对应 `package.json` 中的 `wrangler pages deploy dist`，这是正确的 Pages 命令)。

---

## 🛠️ KV 数据库配置

1.  创建 KV 命名空间：
    ```bash
    npm run kv:create
    ```
2.  复制输出的 `id` (例如 `e0c4...`)。
3.  打开项目根目录下的 `wrangler.toml` 文件。
4.  替换 `id` 字段：
    ```toml
    [[kv_namespaces]]
    binding = "NANO_DB"
    id = "e0c4..."  <-- 粘贴到这里
    ```
5.  **重要**：您还需要在 Cloudflare Dashboard > Settings > Functions > KV Namespace Bindings 中手动添加这个绑定，变量名为 `NANO_DB`。
