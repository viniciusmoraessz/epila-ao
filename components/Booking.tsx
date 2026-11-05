"use client";
import { useEffect, useState, FormEvent } from "react";
import { useCatalog } from "./Catalog";
import { money, today, contact } from "../lib/catalog";
import { configured } from "../lib/db";
import { agenda, displayDate } from "../lib/request";
const short = (d: Date) =>
  [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
function mask(s: string) {
  const n = s.replace(/\D/g, "").slice(0, 11);
  return n.length < 3
    ? n
    : "(" +
        n.slice(0, 2) +
        ") " +
        (n.length > 6 ? n.slice(2, -4) + "-" + n.slice(-4) : n.slice(2));
}
export default function Booking() {
  const { items, error: catalogError } = useCatalog();
  const [ids, select] = useState<number[]>([]),
    [step, go] = useState(1),
    [month, monthSet] = useState(today().slice(0, 7) + "-01"),
    [day, daySet] = useState(""),
    [slot, pick] = useState(""),
    [days, dates] = useState<string[]>([]),
    [slots, times] = useState<string[]>([]),
    [waiting, wait] = useState(false),
    [busy, submit] = useState(false),
    [error, err] = useState(""),
    [refresh, reload] = useState(0),
    [name, nm] = useState(""),
    [phone, ph] = useState(""),
    [notes, nt] = useState("");
  useEffect(() => {
    const id = Number(new URLSearchParams(location.search).get("servico"));
    if (id) select([id]);
  }, []);
  useEffect(() => {
    if (step !== 2) return;
    let live = true;
    wait(true);
    err("");
    dates([]);
    times([]);
    const work = day
      ? agenda<{ slot: string }[]>("availability", {
          p_day: day,
          p_ids: ids,
        }).then((data) => {
          if (live) times(data.map((s) => s.slot));
        })
      : Promise.resolve();
    Promise.all([
      work,
      agenda<{ day: string }[]>("available_days", {
        p_month: month,
        p_ids: ids,
      }).then((data) => {
        if (live) dates(data.map((d) => d.day));
      }),
    ])
      .catch((e) => {
        if (live) err(e.message);
      })
      .finally(() => {
        if (live) wait(false);
      });
    return () => {
      live = false;
    };
  }, [month, day, ids, step, refresh]);
  const selected = items.filter((x) => ids.includes(x.id)),
    duration = selected.reduce((a, b) => a + b.duration, 0),
    total = selected.some((s) => s.price === null)
      ? null
      : selected.reduce((a, b) => a + Number(b.price), 0);
  const base = new Date(month + "T12:00:00");
  function shift(n: number) {
    monthSet(short(new Date(base.getFullYear(), base.getMonth() + n, 1)));
    daySet("");
    pick("");
  }
  async function save(e: FormEvent) {
    e.preventDefault();
    submit(true);
    err("");
    try {
      const token = await agenda<string>("book", {
        p_ids: selected.map((s) => s.id),
        p_start: slot,
        p_name: name.trim(),
        p_phone: phone.replace(/\D/g, ""),
        p_notes: notes,
      });
      location.assign("/reserva/" + token);
    } catch (e) {
      err((e as Error).message);
      submit(false);
    }
  }
  return (
    <section className="shell workflow section">
      <a className="breadcrumb" href="/">
        ← Voltar ao estúdio
      </a>
      <h1>
        Agendar <i>horário</i>
      </h1>
      {!configured && (
        <p className="notice">
          {process.env.NODE_ENV === "development"
            ? "Demonstração local. Use dados fictícios. As reservas de teste ficam apenas neste computador."
            : "Agenda em configuração. Entre em contato com a Anny para reservar."}{" "}
          <a className="underline" href={contact}>
            Falar com a Anny
          </a>
        </p>
      )}
      <div className="eyebrow">ETAPA {step} DE 3</div>
      <div className="panel">
        {step === 1 ? (
          <>
            <h2 className="screenTitle">Escolha seus serviços</h2>
            {items.map((s) => (
              <label className="choice" key={s.id}>
                <input
                  type="checkbox"
                  checked={ids.includes(s.id)}
                  onChange={() =>
                    select(
                      ids.includes(s.id)
                        ? ids.filter((x) => x !== s.id)
                        : [...ids, s.id],
                    )
                  }
                />
                <span>
                  {s.name}
                  <small>{s.duration} min</small>
                </span>
                {money(s.price)}
              </label>
            ))}
            {catalogError && <p role="alert">{catalogError}</p>}
          </>
        ) : step === 2 ? (
          <>
            <h2 className="screenTitle">Data e horário</h2>
            <div className="sectionhead">
              <button
                disabled={month <= today().slice(0, 7) + "-01"}
                onClick={() => shift(-1)}
              >
                ← Anterior
              </button>
              <b>
                {base.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </b>
              <button
                disabled={base.getTime() > Date.now() + 365 * 86400000}
                onClick={() => shift(1)}
              >
                Próximo →
              </button>
            </div>
            <div className="weekgrid">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((x, i) => (
                <small key={"h" + i}>{x}</small>
              ))}
              {Array.from({ length: base.getDay() }, (_, i) => (
                <span key={"b" + i} />
              ))}
              {Array.from(
                {
                  length: new Date(
                    base.getFullYear(),
                    base.getMonth() + 1,
                    0,
                  ).getDate(),
                },
                (_, i) => {
                  const d = month.slice(0, 8) + String(i + 1).padStart(2, "0");
                  return (
                    <button
                      key={d}
                      aria-label={d}
                      disabled={!days.includes(d)}
                      aria-pressed={day === d}
                      onClick={() => {
                        daySet(d);
                        pick("");
                      }}
                    >
                      {i + 1}
                    </button>
                  );
                },
              )}
            </div>
            <div aria-live="polite">
              {waiting ? (
                "Buscando horários…"
              ) : !days.length ? (
                "Nenhuma data livre neste mês."
              ) : day ? (
                <>
                  <h3 className="screenTitle">Horários livres</h3>
                  {slots.map((s) => (
                    <button
                      key={s}
                      aria-pressed={s === slot}
                      onClick={() => pick(s)}
                    >
                      {s.slice(11, 16)}
                    </button>
                  ))}
                </>
              ) : (
                "Selecione uma data disponível."
              )}
            </div>
          </>
        ) : (
          <form id="booking" onSubmit={save}>
            <h2 className="screenTitle">Seus dados</h2>
            <label>
              Nome
              <input
                required
                minLength={2}
                maxLength={100}
                autoComplete="name"
                value={name}
                onChange={(e) => nm(e.target.value)}
              />
            </label>
            <label>
              WhatsApp com DDD
              <input
                type="tel"
                required
                minLength={14}
                autoComplete="tel-national"
                value={phone}
                placeholder="(87) 99999-9999"
                onChange={(e) => ph(mask(e.target.value))}
              />
            </label>
            <label>
              Observações (opcional)
              <textarea
                value={notes}
                maxLength={1000}
                onChange={(e) => nt(e.target.value)}
              />
            </label>
            <p>{displayDate(slot)} · Horário de Buíque</p>
          </form>
        )}
        <p className="notice">
          <strong>
            {selected.map((s) => s.name).join(", ") ||
              "Selecione uma ou mais áreas"}
          </strong>
          <br />
          {duration} minutos · {money(total)}
        </p>
        {error && (
          <p className="error" role="alert">
            {error}{" "}
            <button
              onClick={() => {
                go(2);
                pick("");
                reload(refresh + 1);
              }}
            >
              Consultar horários
            </button>
          </p>
        )}
        <div className="actions">
          {step > 1 && (
            <button
              disabled={busy}
              onClick={() => {
                err("");
                go(step - 1);
                if (step === 2) {
                  daySet("");
                  pick("");
                }
              }}
            >
              Voltar
            </button>
          )}
          {step < 3 ? (
            <button
              className="btn"
              disabled={
                !selected.length ||
                (step === 2 && (!slot || waiting)) ||
                (!configured && process.env.NODE_ENV !== "development")
              }
              onClick={() => go(step + 1)}
            >
              Continuar →
            </button>
          ) : (
            <button className="btn" form="booking" disabled={busy}>
              {busy ? "Reservando…" : "Confirmar reserva"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
