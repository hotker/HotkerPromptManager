# Nano Banana 部署指南 (Cloudflare Pages)

## 🚨 错误修复指南 (针对日志报错)

您的部署失败是因为使用了错误的命令：`npx wrangler deploy`。这是 Cloudflare Workers 的命令，不适用于 Pages。

### ✅ 正确的部署方式

#### 方式 1: Cloudflare Dashboard (Git 自动部署) - 推荐
如果您是在 Cloudflare 后台连接 GitHub 仓库进行部署：

1.  **Build command (构建命令)**: 填写 `npm run build`
    *   **切勿**在此处添加 `npx wrangler deploy`。
2.  **Build output directory (输出目录)**: 填写 `dist`
3.  **绑定数据库 (关键)**:
    *   部署完成后，进入 **Settings** -> **Functions** -> **KV Namespace Bindings**。
    *   添加绑定：Variable name: `NANO_DB`, Namespace: 选择您的 KV 数据库。
    *   **重新部署**: 绑定后必须点击 Deployments -> Retry deployment 才能生效。

#### 方式 2: 命令行手动部署
如果您在本地终端部署，请使用以下命令：

```bash
# 1. 构建
npm run build

# 2. 部署 (注意中间的 'pages')
npx wrangler pages deploy dist
```

---

## 🛠️ 初始化准备

首次部署前，请确保已创建 KV 数据库并配置 ID：

1.  **创建数据库**:
    ```bash
    npx wrangler kv:namespace create NANO_DB
    ```
2.  **更新配置**:
    复制上一步生成的 ID，打开项目根目录的 `wrangler.toml` 文件，替换 `id` 字段：
    ```toml
    [[kv_namespaces]]
    binding = "NANO_DB"
    id = "您的_KV_ID_在此"
    ```

## 常见问题

*   **访问页面显示 "Hello World"**: 检查并删除项目中的 `functions/worker.js` 或 `functions/index.ts`（保留 `functions/api` 目录）。
*   **无法保存数据 / 同步失败**: 检查 Cloudflare 后台是否正确绑定了 `NANO_DB` 变量。
