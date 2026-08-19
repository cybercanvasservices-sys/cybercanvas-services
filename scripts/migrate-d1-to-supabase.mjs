#!/usr/bin/env node
// CyberCanvas Services - migration des donnees Cloudflare D1 vers Supabase
// Usage:
//   node scripts/migrate-d1-to-supabase.mjs --remote [--dry-run] [tickets ventes shop_products shop_orders]
//   node scripts/migrate-d1-to-supabase.mjs --local  [--dry-run]
//
// Lit les tables depuis D1 (via wrangler) puis les insere dans Supabase
// (idempotent : on conflict do nothing sur la colonne id).
// Requiert : SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL dans l'environnement.

import { execSync } from "node:child_process";
import { createClient } from "@supabase/supabase-js";

const DATABASE = "cybercanvas-tickets";
const DEFAULT_TABLES = ["tickets", "ventes", "shop_products", "shop_orders"];

const args = process.argv.slice(2);
const remote = args.includes("--remote");
const dryRun = args.includes("--dry-run");

if (!remote && !args.includes("--local")) {
  console.error("Indiquez --remote ou --local pour choisir la base D1 source.");
  process.exit(1);
}

const mode = remote ? "remote" : "local";
const wanted = args.filter((arg) => !arg.startsWith("--"));

if (wanted.length > 0) {
  for (const table of wanted) {
    if (!DEFAULT_TABLES.includes(table)) {
      console.error(`Table inconnue: ${table} (attendues: ${DEFAULT_TABLES.join(", ")})`);
      process.exit(1);
    }
  }
}

const tables = wanted.length > 0 ? wanted : DEFAULT_TABLES;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

function normalizeRow(table, row) {
  const normalized = { ...row };

  if (table === "shop_products" && "actif" in normalized) {
    normalized.actif = Boolean(Number(normalized.actif));
  }

  for (const key of Object.keys(normalized)) {
    if (normalized[key] === null) continue;
    if (typeof normalized[key] === "string" && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(normalized[key])) {
      normalized[key] = normalized[key].replace(" ", "T") + "Z";
    }
  }

  return normalized;
}

function readD1Table(table) {
  const cmd = `npx --yes wrangler@4 d1 execute ${DATABASE} --${mode} --json --command "select * from ${table}"`;
  const stdout = execSync(cmd, { encoding: "utf8", stdio: ["pipe", "pipe", "inherit"] });

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch {
    console.error(`Impossible de parser la sortie de wrangler pour la table ${table}.`);
    process.exit(1);
  }

  const batch = Array.isArray(parsed) ? parsed[0] : parsed;
  return (batch?.results || []) as Record<string, unknown>[];
}

async function migrateTable(table) {
  const rows = readD1Table(table);

  if (rows.length === 0) {
    console.log(`[${table}] 0 ligne - rien a migrer.`);
    return;
  }

  const normalized = rows.map((row) => normalizeRow(table, row));

  if (dryRun) {
    console.log(`[${table}] ${normalized.length} ligne(s) a migrer (apercu 3):`);
    console.log(JSON.stringify(normalized.slice(0, 3), null, 2));
    return;
  }

  const chunkSize = 500;

  for (let index = 0; index < normalized.length; index += chunkSize) {
    const chunk = normalized.slice(index, index + chunkSize);
    const { error } = await supabase
      .from(table)
      .upsert(chunk, { onConflict: "id", ignoreDuplicates: true });

    if (error) {
      console.error(`[${table}] erreur a la ligne ${index}:`, error.message);
      process.exit(1);
    }
  }

  console.log(`[${table}] ${normalized.length} ligne(s) migrees.`);
}

console.log(`Migration D1 (${mode}) -> Supabase${dryRun ? " (apercu)" : ""}`);

for (const table of tables) {
  await migrateTable(table);
}

console.log("Termine.");