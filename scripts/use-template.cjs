'use strict';
const { basename, dirname, join } = require('node:path');
const { existsSync, mkdirSync, copyFileSync, statSync } = require('node:fs');

function usage() {
  console.error('Usage: node scripts/use-template.cjs <source-relative-to-templates> [dest-relative-to-web-public]');
  console.error('Example: node scripts/use-template.cjs designs/Eline_Marcus.pdf Eline_Marcus.pdf');
  process.exit(1);
}

const repoRoot = __dirname ? dirname(__dirname) : process.cwd();
const templatesDir = join(repoRoot, 'templates');
const webPublicDir = join(repoRoot, 'apps', 'web', 'public');

const [,, srcRel, destRelArg] = process.argv;
if (!srcRel) usage();

const srcAbs = join(templatesDir, srcRel);
if (!existsSync(srcAbs)) {
  console.error(`Template not found: ${srcAbs}`);
  process.exit(2);
}

const stat = statSync(srcAbs);
if (!stat.isFile()) {
  console.error(`Source is not a file: ${srcAbs}`);
  process.exit(3);
}

const destRel = destRelArg || basename(srcAbs);
const destAbs = join(webPublicDir, destRel);

const destParent = dirname(destAbs);
if (!existsSync(destParent)) mkdirSync(destParent, { recursive: true });

copyFileSync(srcAbs, destAbs);
console.log(`Copied ${srcAbs} -> ${destAbs}`);
