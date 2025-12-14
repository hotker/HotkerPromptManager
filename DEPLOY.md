# Nano Banana 部署指南

## ✅ 修复部署错误 (Fix Deployment)

**关键步骤**: 如果您遇到 "Workers-specific command" 错误，是因为缺少 `wrangler.toml`。

1. **配置 ID**:
   打开项目根目录下的 `wrangler.toml` 文件，将 `id = "YOUR_KV_ID_HERE"` 替换为您真实的 KV ID。
   *(如果没有 ID，请运行 `npm run kv:create` 生成)*

2. **Cloudflare 设置**:
   * **Build command**: `npm run build`
   * **Build output directory**: `dist`
   * **Deploy command** (如果必填): `npx wrangler deploy`
     *(有了 `wrangler.toml` 文件后，这个命令就能正常工作了)*

## ☁️ 部署命令

在本地终端部署：
```bash
npm run deploy
```

---

## 环境要求
* Cloudflare KV Namespace (用于存储数据)
* Google Gemini API Key (用户需自行提供)
