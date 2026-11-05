"use client";
import { useState, useEffect, FormEvent } from "react";
import { db } from "../lib/db";
import { today, money, Service } from "../lib/catalog";
import { displayDate } from "../lib/request";
type Client = { id: string; phone: string; name: string };
type Appointment = {
  id: string;
  client_id: string;
  client_name: string;
  starts: string;
  status: string;
  notes: string;
  appointment_services: { name: string; price: number | null }[];
};
type Hours = { id: number; weekday: number; opens: string; closes: string };
type Block = { day: string; reason: string };
type Settings = {
  lead_minutes: number;
  gap: number;
  horizon: number;
  cancel_hours: number;
};
type Data = {
  services: Service[];
  clients: Client[];
  appointments: Appointment[];
  working_hours: Hours[];
  blocked_dates: Block[];
  settings: Settings[];
};
const weekdays = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
const labels = {
  lead_minutes: "Antecedência mínima (min)",
  gap: "Intervalo entre clientes (min)",
  horizon: "Limite da agenda (dias)",
  cancel_hours: "Antecedência para cancelar (h)",
};
function form(e: FormEvent<HTMLFormElement>) {
  e.preventDefault();
  return Object.fromEntries(new FormData(e.currentTarget)) as Record<
    string,
    string
  >;
}
export default function Admin() {
  const [owner, allow] = useState(false),
    [checked, ready] = useState(false),
    [data, set] = useState<Data | null>(null),
    [msg, say] = useState(""),
    [busy, wait] = useState(false),
    [tab, show] = useState("Agenda"),
    [period, periodSet] = useState("Dia"),
    [day, dateSet] = useState(today()),
    [search, find] = useState("");
  useEffect(() => {
    if (!db) {
      ready(true);
      return;
    }
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange((_event, s) => {
      allow(s?.user.app_metadata.role === "studio_admin");
      if (!s || s.user.app_metadata.role !== "studio_admin") set(null);
      ready(true);
    });
    return () => subscription.unsubscribe();
  }, []);
  async function read() {
    if (!db) return;
    const tables = [
      "services",
      "clients",
      "appointments",
      "working_hours",
      "blocked_dates",
      "settings",
    ] as const;
    const lists = await Promise.all(
      tables.map(async (t) => {
        const all = [];
        for (let offset = 0; ; offset += 500) {
          const q = await db!
            .from(t)
            .select(
              t === "appointments" ? "*,appointment_services(name,price)" : "*",
            )
            .order(t === "blocked_dates" ? "day" : "id")
            .range(offset, offset + 499);
          if (q.error) throw Error(q.error.message);
          all.push(...q.data);
          if (q.data.length < 500) break;
        }
        return [t, all];
      }),
    );
    set(Object.fromEntries(lists) as Data);
  }
  useEffect(() => {
    if (owner) read().catch(() => say("Falha ao carregar. Atualize a página."));
  }, [owner]);
  async function change(
    request: PromiseLike<{ error: { message: string } | null }>,
  ) {
    wait(true);
    say("");
    try {
      const r = await request;
      if (r.error) throw Error(r.error.message);
      await read();
      say("Alteração salva.");
    } catch (e) {
      say("Não foi possível salvar. " + (e as Error).message);
    } finally {
      wait(false);
    }
  }
  async function login(e: FormEvent<HTMLFormElement>) {
    const f = form(e);
    if (!db) return;
    wait(true);
    try {
      const r = await db.auth.signInWithPassword({
        email: f.email,
        password: f.password,
      });
      if (r.error || r.data.user?.app_metadata.role !== "studio_admin") {
        await db.auth.signOut();
        say("E-mail ou senha inválidos, ou conta sem acesso ao estúdio.");
      } else say("");
    } catch {
      say("Falha de conexão. Tente novamente.");
    } finally {
      wait(false);
    }
  }
  if (!owner)
    return (
      <section className="shell section workflow">
        <h1>
          Área da <i>Anny</i>
        </h1>
        {!checked ? (
          <p>Verificando sessão…</p>
        ) : !db ? (
          <p className="notice">
            O acesso administrativo estará disponível após conectar o Supabase.
          </p>
        ) : (
          <form className="panel" onSubmit={login}>
            <label>
              E-mail
              <input
                name="email"
                type="email"
                required
                autoComplete="username"
              />
            </label>
            <label>
              Senha
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button className="btn" disabled={busy}>
              Entrar
            </button>
          </form>
        )}
        <p role="status">{msg}</p>
      </section>
    );
  const start = new Date(day + "T12:00:00"),
    end = new Date(start);
  if (period === "Semana") {
    start.setDate(start.getDate() - start.getDay());
    end.setTime(start.getTime());
    end.setDate(end.getDate() + 7);
  } else if (period === "Mês") {
    start.setDate(1);
    end.setDate(1);
    end.setMonth(end.getMonth() + 1);
  } else end.setDate(end.getDate() + 1);
  const list = (data?.appointments || [])
    .filter(
      (a) =>
        a.starts.slice(0, 10) >= start.toLocaleDateString("sv-SE") &&
        a.starts.slice(0, 10) < end.toLocaleDateString("sv-SE"),
    )
    .sort((a, b) => a.starts.localeCompare(b.starts));
  const active = list.filter(
      (a) => !["cancelado", "faltou"].includes(a.status),
    ),
    services = active.flatMap((a) => a.appointment_services);
  const counts = new Map<string, number>();
  services.forEach((s) => counts.set(s.name, (counts.get(s.name) || 0) + 1));
  const popular = [...counts].sort((a, b) => b[1] - a[1])[0];
  const summary = (a: Appointment) => (
    <>
      <b>
        {displayDate(a.starts)} · {a.client_name}
      </b>
      <p>
        {a.appointment_services.map((s) => s.name).join(", ")} · {a.status}
      </p>
      {a.notes && <p>Observações: {a.notes}</p>}
    </>
  );
  return (
    <section className="shell section workflow">
      <h1>
        Painel da <i>Anny</i>
      </h1>
      <button className="textlink" onClick={() => db!.auth.signOut()}>
        Sair da conta
      </button>
      <details>
        <summary>Definir senha de acesso</summary>
        <form
          className="panel"
          onSubmit={async (event) => {
            const element = event.currentTarget;
            const { password, confirmation } = form(event);
            if (password !== confirmation) {
              say("As senhas precisam ser iguais.");
              return;
            }
            wait(true);
            try {
              const { error } = await db!.auth.updateUser({ password });
              if (error) throw error;
              element.reset();
              say(
                "Senha salva. Use seu e-mail e essa senha nos próximos acessos.",
              );
            } catch {
              say(
                "Não foi possível salvar a senha. Verifique sua sessão e tente novamente.",
              );
            } finally {
              wait(false);
            }
          }}
        >
          <label>
            Nova senha (mínimo de 12 caracteres)
            <input
              type="password"
              autoComplete="new-password"
              name="password"
              minLength={12}
              required
            />
          </label>
          <label>
            Repita a senha
            <input
              type="password"
              autoComplete="new-password"
              name="confirmation"
              minLength={12}
              required
            />
          </label>
          <button disabled={busy}>Salvar senha</button>
        </form>
      </details>
      <div className="tabs filters">
        {["Agenda", "Clientes", "Serviços", "Configurações"].map((t) => (
          <button key={t} aria-pressed={tab === t} onClick={() => show(t)}>
            {t}
          </button>
        ))}
      </div>
      <p role="status">{busy ? "Salvando…" : msg}</p>
      {!data ? (
        <p>Carregando painel…</p>
      ) : (
        <fieldset className="panel" disabled={busy}>
          {tab === "Agenda" ? (
            <>
              <div className="sectionhead">
                <h2 className="screenTitle">Agenda</h2>
                <a className="btn" href="/agendar">
                  Criar agendamento manual
                </a>
              </div>
              <label>
                Data de referência
                <input
                  type="date"
                  value={day}
                  onChange={(e) => e.target.value && dateSet(e.target.value)}
                />
              </label>
              {["Dia", "Semana", "Mês"].map((x) => (
                <button
                  key={x}
                  aria-pressed={period === x}
                  onClick={() => periodSet(x)}
                >
                  {x}
                </button>
              ))}
              <div className="notice">
                {active.length} atendimento(s) no período · Estimativa{" "}
                {money(services.reduce((n, s) => n + Number(s.price), 0))}
                {services.some((s) => s.price === null) &&
                  " + valores sob consulta"}
                <br />
                Serviço mais procurado:{" "}
                {popular ? popular[0] + " (" + popular[1] + ")" : "—"}
              </div>
              {!list.length && <p>Nenhum agendamento neste período.</p>}
              {list.map((a) => (
                <div className="adminRow" key={a.id}>
                  {summary(a)}
                  <a
                    className="textlink"
                    href={
                      "https://wa.me/55" +
                      data.clients.find((c) => c.id === a.client_id)?.phone
                    }
                  >
                    WhatsApp da cliente ↗
                  </a>
                  <form
                    onSubmit={(e) => {
                      const f = form(e);
                      change(
                        db!
                          .from("appointments")
                          .update({ status: f.status })
                          .eq("id", a.id),
                      );
                    }}
                  >
                    <label>
                      Status
                      <select name="status" defaultValue={a.status}>
                        {[
                          "pendente",
                          "confirmado",
                          "concluído",
                          "cancelado",
                          "faltou",
                        ].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                    <button>Salvar status</button>
                  </form>
                  {["pendente", "confirmado"].includes(a.status) && (
                    <form
                      onSubmit={(e) => {
                        const f = form(e);
                        change(
                          db!.rpc("reschedule", {
                            p_id: a.id,
                            p_start: f.start,
                          }),
                        );
                      }}
                    >
                      <label>
                        Novo horário
                        <input
                          type="datetime-local"
                          required
                          name="start"
                          step="900"
                        />
                      </label>
                      <button>Remarcar</button>
                    </form>
                  )}
                </div>
              ))}
            </>
          ) : tab === "Clientes" ? (
            <>
              <h2 className="screenTitle">Clientes e histórico</h2>
              <label>
                Buscar por nome ou telefone
                <input value={search} onChange={(e) => find(e.target.value)} />
              </label>
              {data.clients
                .filter((c) =>
                  (c.name + c.phone)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
                )
                .map((c) => (
                  <details key={c.id}>
                    <summary>
                      {c.name} · {c.phone}
                    </summary>
                    {data.appointments
                      .filter((a) => a.client_id === c.id)
                      .map((a) => (
                        <div className="adminRow" key={a.id}>
                          {summary(a)}
                        </div>
                      ))}
                  </details>
                ))}
            </>
          ) : tab === "Serviços" ? (
            <>
              <h2 className="screenTitle">Serviços</h2>
              {[...data.services, null].map((s) => (
                <details key={s?.id || "new"}>
                  <summary>{s?.name || "Adicionar serviço"}</summary>
                  <form
                    onSubmit={(e) => {
                      const f = form(e);
                      const record = {
                        name: f.name,
                        description: f.description,
                        category: f.category,
                        duration: Number(f.duration),
                        price: f.price === "" ? null : Number(f.price),
                        active: !!f.active,
                      };
                      change(
                        s
                          ? db!.from("services").update(record).eq("id", s.id)
                          : db!.from("services").insert(record),
                      );
                    }}
                  >
                    <label>
                      Nome
                      <input name="name" required defaultValue={s?.name} />
                    </label>
                    <label>
                      Descrição
                      <input
                        name="description"
                        required
                        defaultValue={s?.description}
                      />
                    </label>
                    <label>
                      Categoria
                      <select name="category" defaultValue={s?.category}>
                        {["Corporal", "Íntima", "Facial", "Combos"].map((x) => (
                          <option key={x}>{x}</option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Duração em minutos
                      <input
                        type="number"
                        min="5"
                        max="480"
                        required
                        name="duration"
                        defaultValue={s?.duration}
                      />
                    </label>
                    <label>
                      Valor em reais (vazio para sob consulta)
                      <input
                        type="number"
                        min="0"
                        step=".01"
                        name="price"
                        defaultValue={s?.price ?? ""}
                      />
                    </label>
                    <label className="choice">
                      Visível no catálogo
                      <input
                        type="checkbox"
                        name="active"
                        defaultChecked={s?.active ?? true}
                      />
                    </label>
                    <button>Salvar serviço</button>
                  </form>
                </details>
              ))}
            </>
          ) : (
            <>
              <h2 className="screenTitle">Regras de agendamento</h2>
              <form
                onSubmit={(e) => {
                  const f = form(e);
                  change(
                    db!
                      .from("settings")
                      .update(
                        Object.fromEntries(
                          Object.entries(f).map(([k, v]) => [k, Number(v)]),
                        ),
                      )
                      .eq("id", 1),
                  );
                }}
              >
                {Object.entries(labels).map(([k, label]) => (
                  <label key={k}>
                    {label}
                    <input
                      name={k}
                      type="number"
                      min={k === "horizon" ? 1 : 0}
                      required
                      defaultValue={data.settings[0][k as keyof Settings]}
                    />
                  </label>
                ))}
                <button>Salvar regras</button>
              </form>
              <h3>Turnos de trabalho</h3>
              <p>
                Cadastre turnos separados para reservar o intervalo de almoço.
                Dias sem turnos são folgas.
              </p>
              {data.working_hours.map((h) => (
                <div className="choice" key={h.id}>
                  {weekdays[h.weekday]} · {h.opens.slice(0, 5)}–
                  {h.closes.slice(0, 5)}
                  <button
                    onClick={() =>
                      change(db!.from("working_hours").delete().eq("id", h.id))
                    }
                  >
                    Excluir turno
                  </button>
                </div>
              ))}
              <form
                onSubmit={(e) => {
                  const f = form(e);
                  change(db!.from("working_hours").insert(f));
                }}
              >
                <label>
                  Dia
                  <select name="weekday">
                    {weekdays.map((w, i) => (
                      <option key={w} value={i}>
                        {w}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Abertura
                  <input required type="time" name="opens" />
                </label>
                <label>
                  Encerramento
                  <input required type="time" name="closes" />
                </label>
                <button>Adicionar turno</button>
              </form>
              <h3>Feriados e bloqueios</h3>
              <form
                onSubmit={(e) => {
                  const f = form(e);
                  change(db!.from("blocked_dates").upsert(f));
                }}
              >
                <label>
                  Data
                  <input type="date" name="day" required />
                </label>
                <label>
                  Motivo
                  <input name="reason" required />
                </label>
                <button>Bloquear data</button>
              </form>
              <details>
                <summary>Ver datas bloqueadas</summary>
                {data.blocked_dates.map((b) => (
                  <div className="choice" key={b.day}>
                    {b.day} · {b.reason}
                    <button
                      onClick={() =>
                        change(
                          db!.from("blocked_dates").delete().eq("day", b.day),
                        )
                      }
                    >
                      Liberar
                    </button>
                  </div>
                ))}
              </details>
            </>
          )}
        </fieldset>
      )}
    </section>
  );
}
