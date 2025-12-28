FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=development
RUN apt-get update && apt-get install -y ca-certificates && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml* ./
COPY . .
RUN sed -i 's/\r$//' /app/entrypoint.sh && chmod 755 /app/entrypoint.sh
EXPOSE 3001
ENTRYPOINT ["/app/entrypoint.sh"]
