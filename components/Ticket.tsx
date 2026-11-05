"use client";
import { useEffect, useState } from "react";
import { agenda, displayDate } from "../lib/request";
import { money, contact, phone } from "../lib/catalog";
import { configured } from "../lib/db";
type Ticket = {
  name: string;
  starts: string;
  status: string;
  items: { name: string; duration: number; price: number | null }[];
};
export default function Reservation({ token }: { token: string }) {
  const [data, set] = useState<Ticket | null>(null),
    [err, error] = useState(""),
    [ask, confirm] = useState(false),
    [busy, wait] = useState(false),
    [msg, say] = useState("");
  async function get(cancel = false) {
    wait(true);
    error("");
    try {
      set(await agenda<Ticket>("ticket", { p_token: token, p_cancel: cancel }));
      confirm(false);
    } catch (e) {
      error((e as Error).message);
    } finally {
      wait(false);
    }
  }
  useEffect(() => {
    get();
  }, [token]);
  return (
    <section className="shell section workflow">
      <h1>
        Sua <i>reserva</i>
      </h1>
      {!configured && process.env.NODE_ENV === "development" && (
        <p className="notice">Reserva de demonstração local.</p>
      )}
      {busy && <p>Consultando a agenda…</p>}
      {err && <p role="alert">{err}</p>}
      {data && (
        <div className="panel">
          <div className="eyebrow">STATUS · {data.status.toUpperCase()}</div>
          <h2 className="screenTitle">{data.name}</h2>
          <p>{displayDate(data.starts)} · Buíque, PE</p>
          {data.items.map((s) => (
            <div className="choice" key={s.name}>
              <span>
                {s.name} · {s.duration} min
              </span>
              {money(s.price)}
            </div>
          ))}
          <p>
            <strong>
              Total: {data.items.reduce((n, s) => n + s.duration, 0)} min ·{" "}
              {money(
                data.items.some((s) => s.price === null)
                  ? null
                  : data.items.reduce((n, s) => n + Number(s.price), 0),
              )}
            </strong>
          </p>
          <p>
            Guarde este link privado para consultar ou cancelar seu horário.
          </p>
          <div className="actions">
            <button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(location.href);
                  say("Link copiado.");
                } catch {
                  say(location.href);
                }
              }}
            >
              Copiar link privado
            </button>
            <a
              className="btn"
              href={
                phone
                  ? contact +
                    "?text=" +
                    encodeURIComponent(
                      "Olá, Anny! Sou " +
                        data.name +
                        ". Minha reserva: " +
                        data.items.map((x) => x.name).join(", ") +
                        ", " +
                        displayDate(data.starts) +
                        ".",
                    )
                  : contact
              }
            >
              {phone ? "Enviar pelo WhatsApp" : "Falar com a Anny"}
            </a>
          </div>
          <p aria-live="polite">{msg}</p>
          {["pendente", "confirmado"].includes(data.status) &&
            (ask ? (
              <>
                <p>Deseja liberar este horário?</p>
                <button disabled={busy} onClick={() => get(true)}>
                  Sim, cancelar reserva
                </button>
                <button onClick={() => confirm(false)}>Manter reserva</button>
              </>
            ) : (
              <button onClick={() => confirm(true)}>
                Cancelar agendamento
              </button>
            ))}
        </div>
      )}
    </section>
  );
}
