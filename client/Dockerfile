# Minimal Client Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files from client only
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source
COPY . .

# Set production API URL
ENV VITE_API_URL=https://server-production-353d.up.railway.app

# Build
RUN npm run build

# Install http-server for serving static files
RUN npm install -g http-server

# Expose port 8080
EXPOSE 8080

# Start http-server
CMD ["http-server", "dist", "-p", "8080", "--proxy", "http://localhost:8080?"]
