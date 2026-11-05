import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
const pg = new PGlite();
try {
  // Apenas o provedor da identidade é substituído no PostgreSQL isolado.
  await pg.exec(
    `create schema auth; create function auth.jwt() returns jsonb language sql as $$select nullif(current_setting('test.jwt',true),'')::jsonb$$;create role anon;create role authenticated;grant usage on schema auth to authenticated,anon;`,
  );
  await pg.exec(
    await readFile(new URL("../supabase/schema.sql", import.meta.url), "utf8"),
  );
  await pg.exec("set role anon");
  await assert.rejects(pg.query("select * from clients"));
  const { rows } = await pg.query(
    "select to_char(slot,'YYYY-MM-DD HH24:MI') as slot from generate_series(current_date+3,current_date+15,interval '1 day') d cross join lateral availability(d::date,array[1,2]) limit 1",
  );
  assert.ok(rows[0]);
  const slot = rows[0].slot;
  const reserve = () =>
    pg.query(
      "select book(array[1,2],$1,'Cliente teste','87988887777','Teste isolado') as token",
      [slot],
    );
  const results = await Promise.allSettled([reserve(), reserve()]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  const token = results.find((r) => r.status === "fulfilled").value.rows[0]
    .token;
  const receipt = (await pg.query("select ticket($1,false) as r", [token]))
    .rows[0].r;
  assert.equal(receipt.items.length, 2);
  assert.equal(receipt.status, "pendente");
  await assert.rejects(pg.query("select ticket(gen_random_uuid(),false)"));
  await pg.exec("reset role;set role authenticated");
  assert.equal((await pg.query("select * from clients")).rows.length, 0);
  await pg.exec(
    `select set_config('test.jwt','{"app_metadata":{"role":"studio_admin"}}',false)`,
  );
  assert.equal((await pg.query("select * from clients")).rows.length, 1);
  const id = (await pg.query("select id from appointments")).rows[0].id;
  const next = (
    await pg.query(
      "select to_char(slot,'YYYY-MM-DD HH24:MI') as slot from availability($1::timestamp::date,array[1,2]) limit 1",
      [slot],
    )
  ).rows[0].slot;
  await pg.query("select reschedule($1,$2)", [id, next]);
  await pg.exec("update settings set cancel_hours=10000");
  await assert.rejects(pg.query("select ticket($1,true)", [token]));
  await pg.exec("update settings set cancel_hours=0;reset role;set role anon");
  assert.equal(
    (await pg.query("select ticket($1,true) as r", [token])).rows[0].r.status,
    "cancelado",
  );
  assert.ok(
    (
      await pg.query(
        "select * from availability($1::timestamp::date,array[1,2]) where slot=$1::timestamp",
        [next],
      )
    ).rows.length,
  );
  console.log(
    "Agenda validada: acesso por papel, reserva de duas áreas, disputa de horário, remarcação, prazo e liberação após cancelar.",
  );
} finally {
  await pg.close();
}
