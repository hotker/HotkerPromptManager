[English](./DEPLOY_EN.md) | [中文](./DEPLOY.md)

# Hotker Prompt Studio Deployment Guide (Cloudflare Pages)

This project is designed specifically for **Cloudflare Pages**. It supports using Cloudflare KV (Lightweight) or Cloudflare D1 (SQL Database, recommended for production) for data storage.

Please follow the steps below strictly. No local configuration file (wrangler.toml) is needed.

## 1. Prepare Database

Before development or deployment, we need to prepare the storage backend. The system automatically detects bound resources; if D1 is bound, it is used preferentially, otherwise it falls back to KV.

### Option A: KV Namespace (Lightweight/Simple)
Suitable for personal use or small amounts of data.

**Generate ID Locally (Once only):**
```bash
npm run kv:create
```
*Please note down the generated ID; you will use a similar name configuration in the Cloudflare dashboard later.*

### Option B: D1 Database (Recommended/High Performance)
Suitable for multi-user scenarios, frequent data reading/writing, and requires password modification features.

1. **Create Database**:
   ```bash
   npx wrangler d1 create hotker-db
   ```
   *Note down the `database_id` from the console output.*

2. **Initialize Table Structure (Schema)**:
   You need to create tables in the database. You can execute this via the D1 Console in the Cloudflare Dashboard, or use the following SQL statements:

   ```sql
   CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT UNIQUE, password TEXT, provider TEXT, created_at INTEGER, avatar_url TEXT);
   CREATE TABLE IF NOT EXISTS user_data (user_id TEXT PRIMARY KEY, data_json TEXT, updated_at INTEGER);
   ```

## 2. Deployment Process (Recommended: Git Integration)

This is the most standard and stable way to deploy Pages.

1. **Push Code**: Push the project to GitHub or GitLab.
2. **Create Project**: In Cloudflare Dashboard > Pages > Create a project > Connect to Git.
3. **Build Settings**:
   *   **Framework preset**: Select `Vite` (or fill in manually)
   *   **Build command**: `npm run build`
   *   **Build output directory**: `dist`
   *   **Root directory**: `/` (Default is fine)

4. **Bind Resources (Critical Step)**:
   Before or after deployment completes, go to Project Settings > **Functions**.

   **Configure KV (If used):**
   *   Find **KV Namespace Bindings**
   *   **Variable name**: `NANO_DB` (Must match exactly)
   *   **KV Namespace**: Select the KV namespace you created.

   **Configure D1 (If used):**
   *   Find **D1 Database Bindings**
   *   **Variable name**: `DB` (Must match exactly)
   *   **D1 Database**: Select the `hotker-db` you created.

   *Note: You can bind both, or just one of them.*

## 3. Configure Google Login (OAuth)

To enable Google Login functionality, you need to configure environment variables.

1. **Get Google Credentials**:
   *   Visit [Google Cloud Console](https://console.cloud.google.com/).
   *   Create a new project or select an existing one.
   *   Go to **APIs & Services** > **Credentials**.
   *   Click **Create Credentials** > **OAuth client ID**.
   *   Select Application Type as **Web application**.
   *   **Authorized redirect URIs** Add: `https://<your-domain>.pages.dev/api/auth?action=google-callback`
     *   *Note: Ensure you add both your production domain and preview domain (if testing is needed).*
   *   After creation, copy the **Client ID** and **Client Secret**.

2. **Set Environment Variables**:
   *   In Cloudflare Pages Project Settings > **Environment variables**.
   *   Add variable `GOOGLE_CLIENT_ID`: Fill in your Google Client ID.
   *   Add variable `GOOGLE_CLIENT_SECRET`: Fill in your Google Client Secret.
   *   (For security, it is recommended to click the "Encrypt" button to encrypt the Secret)

3. **Redeploy**:
   After saving environment variables, you may need to redeploy once (Retry deployment) for the variables to take effect.

## 4. FAQ

**Q: Why is there no `wrangler.toml` file?**
A: Cloudflare Pages recommends managing configurations (like environment variables and KV/D1 bindings) in the Dashboard interface, which is more secure and better for team collaboration.

**Q: Encountered "Deploy command cannot be empty" error?**
A: Please check if you are in some third-party CI/CD tool. In Cloudflare Pages' native Git integration, you only need to fill in **Build command** (`npm run build`).

**Q: Google Login reports "redirect_uri_mismatch"?**
A: Please ensure the Redirect URI configured in Google Cloud Console matches the domain in the browser address bar exactly (including the https protocol).