export async function agenda<T>(
  action: string,
  args: Record<string, unknown>,
): Promise<T> {
  const r = await fetch("/api/agenda", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, args }),
    cache: "no-store",
  });
  const result = await r.json();
  if (!r.ok) throw Error(result.error);
  return result.data;
}
export const displayDate = (s: string) =>
  new Date(s.slice(0, 19)).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
