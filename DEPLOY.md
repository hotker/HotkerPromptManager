# Hotker Prompt Studio 部署指南 (Cloudflare Pages)

此项目专为 **Cloudflare Pages** 设计。支持使用 Cloudflare KV (轻量级) 或 Cloudflare D1 (SQL 数据库，推荐用于生产环境) 存储数据。

请严格按照以下步骤操作，无需本地配置文件 (wrangler.toml)。

## 1. 准备数据库

在开发或部署前，我们需要准备存储后端。系统会自动检测绑定的资源，如果绑定了 D1 则优先使用，否则回退到 KV。

### 选项 A: KV 命名空间 (轻量/简单)
适合个人使用或少量数据。

**本地生成 ID (仅需一次):**
```bash
npm run kv:create
```
*请记下生成的 ID，稍后在 Cloudflare 后台会用到类似的名称配置。*

### 选项 B: D1 数据库 (推荐/高性能)
适合多用户、高频数据读写及需要修改密码功能的场景。

1. **创建数据库**:
   ```bash
   npx wrangler d1 create hotker-db
   ```
   *记下控制台输出的 `database_id`。*

2. **初始化表结构 (Schema)**:
   您需要在数据库中创建表。可以通过 Cloudflare Dashboard 的 D1 控制台执行，或使用以下 SQL 语句：

   ```sql
   CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, provider TEXT, created_at INTEGER, avatar_url TEXT);
   CREATE TABLE IF NOT EXISTS user_data (user_id TEXT PRIMARY KEY, data_json TEXT, updated_at INTEGER);
   ```

## 2. 部署流程 (推荐: Git 集成)

这是最标准、最稳定的 Pages 部署方式。

1. **推送代码**: 将项目推送到 GitHub 或 GitLab。
2. **创建项目**: 在 Cloudflare Dashboard > Pages > Create a project > Connect to Git。
3. **构建配置 (Build settings)**:
   * **Framework preset**: 选择 `Vite` (或者手动填写)
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
   * **Root directory**: `/` (默认即可)

4. **绑定资源 (关键步骤)**:
   在部署完成前或完成后，进入项目设置 (Settings) > **Functions**。

   **配置 KV (如果使用):**
   * 找到 **KV Namespace Bindings**
   * **Variable name**: `NANO_DB` (必须完全一致)
   * **KV Namespace**: 选择您创建的 KV 空间。

   **配置 D1 (如果使用):**
   * 找到 **D1 Database Bindings**
   * **Variable name**: `DB` (必须完全一致)
   * **D1 Database**: 选择您创建的 `hotker-db`。

   *注意：您可以同时绑定两者，或者只绑定其中一个。*

## 3. 配置 Google 登录 (OAuth)

要启用 Google 登录功能，您需要配置环境变量。

1. **获取 Google 凭证**:
   * 访问 [Google Cloud Console](https://console.cloud.google.com/).
   * 创建一个新项目或选择现有项目。
   * 进入 **APIs & Services** > **Credentials**.
   * 点击 **Create Credentials** > **OAuth client ID**.
   * 应用类型选择 **Web application**.
   * **Authorized redirect URIs** 添加: `https://<你的域名>.pages.dev/api/auth?action=google-callback`
     * *注意: 确保添加你的生产域名和预览域名（如果需要测试）。*
   * 创建后，复制 **Client ID** 和 **Client Secret**.

2. **设置环境变量**:
   * 在 Cloudflare Pages 项目设置 > **Environment variables**。
   * 添加变量 `GOOGLE_CLIENT_ID`: 填入你的 Google Client ID。
   * 添加变量 `GOOGLE_CLIENT_SECRET`: 填入你的 Google Client Secret。
   * (为了安全，建议点击 "Encrypt" 按钮加密 Secret)

3. **重新部署**:
   保存环境变量后，您可能需要重新部署一次 (Retry deployment) 以使变量生效。

## 4. 常见问题 (FAQ)

**Q: 为什么没有 `wrangler.toml` 文件？**
A: Cloudflare Pages 推荐在 Dashboard 界面中管理配置（如环境变量和 KV/D1 绑定），这样更安全且利于团队协作。

**Q: 遇到 "Deploy command cannot be empty" 错误？**
A: 请检查您是否在某些第三方 CI/CD 工具中。在 Cloudflare Pages 的原生 Git 集成中，您只需要填写 **Build command** (`npm run build`)。

**Q: Google 登录报错 "redirect_uri_mismatch"?**
A: 请确保你在 Google Cloud Console 中配置的 Redirect URI 与浏览器地址栏中的域名完全一致（包括协议 https）。