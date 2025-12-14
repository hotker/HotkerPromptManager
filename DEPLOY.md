# Nano Banana 部署指南 (Cloudflare Pages)

## 🚨 部署故障排除 (Log Analysis)

根据您的日志，构建 (`npm run build`) 已成功，但在执行部署命令 (`npx wrangler deploy`) 时失败，提示 `Missing entry-point`。

### 核心解决方案

1.  **添加配置文件 (已自动创建)**:
    项目根目录必须包含 `wrangler.toml`，并且其中必须指定 `pages_build_output_dir = "dist"`。我已经为您创建了这个文件。

2.  **设置 KV 数据库 ID (必须)**:
    您需要获取 KV 数据库 ID 并填入 `wrangler.toml`，否则应用无法保存数据。
    *   运行: `npx wrangler kv:namespace create NANO_DB`
    *   复制生成的 ID。
    *   修改 `wrangler.toml`: 将 `id = "请替换为您的_KV_ID"` 替换为真实 ID。

3.  **检查 Cloudflare Dashboard 设置**:
    *   **Build command**: 建议设置为 `npm run build`。
        *   *注意*: 如果您一定要在 Cloudflare 的 Build Command 中包含 `npx wrangler deploy`，上述的 `wrangler.toml` 修复将使该命令正常工作。但通常 Cloudflare Pages 会自动处理部署，不需要显式运行 deploy 命令。
    *   **Build output directory**: `dist`
    *   **Environment Variables**: 确保添加 `NANO_DB` 的绑定 (Settings -> Functions -> KV Namespace Bindings)。

---

## 🛠️ 详细步骤

### 1. 本地准备

```bash
# 安装依赖
npm install

# 创建数据库 (记录返回的 ID)
npx wrangler kv:namespace create NANO_DB

# 编辑 wrangler.toml 填入 ID
# id = "e5c1..."
```

### 2. 部署

**方式 A: 使用 Git 集成 (推荐)**
1.  将代码推送到 GitHub。
2.  在 Cloudflare Pages Dashboard 中连接仓库。
3.  构建配置:
    *   Build command: `npm run build`
    *   Output directory: `dist`
4.  **关键步骤**: 部署完成后，进入项目 Settings -> Functions -> KV Namespace Bindings，绑定 `NANO_DB` 到您创建的 KV 空间。

**方式 B: 命令行直接部署**
由于我们已经配置了 `wrangler.toml`，现在可以直接运行：

```bash
npm run build
npx wrangler pages deploy dist
```

### 常见问题: "Hello World"

如果访问页面只显示 "Hello World"：
1.  检查项目根目录或 `functions` 目录下是否有 `index.ts` / `helloworld.ts` / `worker.js`。
2.  **删除这些文件**。Nano Banana 使用 `functions/api` 目录作为后端，根路径 `/` 应该由前端 `index.html` 接管。

### 常见问题: 构建警告

日志中的 `warn: Duplicate dependency` 是因为 `package.json` 中重复声明了 `vite` 或插件。这通常不影响部署，但建议手动清理 `package.json` 中的重复项。
