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
