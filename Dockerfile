# ==============================================================================
# KrishiDrive v2.1.0 — Production Multi-Stage Dockerfile
# Stage 1: Build the Vite React Frontend
# Stage 2: Production Node.js Runtime with SQLite + ONNX Runtime
# ==============================================================================

# ── Stage 1: Frontend Builder ─────────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Production Backend & Full Stack Runner ───────────────────────────
FROM node:20-bullseye-slim AS runner

# Install dependencies required for better-sqlite3 and onnxruntime-node
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8000

# Copy backend manifests and install dependencies
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copy backend source code & models
COPY backend/ ./

# Copy built frontend assets from builder stage
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Create persistent storage directories
RUN mkdir -p /app/backend/data /app/backend/uploads && \
    chmod 755 /app/backend/data /app/backend/uploads

# Expose backend port
EXPOSE 8000

# Define volume for persistent SQLite DB and user uploads
VOLUME ["/app/backend/data", "/app/backend/uploads"]

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start server
CMD ["node", "server.js"]

