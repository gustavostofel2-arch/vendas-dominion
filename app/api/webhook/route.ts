import { sendToAll } from "@/lib/push";

// Procura um valor monetário em campos comuns do payload (a Gestlink pode variar o formato).
function findAmount(data: unknown): string | null {
  const keys = ["amount", "value", "valor", "total", "price", "preco", "valor_total"];
  const walk = (o: unknown, depth = 0): unknown => {
    if (!o || typeof o !== "object" || depth > 3) return undefined;
    for (const [k, v] of Object.entries(o as Record<string, unknown>)) {
      if (keys.includes(k.toLowerCase()) && (typeof v === "number" || typeof v === "string")) return v;
    }
    for (const v of Object.values(o as Record<string, unknown>)) {
      const r = walk(v, depth + 1);
      if (r !== undefined) return r;
    }
    return undefined;
  };
  const v = walk(data);
  if (v === undefined) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[^\d.,-]/g, "").replace(/\.(?=\d{3}\b)/g, "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

async function handle(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("x-webhook-secret");
  if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const data = await req.json().catch(() => null);
  const amount = findAmount(data);
  const sent = await sendToAll({
    title: "Nova venda Dominion",
    body: amount ?? "Venda confirmada na Gestlink",
  });
  return Response.json({ ok: true, sent });
}

export const POST = handle;
export const GET = handle;
