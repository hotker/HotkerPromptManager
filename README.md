
[English](./README_EN.md) | [中文](./README.md)

# Hotker Prompt Studio 🚀

**商业级模块化提示词工程系统 (Enterprise Modular Prompt Engineering System)**

Hotker Prompt Studio 是一个专为提示词工程师设计的现代化工作台。它采用"积木式"理念，帮助你将复杂的 Prompt 拆解为可复用的模块（角色、任务、背景、约束等），并通过可视化的方式进行组装、测试和迭代。

专为 **Google Gemini** 模型优化，完美适配 Cloudflare Serverless 架构，支持高并发生产环境。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)

---

## ✨ 核心特性

### 📝 基础功能

*   **🧩 模块化管理**: 将 Prompt 拆解为独立的"积木" (Modules)，建立你的专属素材库，拒绝重复造轮子。
*   **🛠️ 可视化构建**: 像搭积木一样组装 Prompt，支持拖拽排序、实时预览和固定参数配置。
*   **⚡ 极速调试**: 深度集成 **Google Gemini 2.5 Flash / 3.0 Pro** 模型，支持文本生成与图像生成测试。
*   **📱 全端适配**: 响应式设计，完美支持 iPhone 及移动端，随时随地捕捉灵感。
*   **📊 数据驱动**: 自动记录运行历史、延迟和成功率，支持评分与复盘，让 Prompt 优化有据可依。

### 🆕 高级功能

*   **📜 版本控制**: 
    - 自动记录每次编辑的历史版本
    - 支持版本标记（v1.0, v2.0等）
    - 一键恢复到任意历史版本
    - 修改说明和时间戳追踪

*   **🤝 协作分享**:
    - 生成分享链接和12位短码
    - 可选密码保护
    - 灵活的过期时间设置（1/7/30天或永不过期）
    - 二维码分享支持
    - 访问和导入统计

*   **📋 我的分享管理**:
    - 集中查看和管理所有分享
    - 实时统计访问次数和导入次数
    - 一键删除过期或不需要的分享
    - 分享状态可视化（活跃/已过期）

*   **🔔 Toast 通知系统**:
    - 优雅的操作反馈通知
    - 支持成功、错误、警告、信息等多种类型
    - 自动消失，不打断用户操作
    - 替代传统 alert 弹窗，提升用户体验

*   **📴 离线数据存储**:
    - 基于 IndexedDB 的本地离线存储
    - 防止网络同步错误导致数据丢失
    - 自动保存用户数据到本地
    - 同步状态可视化追踪
    - 支持离线模式下继续使用

*   **⌨️ 快捷键支持**:
    - `⌘/Ctrl + S`: 保存
    - `⌘/Ctrl + K`: 搜索
    - `⌘/Ctrl + N`: 新建
    - `⌘/Ctrl + 1-4`: 切换视图
    - `Esc`: 关闭模态框

*   **🤖 AI 智能优化**:
    - 提示词质量分析（清晰性、具体性、结构化、完整性）
    - AI 驱动的自动优化建议
    - 原始vs优化版本对比
    - 一键应用优化
    - 基于 Gemini 2.0 Flash Exp

### 🔧 技术特性

*   **☁️ Cloudflare 原生**: 基于 Cloudflare Pages 构建，支持 **KV** (轻量) 和 **D1** (SQL) 两种数据库模式。
*   **🐳 Docker 私有化**: 支持一键 Docker 部署，配合 SQLite 本地存储，数据完全掌握在自己手中。
*   **🌍 双语支持**: 内置中英文界面切换 (i18n)。
*   **🔐 Google OAuth**: 安全的用户认证系统。

---

## 🎯 使用场景

### 个人开发者
- 管理和复用你的提示词模块
- 测试和优化 Prompt 效果
- 版本控制跟踪提示词演进

### 团队协作
- 分享优质提示词给团队成员
- 统一团队的提示词规范
- 协作优化提示词质量

### 内容创作者
- 快速组装不同场景的提示词
- AI 辅助优化创作提示词
- 追踪和复用成功的提示词模式

---

## 🛠️ 技术栈

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
*   **Backend (Docker)**: Node.js, Express, Better-SQLite3
*   **Backend (Serverless)**: Cloudflare Pages Functions
*   **UI Components**: Lucide React, Recharts
*   **AI SDK**: Google GenAI SDK (Gemini 2.0 Flash Exp, Gemini 2.5 Flash, Gemini 3.0 Pro)

---

## 🚀 快速开始

### 前置要求

