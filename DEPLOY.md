# Nano Banana 部署指南 (GitHub 集成版)

## 核心修复 (解决 Deploy Error)

您之前的错误是因为 Cloudflare 不知道构建产物在哪里。我们已经更新了 `wrangler.toml` 指向 `dist` 目录。

## Cloudflare Dashboard 设置检查 (关键!)

请登录 Cloudflare Dashboard，进入您的 Pages 项目，点击 **Settings (设置)** -> **Builds & deployments (构建与部署)**，确保设置如下：

1.  **Build command (构建命令)**: `npm run build`
    *   *切勿* 在这里填 `npx wrangler deploy`，Cloudflare 会在构建成功后自动处理部署。
2.  **Build output directory (构建输出目录)**: `dist`
3.  **Root directory (根目录)**: `/` (或者留空)

## 绑定数据库 (KV)

为了让登录和保存功能正常工作，您必须在 Cloudflare 后台绑定数据库：

1.  进入项目 **Settings (设置)** -> **Functions (函数)**。
2.  找到 **KV Namespace Bindings**。
3.  点击 **Add binding**:
    *   **Variable name**: `NANO_DB` (必须完全一致)
    *   **KV Namespace**: 选择您创建的 `NANO_DB` 数据库。
4.  保存后，前往 **Deployments (部署)** 选项卡，点击最新的部署右侧的三个点，选择 **Retry deployment (重试部署)**，或者在 GitHub 上提交一个新的 Commit 触发重新部署。

---

## 本地开发

```bash
npm run build
npx wrangler pages dev dist --kv=NANO_DB
```
