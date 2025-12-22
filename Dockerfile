# Multi-stage Dockerfile for Hotker Prompt Studio

# --- Builder Stage: Build React/Vite app and install dependencies ---
FROM node:22-alpine AS builder

# Install build tools required for native modules like better-sqlite3
RUN apk add --no-cache python3 make g++ sqlite-dev

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build frontend
COPY . .
RUN npm run build

# --- Runtime Stage: Lightweight production image ---
FROM node:22-alpine AS runner

ENV NODE_ENV=production
WORKDIR /app

# Runtime dependencies for SQLite
RUN apk add --no-cache sqlite-libs

# Copy only what we need to run the app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./
COPY server.js ./

# Ensure data directory exists (will be mounted via volume in docker-compose)
RUN mkdir -p /app/data

EXPOSE 3000

CMD ["node", "server.js"]