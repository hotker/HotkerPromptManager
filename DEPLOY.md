# Nano Banana 部署与修复指南

## 🛑 必须执行的操作：修复部署失败

您的部署日志显示系统正在执行 `npx wrangler deploy`，这导致了错误。

**请立即执行以下步骤：**

1.  登录 Cloudflare Dashboard。
2.  进入您的 Pages 项目 (nano-banana-prompt-workshop)。
3.  点击顶部标签栏的 **Settings (设置)** -> **Build & deployments (构建与部署)**。
4.  找到 **Build configurations (构建配置)** 部分，点击 **Edit (编辑)**。
5.  **关键步骤**：
    *   **Build command (构建命令)**: 保持为 `npm run build`。
    *   **Build output directory (构建输出目录)**: 保持为 `dist`。
    *   **Deploy command (部署命令)**: **请将其清空！** (不要填写 `npx wrangler deploy`，因为 Pages 会自动部署 `dist` 目录)。
6.  点击 **Save (保存)**。
7.  回到 **Deployments** 标签页，点击 **Retry deployment (重试部署)**。

---

## 🛠️ KV 数据库绑定

确保 `wrangler.toml` 中的 `id` 已替换为您真实的 KV ID。

```toml
[[kv_namespaces]]
binding = "NANO_DB"
id = "您的_KV_ID" 
```