1. **Gemini API Key** - 从 [Google AI Studio](https://ai.google.dev/) 获取
2. (可选) **Google OAuth** - 用于用户认证和高级功能
3. **Docker** (Docker 部署) 或 **Cloudflare 账号** (Serverless 部署)

### Docker 部署（推荐）

```bash
# 1. 克隆仓库
git clone https://github.com/hotker/HotkerPromptManager.git
cd HotkerPromptManager

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入你的配置

# 3. 启动容器
docker-compose up -d

# 4. 访问应用
open http://localhost:3000
```

详细配置请查看 [Docker 部署文档](./README_DOCKER.md)

### Cloudflare Pages 部署

适合无服务器、零成本、公网访问的场景。

详细步骤请查看 [Cloudflare 部署文档](./DEPLOY.md)

---

## 📚 功能文档

### 版本控制

**功能**：
- 自动保存编辑历史
- 版本标记（语义化版本号）
- 版本对比和恢复
- 修改说明记录

**使用**：
1. 编辑模块时，填写"修改说明"（可选）
2. 保存后自动创建新版本
3. 点击模块卡片的"版本历史"按钮
4. 查看历史版本，可恢复到任意版本

### 协作分享

**功能**：
- 创建分享链接
- 设置访问密码（可选）
- 设置过期时间
- 生成二维码
- 统计访问和导入次数

**使用**：
1. 点击模块卡片的"分享"按钮
2. 设置密码和有效期（可选）
3. 点击"创建分享"
4. 复制链接或分享码给他人
5. 他人点击"导入"按钮输入分享码即可导入

### AI 智能优化

**功能**：
- 提示词质量分析（4维度评分）
- 自动识别问题和改进建议
- AI 优化提示词
- 原始vs优化对比

**使用**：
1. 在"提示词工程"中组装提示词
2. 点击"分析质量"查看评分和建议
3. 点击"智能优化"获取优化版本
4. 对比后点击"接受并应用"

**注意**：需要配置有效的 Gemini API Key

---

## 🎨 界面预览

### 提示词库
- 卡片式展示所有提示词模块
- 支持搜索、筛选、分类
- 沉浸式浏览模式
- 版本历史和分享功能

### 提示词工程
- 左侧：模块素材库
- 中间：可视化组装工作流
- 右侧：调试运行器和AI优化

### 测试日志
- 运行历史记录
- 成功率统计
- 性能分析图表

---

## 📊 项目统计

- **代码行数**: ~3000+ 行
- **组件数量**: 13+ 个
- **API 端点**: 25+ 个
- **支持语言**: 中文 + 英文
- **完成度**: 92%

---

## 🔒 环境变量

```bash
# Gemini API
API_KEY=your_gemini_api_key_here

# Google OAuth (可选，用于用户认证)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# 应用配置
PORT=3000
PUBLIC_URL=http://localhost:3000

# 数据库
DB_PATH=./data/hotker.db
```

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

```bash
# 1. Fork 项目
# 2. 创建特性分支
git checkout -b feature/amazing-feature

# 3. 提交更改
git commit -m 'Add amazing feature'

# 4. 推送到分支
git push origin feature/amazing-feature

# 5. 创建 Pull Request
```

---

## 📝 更新日志

### v2.2.0 (2026-01-02)
- ✨ 新增：离线数据存储功能（基于 IndexedDB）
- ✨ 新增：全局快捷键支持（保存、搜索、新建、视图切换）
- ✨ 新增：同步状态可视化
- 🛡️ 优化：数据安全性增强，防止同步错误导致数据丢失
- 🎨 优化：用户体验细节改进

### v2.1.0 (2025-12-30)
- ✨ 新增：Toast 通知系统，替代传统 alert 弹窗
- ✨ 新增：我的分享管理页面，集中管理所有分享
- 🎨 优化：用户体验改进和界面美化
- 🐛 修复：分享导入功能数据持久化问题

### v2.0.0 (2025-12-29)
- ✨ 新增：AI 智能优化助手
- ✨ 新增：协作分享功能
- ✨ 新增：版本控制系统
- 🎨 优化：UI/UX 改进
- 📚 文档：完善 README 和使用文档

### v1.0.0 (2024)
- 🎉 初始版本发布
- ✨ 模块化提示词管理
- ✨ 可视化构建器
- ✨ Gemini API 集成

---

## 📞 支持与反馈

如果你遇到问题或有建议，欢迎通过以下方式联系：

- **GitHub Issues**: [提交 Issue](https://github.com/hotker/HotkerPromptManager/issues)
- **X (Twitter)**: [@hotker_ai](https://x.com/hotker_ai)
- **Email**: hotker@gmail.com

---

## 👤 作者信息

本项目由 **hotker** 构想与开发。

*   **作者**: hotker
*   **X (Twitter)**: [@hotker_ai](https://x.com/hotker_ai)
*   **GitHub**: [https://github.com/hotker/HotkerPromptManager](https://github.com/hotker/HotkerPromptManager)
*   **个人网站**: [https://hotker.com](https://hotker.com)
*   **邮箱**: hotker@gmail.com

欢迎关注我的 X 账号获取更多关于 AI 提示词工程、独立开发与效率工具的分享！

如果你喜欢这个项目，请给它一个 ⭐️！

---

## 📄 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

---

## 🙏 致谢

- [Google Gemini](https://ai.google.dev/) - 强大的 AI 模型
- [React](https://react.dev/) - UI 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Lucide](https://lucide.dev/) - 图标库
- [Cloudflare](https://www.cloudflare.com/) - Serverless 平台

---

© 2026 Hotker Prompt Studio. All rights reserved.
