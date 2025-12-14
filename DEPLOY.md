# Nano Banana 部署指南 (Cloudflare Pages)

## 🚨 紧急修复：部署失败 (wrangler: not found)

如果您在日志中看到 `/bin/sh: 1: wrangler: not found`，请立即检查您的 Cloudflare 配置。

**Cloudflare Pages 不需要手动运行 deploy 命令！**

### ❌ 错误的配置
*   Build command: `npm run build && wrangler pages deploy` (错误！)
*   Build command: `wrangler pages deploy` (错误！)

### ✅ 正确的配置 (请在 Cloudflare 后台修改)

进入项目 **Settings** -> **Build & deployments** -> **Edit configuration**:

1.  **Build command**: `npm run build`
    *   *仅此而已。Cloudflare 会在构建完成后自动接管部署。*
2.  **Build output directory**: `dist`
3.  **Root directory**: `/` (默认)

---

## 🛠️ 数据库绑定 (必做)

应用部署成功后，必须绑定 KV 数据库才能保存数据：

1.  创建数据库 (本地终端):
    ```bash
    npx wrangler kv:namespace create NANO_DB
    ```
    *记下返回的 ID*。

2.  绑定 (Cloudflare 后台):
    *   进入 **Settings** -> **Functions** -> **KV Namespace Bindings**
    *   **Variable name**: `NANO_DB`
    *   **KV Namespace**: 选择您创建的数据库

3.  **重试部署**: 绑定变量后，必须去 **Deployments** 标签页点击 **Retry deployment** 才能生效。

## 本地开发

```bash
# 安装依赖
npm install

# 启动本地预览
npm run dev
```
