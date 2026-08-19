#!/usr/bin/env node
// Migre les ventes depuis Supabase vers Cloudflare D1.
// Les tickets etaient deja dans D1 ; les ventes passent dans D1 (Phase 3).
// Les anciennes ventes Supabase (sans sale_identifier) sont rejouees telles quelles.
// Usage:
//   node scripts/migrate-ventes-supabase-to-d1.mjs [--dry-run] [--local|--remote]
//   --dry-run : affiche le SQL sans l'appliquer
//   --local   : applique sur la base D1 locale (defaut: remote)
// Env requises: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// Env optionnelle: D1_DATABASE (defaut: cybercanvas-tickets)

import { createClient } from "@supabase/supabase-js";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const d1Db = process.env.D1_DATABASE || "cybercanvas-tickets";
const mode = process.argv.includes("--local") ? "local" : "remote";
const dryRun = process.argv.includes("--dry-run");

if (!url || !key) {
  console.error(
    "Variables NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY requises (chargez .env)."
  );
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

const all = [];
let offset = 0;
const pageSize = 1000;

while (true) {
  const { data, error } = await supabase
    .from("ventes")
    .select("id, profil_id, ticket_id, montant, telephone, statut, owner_email, created_at")
    .order("id")
    .range(offset, offset + pageSize - 1);

  if (error) {
    throw new Error(`Lecture Supabase echouee: ${error.message}`);
  }

  if (!data || data.length === 0) break;

  all.push(...data);
  offset += data.length;

  if (data.length < pageSize) break;
}

if (all.length === 0) {
  console.log("Aucune vente a migrer (table Supabase vide ou absente).");
  process.exit(0);
}

const sqlValue = (value) => {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
};

const rows = all
  .map(
    (vente) =>
      `(${sqlValue(vente.id)}, ${sqlValue(vente.profil_id)}, ${sqlValue(
        vente.ticket_id
      )}, ${sqlValue(Math.round(Number(vente.montant) || 0))}, ${sqlValue(
        vente.telephone || ""
      )}, ${sqlValue(vente.statut || "paye")}, ${sqlValue(
        vente.owner_email
      )}, NULL, ${sqlValue(vente.created_at)})`
  )
  .join(",\n");

const sql = `insert or ignore into ventes (id, profil_id, ticket_id, montant, telephone, statut, owner_email, sale_identifier, created_at)\nvalues\n${rows};\n`;

if (dryRun) {
  console.log(`[dry-run] ${all.length} ventes a migrer vers D1 (${mode}).`);
  console.log(sql);
  process.exit(0);
}

const tmp = join(process.cwd(), ".migrate-ventes.sql");
writeFileSync(tmp, sql, "utf8");

const runner = process.platform === "win32" ? "npx.cmd" : "npx";

try {
  execFileSync(
    runner,
    ["wrangler", "d1", "execute", d1Db, mode === "local" ? "--local" : "--remote", "--file", tmp],
    { stdio: "inherit" }
  );
  console.log(`${all.length} ventes migrees vers D1 (${mode}).`);
} finally {
  unlinkSync(tmp);
}