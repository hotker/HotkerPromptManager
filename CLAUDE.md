# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hotker Prompt Studio is an enterprise-grade modular prompt engineering system for Google Gemini AI models. Users create reusable prompt modules (roles, tasks, constraints, formats) and assemble them visually to create complete prompts.

## Development Commands

```bash
# Frontend development (Vite dev server)
npm run dev

# Full local development with Cloudflare KV binding
npm run dev:full

# Build (runs TypeScript check then Vite build)
npm run build

# Preview production build
npm run preview

# Docker mode - start Express server
npm start
```

## Architecture

### Dual Backend Architecture

The project supports two deployment modes with separate backends:

1. **Cloudflare Serverless** (`/functions/api/`) - Pages Functions with KV/D1 storage
2. **Docker/Self-hosted** (`server.js`) - Express with SQLite via better-sqlite3

### Key Directories

- `/components/` - React components, some with co-located `types.ts` and `reducer.ts`
- `/hooks/` - Custom hooks: `useDebounce`, `useMediaQuery`, `useUndoRedo`, `useKeyboardShortcuts`
- `/services/` - Business logic: API client, auth, Gemini integration, offline storage
- `/functions/api/` - Cloudflare Pages Functions (serverless backend)
- `/data/` - SQLite database storage (Docker mode only)

### State Management

- `useState` for simple component state
- `useReducer` for complex state (see `LibraryView/reducer.ts`)
- No external state library - state lifted to `App.tsx`

### Data Sync Pattern

- Debounced auto-save (600ms)
- Optimistic UI updates
- Offline-first with IndexedDB fallback (`offlineStorageService.ts`)
- XOR encryption for data transmission

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend (Docker)**: Node.js, Express, Better-SQLite3
- **Backend (Serverless)**: Cloudflare Pages Functions, KV/D1
- **AI**: Google Gemini SDK (`@google/genai`)

## Path Alias

`@/*` maps to project root (configured in `tsconfig.json`)

## Environment Variables

Required variables (see `.env.example`):
- `API_KEY` - Gemini API key
- `PORT` - Server port (Docker mode, default 3000)
- `DB_PATH` - SQLite path (Docker mode)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth (optional)

## Notes

- No test framework configured yet
- No ESLint/Prettier configured - relies on TypeScript compiler
- Bilingual support (Chinese/English) via `translations.ts`
- Mobile-responsive with custom breakpoint hooks
