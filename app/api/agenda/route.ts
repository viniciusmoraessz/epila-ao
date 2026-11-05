import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { preview } from "../../../lib/local";
export async function POST(req: Request) {
  try {
    const { action, args } = await req.json();
    let query: string, values: unknown[];
    switch (action) {
      case "available_days":
        query = "select * from available_days($1,$2)";
        values = [args.p_month, args.p_ids];
        break;
      case "availability":
        query = "select * from availability($1,$2)";
        values = [args.p_day, args.p_ids];
        break;
      case "book":
        query = "select book($1,$2,$3,$4,$5) as result";
        values = [
          args.p_ids,
          args.p_start,
          args.p_name,
          args.p_phone,
          args.p_notes,
        ];
        break;
      case "ticket":
        query = "select ticket($1,$2) as result";
        values = [args.p_token, !!args.p_cancel];
        break;
      default:
        return NextResponse.json(
          { error: "Ação desconhecida" },
          { status: 400 },
        );
    }
    if (db) {
      const { data, error } = await db.rpc(action, args);
      if (error) throw Error(error.message);
      return NextResponse.json({ data });
    }
    if (process.env.NODE_ENV !== "development")
      return NextResponse.json(
        { error: "Agenda em configuração. Fale com a Anny para reservar." },
        { status: 503 },
      );
    const rows = (await (await preview()).query(query, values)).rows as {
      result: unknown;
      slot: Date | string;
    }[];
    return NextResponse.json({
      data:
        action === "available_days"
          ? rows
          : action === "availability"
            ? rows.map((x) => ({
                slot:
                  x.slot instanceof Date
                    ? x.slot.toISOString().slice(0, 19)
                    : x.slot,
              }))
            : rows[0].result,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    return NextResponse.json(
      {
        error: message.includes("Prazo")
          ? "O prazo para cancelar online terminou. Fale com a Anny."
          : message.includes("Horário") || message.includes("exclusion")
            ? "Este horário acabou de ficar indisponível. Escolha outro."
            : "Não foi possível concluir. Confira os dados e tente novamente.",
      },
      { status: 400 },
    );
  }
}
