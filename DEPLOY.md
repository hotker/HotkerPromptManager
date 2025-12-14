# Nano Banana 部署指南 (Cloudflare Pages)

## 🛠️ 关键修复：配置 Wrangler

项目现已包含 `wrangler.toml` 文件，用于解决 "Missing entry-point" 错误。

### 1. 设置 KV 数据库 ID (必须)

为了让登录和数据保存功能正常工作，您需要将真实的数据库 ID 填入配置文件。

1.  打开终端，运行以下命令创建数据库：
    ```bash
    npx wrangler kv:namespace create NANO_DB
    ```
2.  终端会返回一个 ID（例如 `e5c1...`）。
3.  打开根目录下的 `wrangler.toml` 文件。
4.  将 `id = "..."` 替换为您刚刚获得的 ID。

### 2. Cloudflare Dashboard 核对

在部署到 Cloudflare Pages 时，请确保后台设置正确：

*   **Build command**: `npm run build`
*   **Build output directory**: `dist`
*   **KV Namespace Bindings** (在 Settings -> Functions 中):
    *   Variable name: `NANO_DB`
    *   Namespace: 选择您创建的数据库

---

## 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 构建项目
npm run build

# 3. 启动本地预览 (模拟 Cloudflare 环境)
npx wrangler pages dev dist
```