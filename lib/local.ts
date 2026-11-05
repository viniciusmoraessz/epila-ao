import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
const host = globalThis as typeof globalThis & {
  annyPreview?: Promise<PGlite>;
};
// Restrito ao desenvolvimento. Nunca simula reservas em produção.
export function preview() {
  if (process.env.NODE_ENV !== "development")
    throw Error("Configure o Supabase para abrir a agenda.");
  return (host.annyPreview ??= (async () => {
    const pg = new PGlite("./.preview-db");
    const exists = await pg.query(
      "select to_regclass('public.services') as found",
    );
    if (!(exists.rows[0] as { found: string }).found) {
      await pg.exec(
        "create schema if not exists auth; create or replace function auth.jwt() returns jsonb language sql as $$select '{}'::jsonb$$; do $$begin if not exists(select from pg_roles where rolname='anon') then create role anon;end if;if not exists(select from pg_roles where rolname='authenticated') then create role authenticated;end if;end$$;",
      );
      await pg.exec(await readFile("supabase/schema.sql", "utf8"));
    }
    return pg;
  })());
}
