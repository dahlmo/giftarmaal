#!/usr/bin/env node
const { execSync } = require('node:child_process');

function run(cmd) {
  console.log(`$ ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

function main() {
  run('docker compose up -d db');
  run('docker compose build api web');
  run('docker compose run --rm api npx -y pnpm@9.12.2 prisma:generate');
  run('docker compose run --rm api npx -y pnpm@9.12.2 prisma:migrate');
  run('docker compose run --rm api npx -y pnpm@9.12.2 prisma:seed');
  console.log('\nDocker setup complete. Start dev with `docker compose up web api`.');
}

main();
