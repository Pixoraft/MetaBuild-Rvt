# Multi-stage build for production
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Install curl for health check
RUN apk add --no-cache curl

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built application from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/public ./public

# Create data directory for JSON storage
RUN mkdir -p data

# Expose port (Render uses PORT env var)
EXPOSE 10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT:-10000}/api/auth/user || exit 1

# Start the application
CMD ["npm", "start"]