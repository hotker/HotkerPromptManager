
# Hotker Prompt Studio - Docker Deployment Guide

This version includes a standalone Node.js server + SQLite database, allowing you to run the application anywhere without Cloudflare.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

1. **Build and Run**:
   ```bash
   docker-compose up -d --build
   ```

2. **Access**:
   Open your browser and navigate to `http://localhost:3000`.

## Configuration

You can configure the following environment variables in `docker-compose.yml` or a `.env` file:

- `API_KEY`: Your default Google Gemini API Key.
- `PORT`: The port the server listens on inside the container (default: 3000).

## Data Persistence

All user data and accounts are stored in a SQLite database located at `./data/hotker.db` on your host machine. This is mapped via the volume configuration in `docker-compose.yml`.

To backup your data, simply backup the `data` folder.

## Architecture

- **Frontend**: React/Vite (Served statically by Express)
- **Backend**: Express.js
- **Database**: SQLite (via `better-sqlite3`)
- **API Compatability**: The server implements the exact same API endpoints (`/api/auth`, `/api/data`) as the Cloudflare Functions version, so the frontend code remains identical.
