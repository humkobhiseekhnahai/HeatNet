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

CMD ["sh", "-c", "npx prisma db push && node dist/index.js"]