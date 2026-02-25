FROM node:20-slim AS base
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY . .
EXPOSE 5173
CMD ["pnpm", "dev"]
