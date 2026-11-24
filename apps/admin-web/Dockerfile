# Build context = monorepo root (set RAILWAY_DOCKERFILE_PATH=apps/admin-web/Dockerfile)
FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps ./apps
COPY packages ./packages

RUN npm ci
RUN npm run build --workspace=@veno/shared-types \
 && npm run build --workspace=apps/admin-web

ENV NODE_ENV=production
WORKDIR /app/apps/admin-web

EXPOSE 3002
CMD ["sh", "-c", "npx next start -H 0.0.0.0 -p ${PORT:-3002}"]
