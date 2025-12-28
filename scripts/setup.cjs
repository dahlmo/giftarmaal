#!/usr/bin/env node
const { execSync } = require("node:child_process");
const { existsSync, copyFileSync, readFileSync } = require("node:fs");
const path = require("node:path");

function run(cmd, opts = {}) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: "inherit", ...opts });
}

function ensureEnv() {
  const root = process.cwd();
  const env = path.join(root, ".env");
  const example = path.join(root, ".env.example");
  if (!existsSync(env) && existsSync(example)) {
    copyFileSync(example, env);
    console.log("Created .env from .env.example");
  }
}

function loadDatabaseUrl() {
  const root = process.cwd();
  const envPath = existsSync(path.join(root, ".env"))
    ? path.join(root, ".env")
    : path.join(root, ".env.example");
  let url = process.env.DATABASE_URL;
  if (!url && existsSync(envPath)) {
    try {
      const text = readFileSync(envPath, "utf8");
      const line = text
        .split(/\r?\n/)
        .find((l) => l.trim().startsWith("DATABASE_URL="));
      if (line) url = line.split("=")[1].trim();
    } catch {}
  }
  if (!url) url = "postgresql://app:app@localhost:5432/app";
  return url;
}

function pnpx(cmd) {
  return `npx -y pnpm@9.12.2 ${cmd}`;
}

function main() {
  ensureEnv();
  const DATABASE_URL = loadDatabaseUrl();
  run(pnpx("-v"));
  run(pnpx("i"));
  run(pnpx("chmod +x apps/api/entrypoint.sh"));
  run("docker compose up -d db");
  const env = { DATABASE_URL, ...process.env };
  run(pnpx("--filter api prisma:generate"), { env });
  run(pnpx("--filter api prisma:migrate"), { env });
  run(pnpx("--filter api prisma:seed"), { env });
  console.log(
    "\nSetup complete. Next: `npx -y pnpm@9.12.2 dev` or `docker compose up web api`."
  );
}

main();
