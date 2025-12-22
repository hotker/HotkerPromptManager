
# 🐳 Hotker Prompt Studio - Docker 私有化部署指南

本文档介绍如何使用 Docker 和 Docker Compose 将 **Hotker Prompt Studio** 部署到您的私有服务器、NAS (群晖/威联通) 或个人电脑上。

此版本移除了对 Cloudflare 的依赖，使用轻量级 Node.js 服务器和 SQLite 数据库，确保您的**提示词数据完全私有化**。

---

## 1. 核心特性 (Docker 版)

*   **🔒 数据私有**: 所有数据存储在本地 SQLite 数据库文件 (`.db`) 中，不上传云端。
*   **⚡ 轻量高效**: 基于 Alpine Linux 构建，镜像体积小，内存占用低。
*   **🚀 一键启动**: 提供标准 `docker-compose.yml`，毫秒级启动。
*   **🔄 API 兼容**: 完美复刻原版 Cloudflare API，前端体验完全一致。

---

## 2. 环境准备

在开始之前，请确保您的机器已安装：

*   **Docker Engine**: [安装指南](https://docs.docker.com/engine/install/)
*   **Docker Compose**: [安装指南](https://docs.docker.com/compose/install/)

---

## 3. 快速部署 (Quick Start)

### 第一步：获取代码

如果您有 Git 环境：
```bash
git clone https://github.com/hotker/hotker-prompt-studio.git
cd hotker-prompt-studio
```

或者直接下载项目 ZIP 包并解压。

### 第二步：启动服务

在项目根目录下（包含 `docker-compose.yml` 的目录）运行：

```bash
docker-compose up -d --build
```

等待构建完成（第一次可能需要几分钟），当看到 `Started` 字样后，服务即启动成功。

### 第三步：访问应用

打开浏览器访问：

> **http://localhost:3000**

(如果您部署在服务器上，请将 `localhost` 替换为服务器 IP)

---

## 4. 配置说明 (环境变量)

您可以通过修改 `docker-compose.yml` 中的 `environment` 部分来配置系统。

| 变量名 | 必填 | 说明 | 示例 |
| :--- | :---: | :--- | :--- |
| `API_KEY` | 否 | **系统级 Gemini API Key**。<br>如果设置，用户即使不填 Key 也能使用系统默认 Key。<br>建议留空，让用户在前端自行填写。 | `AIzaSy...` |
| `NODE_ENV` | 是 | 运行环境，保持默认即可。 | `production` |
| `GOOGLE_CLIENT_ID` | 否 | (可选) Google OAuth 登录 ID。 | `xyz.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | 否 | (可选) Google OAuth 密钥。 | `GOCSPX-...` |
| `PORT` | 否 | 容器内部端口 (默认 3000)。 | `3000` |

### 示例：修改端口

如果您想将应用运行在 `8080` 端口，请修改 `docker-compose.yml` 的 `ports` 映射：

```yaml
ports:
  - "8080:3000"  # 宿主机端口:容器端口
```

---

## 5. 数据管理与备份

Docker 版本使用 **SQLite** 存储所有数据。

### 数据位置
根据 `docker-compose.yml` 的配置，数据挂载在项目根目录的 `data` 文件夹下：

*   **宿主机路径**: `./data/hotker.db`
*   **容器内路径**: `/app/data/hotker.db`

### 备份方法 (推荐)
只需复制/压缩 `data` 文件夹即可完成全量备份。

```bash
# 备份示例
cp -r data data_backup_$(date +%Y%m%d)
```

### 恢复方法
1. 停止容器：`docker-compose down`
2. 将备份的 `hotker.db` 覆盖回 `data` 目录。
3. 启动容器：`docker-compose up -d`

---

## 6. 常见问题 (FAQ)

**Q: 为什么我修改了代码（如 React 组件）后刷新页面没变化？**
A: Docker 镜像是在构建时生成的。如果您修改了源码，需要重新构建镜像：
```bash
docker-compose up -d --build
```

**Q: 如何查看服务器日志？**
A: 使用以下命令查看运行日志（用于排查 API 错误）：
```bash
docker-compose logs -f
```

**Q: 支持 HTTPS 吗？**
A: 容器本身只提供 HTTP 服务。建议在宿主机使用 **Nginx** 或 **Caddy** 进行反向代理并配置 SSL 证书。

**Nginx 配置示例**:
```nginx
server {
    listen 80;
    server_name prompt.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 7. 更新升级

当项目发布新版本时，执行以下步骤更新：

```bash
# 1. 拉取最新代码
git pull

# 2. 重新构建并重启 (数据不会丢失)
docker-compose up -d --build
```
