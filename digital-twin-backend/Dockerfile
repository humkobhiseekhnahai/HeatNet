FROM node:20-alpine

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./
COPY tsconfig.json ./

# Install deps
RUN npm install
RUN npm install --save-dev typescript

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy source code
COPY src ./src

# Build TypeScript
RUN npx tsc -b

EXPOSE 3000

# Health check for the enhanced system
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/twin/state', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Enhanced startup with database initialization
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node dist/index.js"]