
[English](./README_EN.md) | [中文](./README.md)

# Hotker Prompt Studio 🚀

**Enterprise Modular Prompt Engineering System**

Hotker Prompt Studio is a modern workbench designed specifically for prompt engineers. Adopting a "building block" philosophy, it helps you break down complex prompts into reusable modules (Roles, Tasks, Context, Constraints, etc.) and assemble, test, and iterate on them visually.

Optimized for **Google Gemini** models and perfectly adapted to Cloudflare Serverless architecture, supporting high-concurrency production environments.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-61dafb.svg)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Pages-orange.svg)
![Docker](https://img.shields.io/badge/Docker-Supported-blue.svg)

---

## ✨ Core Features

### 📝 Basic Features

*   **🧩 Modular Management**: Break down prompts into independent "bricks" (Modules) to build your own exclusive material library and stop reinventing the wheel.
*   **🛠️ Visual Building**: Assemble prompts like building blocks, supporting drag-and-drop sorting, real-time preview, and fixed parameter configuration.
*   **⚡ Rapid Debugging**: Deep integration with **Google Gemini 2.5 Flash / 3.0 Pro** models, supporting text generation and image generation testing.
*   **📱 Fully Responsive**: Responsive design perfectly supports iPhone and mobile devices, capturing inspiration anytime, anywhere.
*   **📊 Data-Driven**: Automatically records run history, latency, and success rates, supporting rating and review to base prompt optimization on data.

### 🆕 Advanced Features

*   **📜 Version Control**: 
    - Automatically track every edit's history
    - Support version tagging (v1.0, v2.0, etc.)
    - One-click restore to any historical version
    - Change description and timestamp tracking

*   **🤝 Collaboration & Sharing**:
    - Generate share links and 12-digit short codes
    - Optional password protection
    - Flexible expiration settings (1/7/30 days or never)
    - QR code sharing support
    - Access and import statistics

*   **📋 My Shares Management**:
    - Centralized view and management of all shares
    - Real-time access and import count statistics
    - One-click delete expired or unwanted shares
    - Visual share status (active/expired)

*   **🔔 Toast Notification System**:
    - Elegant operation feedback notifications
    - Supports success, error, warning, info types
    - Auto-dismiss without interrupting user flow
    - Replaces traditional alert popups for better UX

*   **🤖 AI-Powered Optimization**:
    - Prompt quality analysis (Clarity, Specificity, Structure, Completeness)
    - AI-driven automatic optimization suggestions
    - Original vs. optimized version comparison
    - One-click apply optimization
    - Powered by Gemini 2.0 Flash Exp

### 🔧 Technical Features

*   **☁️ Cloudflare Native**: Built on Cloudflare Pages, supporting both **KV** (Lightweight) and **D1** (SQL) database modes.
*   **🐳 Docker Privatization**: Support one-click Docker deployment with SQLite local storage, keeping data completely under your control.
*   **🌍 Bilingual Support**: Built-in Chinese/English interface switching (i18n).
*   **🔐 Google OAuth**: Secure user authentication system.

---

## 🎯 Use Cases

### Individual Developers
- Manage and reuse your prompt modules
- Test and optimize prompt effectiveness
- Version control to track prompt evolution

### Team Collaboration
- Share quality prompts with team members
- Unify team prompt standards
- Collaborate on optimizing prompt quality

### Content Creators
- Quickly assemble prompts for different scenarios
- AI-assisted optimization for creative prompts
- Track and reuse successful prompt patterns

---

## 🛠️ Tech Stack

*   **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
*   **Backend (Docker)**: Node.js, Express, Better-SQLite3
*   **Backend (Serverless)**: Cloudflare Pages Functions
*   **UI Components**: Lucide React, Recharts
*   **AI SDK**: Google GenAI SDK (Gemini 2.0 Flash Exp, Gemini 2.5 Flash, Gemini 3.0 Pro)

---

## 🚀 Quick Start

### Prerequisites

1. **Gemini API Key** - Get from [Google AI Studio](https://ai.google.dev/)
2. (Optional) **Google OAuth** - For user authentication and advanced features
3. **Docker** (for Docker deployment) or **Cloudflare Account** (for Serverless deployment)

### Docker Deployment (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/hotker/HotkerPromptManager.git
cd HotkerPromptManager

# 2. Configure environment variables
cp .env.example .env
# Edit .env file and fill in your configuration

# 3. Start containers
docker-compose up -d

# 4. Access application
open http://localhost:3000
```

For detailed configuration, see [Docker Deployment Documentation](./README_DOCKER.md)

### Cloudflare Pages Deployment

Suitable for serverless, zero-cost, public internet access scenarios.

For detailed steps, see [Cloudflare Deployment Documentation](./DEPLOY.md)

---

## 📚 Feature Documentation

### Version Control

**Features**:
- Automatically save edit history
- Version tagging (semantic versioning)
- Version comparison and restoration
- Change description recording

**Usage**:
1. When editing modules, fill in "Change Description" (optional)
2. Automatically create new version after saving
3. Click "Version History" button on module card
4. View historical versions, restore to any version

### Collaboration & Sharing

**Features**:
- Create share links
- Set access password (optional)
- Set expiration time
- Generate QR codes
- Track access and import counts

**Usage**:
1. Click "Share" button on module card
2. Set password and expiration (optional)
3. Click "Create Share"
4. Copy link or share code to others
5. Others click "Import" button and enter share code to import

### AI-Powered Optimization

**Features**:
- Prompt quality analysis (4-dimension scoring)
- Automatically identify issues and improvement suggestions
- AI-optimized prompts
- Original vs. optimized comparison

**Usage**:
1. Assemble prompts in "Prompt Engineering"
2. Click "Analyze Quality" to view scores and suggestions
3. Click "Smart Optimize" to get optimized version
4. After comparison, click "Accept & Apply"

**Note**: Requires a valid Gemini API Key

---

## 🎨 Interface Preview

### Prompt Library
- Card-style display of all prompt modules
- Support search, filter, categorization
- Immersive browsing mode
- Version history and sharing features

### Prompt Engineering
- Left: Module material library
- Center: Visual assembly workflow
- Right: Debug runner and AI optimization

### Test Logs
- Run history records
- Success rate statistics
- Performance analysis charts

---

## 📊 Project Statistics

- **Lines of Code**: ~3000+ lines
- **Components**: 13+ components
- **API Endpoints**: 25+ endpoints
- **Supported Languages**: Chinese + English
- **Completion**: 92%

---

## 🔒 Environment Variables

```bash
# Gemini API
API_KEY=your_gemini_api_key_here

# Google OAuth (optional, for user authentication)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application Configuration
PORT=3000
PUBLIC_URL=http://localhost:3000

# Database
DB_PATH=./data/hotker.db
```

---

## 🤝 Contributing

Issues and Pull Requests are welcome!

### Development Workflow

```bash
# 1. Fork the project
# 2. Create feature branch
git checkout -b feature/amazing-feature

# 3. Commit changes
git commit -m 'Add amazing feature'

# 4. Push to branch
git push origin feature/amazing-feature

# 5. Create Pull Request
```

---

## 📝 Changelog

### v2.1.0 (2025-12-30)
- ✨ New: Toast notification system, replacing traditional alert popups
- ✨ New: My Shares management page for centralized share management
- 🎨 Improved: User experience enhancements and UI polish
- 🐛 Fixed: Share import data persistence issue

### v2.0.0 (2025-12-29)
- ✨ New: AI-powered optimization assistant
- ✨ New: Collaboration & sharing features
- ✨ New: Version control system
- 🎨 Improved: UI/UX enhancements
- 📚 Docs: Enhanced README and user documentation

### v1.0.0 (2024)
- 🎉 Initial release
- ✨ Modular prompt management
- ✨ Visual builder
- ✨ Gemini API integration

---

## 📞 Support & Feedback

If you encounter issues or have suggestions, feel free to contact us:

- **GitHub Issues**: [Submit Issue](https://github.com/hotker/HotkerPromptManager/issues)
- **X (Twitter)**: [@hotker_ai](https://x.com/hotker_ai)
- **Email**: hotker@gmail.com

---

## 👤 Author Info

This project was conceived and developed by **hotker**.

*   **Author**: hotker
*   **X (Twitter)**: [@hotker_ai](https://x.com/hotker_ai)
*   **GitHub**: [https://github.com/hotker/HotkerPromptManager](https://github.com/hotker/HotkerPromptManager)
*   **Website**: [https://hotker.com](https://hotker.com)
*   **Email**: hotker@gmail.com

Follow my X account for more shares on AI prompt engineering, indie development, and productivity tools!

If you like this project, please give it a ⭐️!

---

## 📄 License

MIT License - See [LICENSE](./LICENSE) file for details

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) - Powerful AI models
- [React](https://react.dev/) - UI framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [Lucide](https://lucide.dev/) - Icon library
- [Cloudflare](https://www.cloudflare.com/) - Serverless platform

---

© 2025 Hotker Prompt Studio. All rights reserved.