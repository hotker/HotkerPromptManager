# Nano Banana 部署指南 (Cloudflare Pages)

此项目专为 **Cloudflare Pages** 设计。请严格按照以下步骤操作，无需本地配置文件 (wrangler.toml)。

## 1. 准备 KV 数据库

在开发或部署前，我们需要一个 KV 命名空间来存储用户数据。

**本地生成 ID (仅需一次):**
```bash
npm run kv:create
```
*请记下生成的 ID，稍后在 Cloudflare 后台会用到类似的名称配置。*

## 2. 部署流程 (推荐: Git 集成)

这是最标准、最稳定的 Pages 部署方式。

1. **推送代码**: 将项目推送到 GitHub 或 GitLab。
2. **创建项目**: 在 Cloudflare Dashboard > Pages > Create a project > Connect to Git。
3. **构建配置 (Build settings)**:
   * **Framework preset**: 选择 `Vite` (或者手动填写)
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
   * **Root directory**: `/` (默认即可)

4. **绑定数据库 (关键步骤)**:
   在部署完成前或完成后，进入项目设置 (Settings) > **Functions** > **KV Namespace Bindings**:
   * **Variable name**: `NANO_DB`  (必须完全一致)
   * **KV Namespace**: 选择或创建一个新的 KV 空间。

## 3. 常见问题 (FAQ)

**Q: 为什么没有 `wrangler.toml` 文件？**
A: Cloudflare Pages 推荐在 Dashboard 界面中管理配置（如环境变量和 KV 绑定），这样更安全且利于团队协作。我们的构建完全符合 Pages 标准，无需该文件。

**Q: 遇到 "Deploy command cannot be empty" 错误？**
A: 请检查您是否在某些第三方 CI/CD 工具中。在 Cloudflare Pages 的原生 Git 集成中，您只需要填写 **Build command** (`npm run build`)。它没有 "Deploy command" 这一项，因为部署是自动的。如果您是在手动上传，请直接拖拽 `dist` 文件夹，不要使用脚本。

**Q: 本地开发如何连接数据库？**
A: 我们已更新 `npm run dev:full` 命令，它会自动尝试连接名为 `NANO_DB` 的本地 KV 绑定。

```bash
npm run dev:full
```
