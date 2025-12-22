
[English](./README_EN.md) | [中文](./README.md)

# Hotker Prompt Studio 🚀

**商业级模块化提示词工程系统 (Enterprise Modular Prompt Engineering System)**

Hotker Prompt Studio 是一个专为提示词工程师设计的现代化工作台。它采用“积木式”理念，帮助你将复杂的 Prompt 拆解为可复用的模块（角色、任务、背景、约束等），并通过可视化的方式进行组装、测试和迭代。

专为 **Google Gemini** 模型优化，完美适配 Cloudflare Serverless 架构，支持高并发生产环境。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)

---

## ✨ 核心特性

*   **🧩 模块化管理**: 将 Prompt 拆解为独立的“积木” (Modules)，建立你的专属素材库，拒绝重复造轮子。
*   **🛠️ 可视化构建**: 像搭积木一样组装 Prompt，支持拖拽排序、实时预览和固定参数配置。
*   **⚡ 极速调试**: 深度集成 **Google Gemini 2.5 Flash / 3.0 Pro** 模型，支持文本生成与图像生成测试。
*   **📱 全端适配**: 响应式设计，完美支持 iPhone 及移动端，随时随地捕捉灵感。
*   **📊 数据驱动**: 自动记录运行历史、延迟和成功率，支持评分与复盘，让 Prompt 优化有据可依。
*   **☁️ Cloudflare 原生**: 基于 Cloudflare Pages 构建，支持 **KV** (轻量) 和 **D1** (SQL) 两种数据库模式。
*   **🐳 Docker 私有化**: 支持一键 Docker 部署，配合 SQLite 本地存储，数据完全掌握在自己手中。
*   **🌍 双语支持**: 内置中英文界面切换 (i18n)。

## 🛠️ 技术栈

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
*   **Backend (Docker)**: Node.js, Express, Better-SQLite3
*   **Backend (Serverless)**: Cloudflare Pages Functions
*   **UI Components**: Lucide React, Recharts
*   **AI SDK**: Google GenAI SDK (Gemini)

## 🚀 部署指南

本项目支持两种部署模式，请根据您的需求选择：

### 🅰️ 模式一：Cloudflare Pages (Serverless)
**适合**：无需服务器、零成本、公网访问、Git 自动部署。
> 📄 [查看 Cloudflare 部署文档](./DEPLOY.md)

### 🅱️ 模式二：Docker (私有化部署)
**适合**：部署在 NAS、VPS、内网环境，数据存储在本地 SQLite 文件中。
> 🐳 [查看 Docker 部署文档](./README_DOCKER.md)

---

## 👤 作者信息

本项目由 **hotker** 构想与开发。

*   **作者**: hotker
*   **X (Twitter)**: [@hotker_ai](https://x.com/hotker_ai)
*   **GitHub**: [https://github.com/hotker/HotkerPromptManager](https://github.com/hotker/HotkerPromptManager)
*   **个人网站**: [https://hotker.com](https://hotker.com)
*   **邮箱**: hotker@gmail.com

欢迎关注我的 X 账号获取更多关于 AI 提示词工程、独立开发与效率工具的分享！如果你喜欢这个项目，请给它一个 ⭐️！

---

© 2025 Hotker Prompt Studio. All rights reserved.
