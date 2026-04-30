# Frontend Dockerfile - Multi-stage build for optimal image size
# Stage 1: Builder
FROM node:18-alpine AS builder

WORKDIR /app

# Accept build-time environment variables
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY

# Skip Puppeteer's Chromium download — not needed at build time.
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the frontend (environment variables are baked into the bundle)
RUN npm run build

# Stage 2: Runtime (minimal image)
FROM node:18-alpine

WORKDIR /app

# Skip Puppeteer's Chromium download — server.js only uses Express + Axios.
# Without this, `npm ci --only=production` hangs downloading Chrome in Alpine.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Copy only built artifacts and package files from builder
COPY --from=builder /app/build ./build
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/server.js ./server.js

# Install only production dependencies (fast — no Chrome download)
RUN npm ci --only=production && \
    npm cache clean --force && \
    rm -rf /tmp/* /var/cache/apk/*

# Expose port
EXPOSE 3000

# Start the server
CMD ["node", "server.js"]
