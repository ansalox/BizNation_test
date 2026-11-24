# syntax=docker/dockerfile:1

FROM node:26-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@12.23.0

# 1. Production dependencies stage
FROM base AS deps
COPY package.json ./
RUN pnpm install --prod --ignore-scripts

# 2. TypeScript build stage
FROM base AS builder
COPY package.json tsconfig.json ./
RUN pnpm install --ignore-scripts
COPY src ./src
RUN pnpm build

# 3. Minimal non-root runtime stage
FROM node:26-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json .sequelizerc ./
COPY src/config/database.cjs ./src/config/database.cjs
COPY src/database/migrations ./src/database/migrations
COPY src/database/seeders ./src/database/seeders

RUN chown -R node:node /app
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "dist/server.js"]
