import { getCloudflareContext } from "@opennextjs/cloudflare";

type D1PreparedStatement = {
  bind: (...values: unknown[]) => D1PreparedStatement;
  all: <T = unknown>() => Promise<{ results?: T[] }>;
  first: <T = unknown>() => Promise<T | null>;
  run: () => Promise<unknown>;
};

export type CyberCanvasD1 = {
  prepare: (query: string) => D1PreparedStatement;
  batch?: (statements: D1PreparedStatement[]) => Promise<unknown[]>;
};

type CloudflareEnv = {
  CYBERCANVAS_DB?: CyberCanvasD1;
};

export async function getTicketsDb() {
  try {
    const context = await getCloudflareContext({ async: true });
    const env = context.env as CloudflareEnv;

    return env.CYBERCANVAS_DB || null;
  } catch {
    return null;
  }
}

export async function ensureVentesSchema(db: CyberCanvasD1) {
  await db
    .prepare(
      `create table if not exists ventes (
        id integer primary key autoincrement,
        profil_id integer not null,
        ticket_id integer not null,
        montant integer not null,
        telephone text not null default '',
        statut text not null default 'paye',
        owner_email text,
        sale_identifier text,
        created_at text not null default current_timestamp
      )`
    )
    .run();

  await db
    .prepare(
      "create unique index if not exists idx_ventes_sale_identifier on ventes (sale_identifier)"
    )
    .run();

  await db
    .prepare("create index if not exists idx_ventes_owner_email on ventes (owner_email)")
    .run();

  await db
    .prepare("create index if not exists idx_ventes_profil_id on ventes (profil_id)")
    .run();
}
