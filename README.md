[English](./README_EN.md) | [中文](./README.md)

# Hotker Prompt Studio 🚀

**商业级模块化提示词工程系统 (Enterprise Modular Prompt Engineering System)**

Hotker Prompt Studio 是一个专为提示词工程师设计的现代化工作台。它采用“积木式”理念，帮助你将复杂的 Prompt 拆解为可复用的模块（角色、任务、背景、约束等），并通过可视化的方式进行组装、测试和迭代。

专为 **Google Gemini** 模型优化，完美适配 Cloudflare Serverless 架构，支持高并发生产环境。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)

---

## ✨ 核心特性

*   **🧩 模块化管理**: 将 Prompt 拆解为独立的“积木” (Modules)，建立你的专属素材库，拒绝重复造轮子。
*   **🛠️ 可视化构建**: 像搭积木一样组装 Prompt，支持拖拽排序、实时预览和固定参数配置。
*   **⚡ 极速调试**: 深度集成 **Google Gemini 2.5 Flash / 3.0 Pro** 模型，支持文本生成与图像生成测试。
*   **📱 全端适配**: 响应式设计，完美支持 iPhone 及移动端，随时随地捕捉灵感。
*   **📊 数据驱动**: 自动记录运行历史、延迟和成功率，支持评分与复盘，让 Prompt 优化有据可依。
*   **☁️ Cloudflare 原生**: 基于 Cloudflare Pages 构建，支持 **KV** (轻量) 和 **D1** (SQL) 两种数据库模式，从个人开发到企业级应用无缝切换。
*   **🌍 双语支持**: 内置中英文界面切换 (i18n)。

## 🛠️ 技术栈

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
*   **UI Components**: Lucide React, Recharts
*   **AI SDK**: Google GenAI SDK (Gemini)
*   **Infrastructure**: Cloudflare Pages (Functions + KV/D1 Databases)

## 🚀 快速开始

### 1. 本地开发

```bash
# 克隆项目
git clone https://github.com/your-repo/hotker-prompt-studio.git

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 2. 部署 (Cloudflare Pages)

本项目专为 Cloudflare Pages 设计，零运维成本。

1. **Fork 本仓库** 到你的 GitHub。
2. 进入 **Cloudflare Dashboard** > **Pages** > **Create a project** > **Connect to Git**。
3. 选择仓库，**Build command** 填 `npm run build`，**Output directory** 填 `dist`。
4. **绑定数据库** (在 Pages 项目设置 > Functions 中配置):
   *   **KV 模式**: 绑定变量名 `NANO_DB` 到你的 KV Namespace。
   *   **D1 模式 (推荐)**: 绑定变量名 `DB` 到你的 D1 Database (支持修改密码等高级功能)。

> 详细部署步骤与数据库配置请参阅 [DEPLOY.md](./DEPLOY.md)。

## 👤 作者信息

本项目由 **hotker** 构想与开发。

*   **作者**: hotker
*   **X (Twitter)**: [@hotker_ai](https://x.com/hotker_ai)
*   **个人网站**: [https://hotker.com](https://hotker.com)

欢迎关注我的 X 账号获取更多关于 AI 提示词工程、独立开发与效率工具的分享！如果你喜欢这个项目，请给它一个 ⭐️！

---

© 2024 Hotker Prompt Studio. All rights reserved.