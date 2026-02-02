# Client Dockerfile - Multi-stage build
# Note: This Dockerfile is run from the repo root with npm workspaces

FROM node:20-alpine AS builder

WORKDIR /app

# Set API URL for Vite at build time
ENV VITE_API_URL=https://server-production-353d.up.railway.app

# Copy workspace root files
COPY package*.json ./

# Copy client package files for workspace install
COPY client/package*.json ./client/

# Install dependencies (workspace-aware)
RUN npm ci --workspace=client --include-workspace-root

# Copy client source code only
COPY client/ ./client/

# Build the client application
WORKDIR /app/client
RUN npm run build

# Production stage with nginx
FROM nginx:alpine

# Copy custom nginx config from client directory
COPY client/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from builder (client/dist)
COPY --from=builder /app/client/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:80 || exit 1

CMD ["nginx", "-g", "daemon off;"]
