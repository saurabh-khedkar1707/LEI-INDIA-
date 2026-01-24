# Multi-stage Dockerfile for LEI Indias Production Deployment
# Builds both frontend and backend in optimized production images

# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy package files
COPY frontend/package.json frontend/pnpm-lock.yaml* ./
COPY package.json pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy frontend source
COPY frontend/ ./frontend/
COPY shared/ ./shared/

# Build frontend
WORKDIR /app/frontend
RUN pnpm build:prod

# Stage 2: Build backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Copy package files
COPY backend/package.json backend/tsconfig.json ./
COPY package.json pnpm-workspace.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy backend source
COPY backend/src/ ./src/
COPY shared/ ./shared/

# Build backend
RUN pnpm build:prod

# Stage 3: Production runtime
FROM node:20-alpine AS production

# Install pnpm
RUN npm install -g pnpm@9.0.0

# Create app user (security best practice)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy package files for production dependencies
COPY package.json pnpm-workspace.yaml ./
COPY frontend/package.json ./frontend/
COPY backend/package.json ./backend/

# Install production dependencies only
RUN pnpm install --prod --frozen-lockfile

# Copy built applications from builders
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package.json ./frontend/
COPY --from=frontend-builder /app/frontend/next.config.mjs ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules

COPY --from=backend-builder /app/dist ./backend/dist
COPY --from=backend-builder /app/package.json ./backend/
COPY --from=backend-builder /app/node_modules ./backend/node_modules

# Copy shared types
COPY shared/ ./shared/

# Create directories for uploads and logs
RUN mkdir -p /app/backend/uploads /app/logs && \
    chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Default command (can be overridden)
# For PM2: CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
# For direct: CMD ["node", "backend/dist/server.js"] & ["node_modules/next/dist/bin/next", "start"]
CMD ["node", "backend/dist/server.js"]
