[English](./README_EN.md) | [中文](./README.md)

# Hotker Prompt Studio 🚀

**Enterprise Modular Prompt Engineering System**

Hotker Prompt Studio is a modern workbench designed specifically for prompt engineers. Adopting a "building block" philosophy, it helps you break down complex prompts into reusable modules (Roles, Tasks, Context, Constraints, etc.) and assemble, test, and iterate on them visually.

Optimized for **Google Gemini** models and perfectly adapted to Cloudflare Serverless architecture, supporting high-concurrency production environments.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)

---

## ✨ Core Features

*   **🧩 Modular Management**: Break down prompts into independent "bricks" (Modules) to build your own exclusive material library and stop reinventing the wheel.
*   **🛠️ Visual Building**: Assemble prompts like building blocks, supporting drag-and-drop sorting, real-time preview, and fixed parameter configuration.
*   **⚡ Rapid Debugging**: Deep integration with **Google Gemini 2.5 Flash / 3.0 Pro** models, supporting text generation and image generation testing.
*   **📱 Fully Responsive**: Responsive design perfectly supports iPhone and mobile devices, capturing inspiration anytime, anywhere.
*   **📊 Data-Driven**: Automatically records run history, latency, and success rates, supporting rating and review to base prompt optimization on data.
*   **☁️ Cloudflare Native**: Built on Cloudflare Pages, supporting both **KV** (Lightweight) and **D1** (SQL) database modes, seamlessly switching from personal development to enterprise applications.
*   **🌍 Bilingual Support**: Built-in Chinese/English interface switching (i18n).

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
*   **UI Components**: Lucide React, Recharts
*   **AI SDK**: Google GenAI SDK (Gemini)
*   **Infrastructure**: Cloudflare Pages (Functions + KV/D1 Databases)

## 🚀 Quick Start

### 1. Local Development

```bash
# Clone the repository
git clone https://github.com/your-repo/hotker-prompt-studio.git

# Install dependencies
npm install

# Start development server
npm run dev
```

### 2. Deployment (Cloudflare Pages)

This project is designed for Cloudflare Pages with zero operations cost.

1. **Fork this repository** to your GitHub.
2. Go to **Cloudflare Dashboard** > **Pages** > **Create a project** > **Connect to Git**.
3. Select repository, set **Build command** to `npm run build`, and **Output directory** to `dist`.
4. **Bind Database** (Configure in Pages Project Settings > Functions):
   *   **KV Mode**: Bind variable name `NANO_DB` to your KV Namespace.
   *   **D1 Mode (Recommended)**: Bind variable name `DB` to your D1 Database (supports advanced features like password changes).

> For detailed deployment steps and database configuration, please refer to [DEPLOY_EN.md](./DEPLOY_EN.md).

## 👤 Author Info

This project was conceived and developed by **hotker**.

*   **Author**: hotker
*   **X (Twitter)**: [@hotker_ai](https://x.com/hotker_ai)
*   **GitHub**: [https://github.com/hotker/HotkerPromptManager](https://github.com/hotker/HotkerPromptManager)
*   **Website**: [https://hotker.com](https://hotker.com)
*   **Email**: hotker@gmail.com

Follow my X account for more shares on AI prompt engineering, indie development, and productivity tools! If you like this project, please give it a ⭐️!

---

© 2025 Hotker Prompt Studio. All rights reserved.