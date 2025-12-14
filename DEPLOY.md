# Nano Banana 部署指南

## 1. 准备工作

在部署之前，必须配置数据库绑定：

1. **生成数据库**:
   在终端运行：
   ```bash
   npm run kv:create
   ```
   复制输出的 ID (例如 `e5c8...`).

2. **配置 wrangler.toml**:
   打开项目根目录下的 `wrangler.toml` 文件，将 `id = "YOUR_KV_ID_HERE"` 替换为您刚才复制的真实 ID。

## 2. 部署方式

由于 Cloudflare Pages 的机制，我们推荐以下两种方式：

### 方式 A: Git 自动部署 (推荐)
1. 将代码推送到 GitHub/GitLab。
2. 在 Cloudflare Dashboard 创建新 Pages 项目，连接 Git 仓库。
3. **构建设置**:
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
4. **绑定 KV**:
   在项目设置 > Functions > KV Namespace Bindings 中：
   * Variable name: `NANO_DB`
   * Namespace: 选择您创建的 KV 空间

### 方式 B: 手动命令行部署
如果您需要在本地直接上传，请在终端直接执行以下命令 (不要写在 package.json 里)：

```bash
npm run build
npx wrangler pages deploy dist
```

---

## 环境要求
* Cloudflare KV Namespace (用于存储数据)
* Google Gemini API Key (用户需在应用界面内输入)
