FROM node:20-bookworm-slim

# Baileys talks to WhatsApp over a WebSocket — no browser/Chromium required.
# Only ca-certificates is needed for outbound TLS.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# whatsapp-web.js is retained only as a devDependency for the manual backfill
# script — it is never launched by this service. It pulls in Puppeteer, so skip
# Puppeteer's Chromium download to keep the image small and the build fast.
ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production

CMD ["npm", "start"]
