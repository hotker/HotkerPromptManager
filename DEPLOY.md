# Nano Banana 部署指南 (Cloudflare Pages + KV)

本应用采用 **Cloudflare Pages** 进行托管，后端数据存储使用 **Cloudflare Workers KV**。无需传统服务器，完全 Serverless。

## 前置准备

1.  注册一个 [Cloudflare](https://dash.cloudflare.com/sign-up) 账户。
2.  安装 Node.js 和 npm。
3.  安装 Cloudflare CLI 工具 Wrangler：
    ```bash
    npm install -g wrangler
    ```
4.  登录 Wrangler：
    ```bash
    npx wrangler login
    ```

---

## 步骤 1: 创建 KV 数据库

我们需要在 Cloudflare 上创建一个 KV 命名空间来存储用户数据。

1.  打开终端，运行以下命令创建命名空间：
    ```bash
    npx wrangler kv:namespace create "NANO_DB"
    ```
    *(终端会返回一个 `id`，类似于 `e6a3...`，请暂时记下它)*

---

## 步骤 2: 配置 Wrangler (本地开发与部署)

在项目根目录下创建一个名为 `wrangler.toml` 的文件，填入以下内容：

```toml
name = "nano-banana"
pages_build_output_dir = "."
compatibility_date = "2024-01-01"

# 绑定 KV 数据库
[[kv_namespaces]]
binding = "NANO_DB"
id = "<替换为你刚才生成的_KV_ID>"
```

---

## 步骤 3: 部署到 Cloudflare Pages

### 方法 A: 使用 CLI 直接部署 (推荐，最快)

由于项目不需要构建步骤（No-Build），直接上传当前目录即可。

1.  运行部署命令：
    ```bash
    npx wrangler pages deploy . --project-name nano-banana
    ```
    *选择 `Create a new project` (如果是第一次)*

2.  **关键步骤：在控制台绑定 KV**
    虽然 `wrangler.toml` 用于本地开发，但生产环境需要在 Cloudflare Dashboard 再次确认绑定。
    
    1.  登录 Cloudflare Dashboard。
    2.  进入 **Workers & Pages** -> 选择 **nano-banana**。
    3.  进入 **Settings (设置)** -> **Functions (函数)**。
    4.  找到 **KV Namespace Bindings** 部分。
    5.  点击 **Add binding**：
        *   **Variable name (变量名)**: 必须填写 `NANO_DB`
        *   **KV Namespace**: 选择你在步骤 1 创建的那个命名空间。
    6.  点击 **Save**。

3.  **配置系统 API Key (可选)**
    如果你想为特定用户（如管理员）提供默认的 Google API Key：
    1.  在同一页面的 **Environment Variables** 部分。
    2.  添加变量：
        *   Key: `API_KEY`
        *   Value: `你的_Google_Gemini_Key`
    3.  **注意**：由于前端直接读取 `process.env` 在纯浏览器环境可能会报错，建议在 `index.html` 头部添加以下 Polyfill (见下文“代码微调”)，或者主要依赖用户在侧边栏自行输入 Key。

---

## 步骤 4: 代码微调 (解决浏览器环境兼容性)

由于本项目使用了 `process.env` 但没有使用 Vite/Webpack 打包，直接部署后浏览器可能会报 `process is not defined`。

建议在 `index.html` 的 `<head>` 标签内，`<script type="importmap">` 之前添加以下代码：

```html
<script>
  // 简单的 Process Polyfill，防止前端报错
  window.process = {
    env: {
      NODE_ENV: 'production',
      // 如果你希望前端也能读取到 Key，可以在构建时替换这里，
      // 但为了安全，通常建议留空，让用户自己填 Key。
      API_KEY: '' 
    }
  };
</script>
```

---

## 本地开发

要在本地模拟 Cloudflare 环境运行（包含后端 API 支持）：

```bash
npx wrangler pages dev . --kv=NANO_DB
```

访问 `http://localhost:8788` 即可使用完整的全栈功能。

---

## 故障排查

1.  **登录时报错 500?**
    *   检查 Cloudflare Dashboard 中 `Functions` -> `KV Namespace Bindings` 是否已正确绑定 `NANO_DB`。
    
2.  **数据无法保存?**
    *   KV 属于最终一致性数据库，极少数情况下可能有几毫秒延迟，但在本应用场景下通常无感。
    *   检查网络请求是否发送到了 `/api/data`。

3.  **如何查看数据库内容?**
    *   使用命令: `npx wrangler kv:key list --binding=NANO_DB`
