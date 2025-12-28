FROM node:20-slim AS base
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN corepack enable && corepack prepare pnpm@latest --activate && pnpm i --frozen-lockfile || pnpm i
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev"]
