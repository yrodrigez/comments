# Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app
# Enable corepack to use pnpm/yarn
RUN corepack enable

COPY package*.json pnpm-lock.yaml ./
RUN pnpm fetch --prod
RUN pnpm install --prod

# Build stage
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY . .
RUN pnpm install && pnpm run build && pnpm prune --prod

# Runtime
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/index.js"]