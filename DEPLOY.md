# Nano Banana 部署求救指南

## 🚨 紧急：关于部署失败的修复 (ERROR: Workers-specific command)

如果您的日志显示：
`[ERROR] It looks like you've run a Workers-specific command in a Pages project.`

**原因**：
系统执行了 `npx wrangler deploy`（这是用于部署 Workers 的命令）。
对于 Nano Banana 这样的 Pages 项目，**必须**使用 `npx wrangler pages deploy`。

**解决方案**：

1.  **如果您在本地命令行部署**：
    请运行：
    ```bash
    npm run deploy
    ```
    (这个命令已经在 package.json 中配置为使用 correct 的 pages 命令)

2.  **如果您在 Cloudflare Dashboard 设置中**：
    *   **Build command (构建命令)**: `npm run build`
    *   **Build output directory (输出目录)**: `dist`
    *   **不要**在任何自定义部署脚本中填写 `npx wrangler deploy`。Cloudflare Pages 会在构建完成后自动部署 `dist` 目录，不需要额外的部署命令。

---

## 🛠️ KV 数据库绑定 (必须步骤)

为了让登录和保存功能正常工作，您需要创建一个 KV Namespace 并绑定它。

1.  运行 `npx wrangler kv:namespace create NANO_DB` 创建数据库。
2.  复制返回的 `id`。
3.  打开项目根目录下的 `wrangler.toml` 文件。
4.  将 `id` 替换为您刚刚获得的 ID：

```toml
[[kv_namespaces]]
binding = "NANO_DB"
id = "您的_KV_ID_粘贴在这里" 
```

## 环境变量
如果您想让应用自带默认的 Google API Key (仅供演示或内部使用)，请在 Cloudflare Pages 后台设置环境变量：
*   `VITE_API_KEY`: `您的_Gemini_API_Key`

