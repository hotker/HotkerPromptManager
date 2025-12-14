# Nano Banana 部署指南

## 🚀 快速部署 (Quick Start)

本项目已配置为支持 Cloudflare Pages 的统一部署模式 (Unified Deployment)。

### 1. 安装依赖
```bash
npm install
```

### 2. 配置 KV 数据库
Nano Banana 使用 Cloudflare KV 存储用户数据。

1. 创建 KV 命名空间：
   ```bash
   npm run kv:create
   ```
   *(或者手动运行: `npx wrangler kv:namespace create NANO_DB`)*

2. 复制终端输出的 `id` (例如 `e0c4...`)。

3. 打开 `wrangler.toml` 文件，填入 `id`：
   ```toml
   [[kv_namespaces]]
   binding = "NANO_DB"
   id = "e0c4..."  <-- 粘贴到这里
   preview_id = "e0c4..." <-- 本地开发也可使用相同 ID (或新建一个用于测试)
   ```

### 3. 部署到 Cloudflare Pages
```bash
npm run deploy
```
此命令会执行构建 (`npm run build`) 并自动部署 (`npx wrangler deploy`)。

> **注意**: 如果这是第一次部署，Wrangler 会提示您登录 Cloudflare 并创建 Pages 项目。

---

## ☁️ Cloudflare Dashboard 设置 (Git 集成)

如果您将代码推送到 GitHub/GitLab 并连接了 Cloudflare Pages：

1. **Build command (构建命令)**: `npm run build`
2. **Build output directory (构建输出目录)**: `dist`
3. **Deploy command (部署命令)**: **请留空** (Cloudflare 会自动处理)
4. **Root directory (根目录)**: `/` (默认)
5. **KV Bindings (KV 绑定)**:
   * 进入 Pages 项目 -> Settings -> Functions -> KV Namespace Bindings
   * 添加绑定: Variable name = `NANO_DB`, Namespace = (选择您创建的 KV)

---

## 常见问题

### Error: "Workers-specific command"
如果您在没有 `wrangler.toml` 的情况下运行 `wrangler deploy`，会出现此错误。本项目已包含配置好的 `wrangler.toml` (带有 `pages_build_output_dir`)，因此直接运行 `npm run deploy` 即可。

### 数据库连接失败
请确保 `wrangler.toml` 中的 `id` 已正确填写，并且在 Cloudflare Dashboard 中也配置了相同的 KV 绑定。
