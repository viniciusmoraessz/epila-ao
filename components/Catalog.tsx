"use client";
import { useState, useEffect } from "react";
import { db } from "../lib/db";
import { examples, money, Service } from "../lib/catalog";
import { ArrowUpRight, Clock3, ChevronDown } from "lucide-react";
export function useCatalog() {
  const [items, set] = useState<Service[]>(db ? [] : examples),
    [error, err] = useState("");
  useEffect(() => {
    if (db)
      db.from("services")
        .select("*")
        .eq("active", true)
        .order("id")
        .then(({ data, error }) =>
          error
            ? err(
                "Não foi possível carregar os serviços. Atualize a página para tentar novamente.",
              )
            : set(data || []),
        );
  }, []);
  return { items, error };
}
export default function Catalog() {
  const { items, error } = useCatalog();
  const [filter, set] = useState("Todos"),
    [all, expand] = useState(false);
  const list = items.filter((x) => filter === "Todos" || x.category === filter);
  return (
    <section id="servicos" className="shell section">
      <div className="eyebrow">
        <span /> NOSSOS SERVIÇOS
      </div>
      <div className="sectionhead">
        <h2>
          Menu de <i>epilação</i>
        </h2>
        <div className="filters">
          {["Todos", "Corporal", "Íntima", "Facial", "Combos"].map((x) => (
            <button
              key={x}
              aria-pressed={x === filter}
              onClick={() => {
                set(x);
                expand(false);
              }}
            >
              {x}
            </button>
          ))}
        </div>
      </div>
      <div className="grid3">
        {(all ? list : list.slice(0, 3)).map((s) => (
          <a className="service" href={"/agendar?servico=" + s.id} key={s.id}>
            <div className="category">
              {s.category}
              <ArrowUpRight size={18} />
            </div>
            <h3>{s.name}</h3>
            <p>{s.description}</p>
            <div className="serviceFoot">
              <span>
                <Clock3 size={14} />
                {s.duration} min
              </span>
              <strong>{money(s.price)}</strong>
            </div>
          </a>
        ))}
      </div>
      {error && <p role="alert">{error}</p>}
      {!error && !items.length && <p>Consultando o catálogo…</p>}
      {list.length > 3 && (
        <button className="more" onClick={() => expand(!all)}>
          {all ? "Mostrar menos" : "Ver todos os serviços"}{" "}
          <ChevronDown size={16} />
        </button>
      )}
      <details>
        <summary>Tipos de cera</summary>
        <p>
          <b>Hidrossolúvel.</b> Os resíduos dessa cera podem ser removidos com
          água.
        </p>
        <p>
          <b>Cera espanhola.</b> Aplicada morna e retirada após firmar. Consulte
          com a Anny a técnica disponível para sua região.
        </p>
      </details>
    </section>
  );
}
