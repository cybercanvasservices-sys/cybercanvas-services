#!/usr/bin/env node
// Applique les migrations D1 dans l'ordre (migrations/d1/*.sql)
// Usage: node scripts/apply-d1-migrations.mjs [--local|--remote]
//   --local  : applique sur la base D1 locale (wrangler dev)
//   --remote : applique sur la base D1 de production (defaut)
// Env: D1_DATABASE (defaut: cybercanvas-tickets)

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const dir = join(root, "migrations", "d1");
const db = process.env.D1_DATABASE || "cybercanvas-tickets";
const mode = process.argv.includes("--local") ? "local" : "remote";

const files = readdirSync(dir)
  .filter((file) => file.endsWith(".sql"))
  .sort();

if (files.length === 0) {
  console.error("Aucune migration D1 trouvee dans migrations/d1.");
  process.exit(1);
}

const runner = process.platform === "win32" ? "npx.cmd" : "npx";

for (const file of files) {
  console.log(`[D1 ${mode}] ${file}`);
  execFileSync(
    runner,
    ["wrangler", "d1", "execute", db, mode === "local" ? "--local" : "--remote", "--file", join(dir, file)],
    { stdio: "inherit" }
  );
}

console.log("Migrations D1 appliquees avec succes.");