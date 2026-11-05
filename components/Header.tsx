"use client";
import { useState } from "react";
import { CalendarDays, Menu, X } from "lucide-react";
import { Brand } from "./Brand";
export default function Header() {
  const [open, set] = useState(false);
  return (
    <header>
      <div className="shell header">
        <Brand />
        <nav className={open ? "open" : ""} aria-label="Principal">
          {[
            ["Início", "/"],
            ["Serviços", "/#servicos"],
            ["Sobre a Anny", "/#sobre"],
            ["Cuidados", "/#cuidados"],
            ["Contato", "/#contato"],
          ].map(([n, h]) => (
            <a key={n} href={h} onClick={() => set(false)}>
              {n}
            </a>
          ))}
        </nav>
        <a className="btn small" href="/agendar">
          <CalendarDays size={16} /> Agendar horário
        </a>
        <button
          className="menu"
          aria-label="Menu de navegação"
          aria-expanded={open}
          onClick={() => set(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
