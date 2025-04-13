
# TypeScript MCP Server Dockerfile - Optimized for production use
FROM node:18-slim AS builder

# Set working directory for build stage
WORKDIR /build

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build if TypeScript
RUN npm run build || echo "No build script found"

# Production image
FROM node:18-slim

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy built application from builder stage
COPY --from=builder /build/dist /app/dist
COPY --from=builder /build/server.js /app/server.js

# Set environment to production
ENV NODE_ENV=production

# Expose port if needed for HTTP adapter
# EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); const req = http.request('http://localhost:3000/health', { method: 'GET' }, (res) => { process.exit(res.statusCode !== 200 ? 1 : 0); }); req.on('error', () => process.exit(1)); req.end();" || exit 1

# Start the server
CMD ["node", "server.js"]
