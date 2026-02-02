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

# Install and use serve
RUN npm install -g serve

# Railway will use PORT env var, default to 8080
ENV PORT=8080
EXPOSE 8080

# Start
CMD ["sh", "-c", "serve -s dist -l $PORT"]
