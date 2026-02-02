# Client Dockerfile - Single stage for Railway
# Build timestamp: 2026-02-02-19:30
FROM node:20-alpine

WORKDIR /app

# Copy workspace root files
COPY package*.json ./

# Copy client package files
COPY client/package*.json ./client/

# Install all dependencies (workspace-aware)
RUN npm ci

# Copy all source code
COPY . .

# Build the client
WORKDIR /app/client
RUN npm run build

# Install serve for hosting
RUN npm install -g serve

# Expose port
EXPOSE 8080

# Start with serve
CMD ["serve", "-s", "dist", "-l", "8080"]
