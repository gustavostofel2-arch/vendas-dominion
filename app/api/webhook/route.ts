import { sendToAll } from "@/lib/push";

async function handle(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("x-webhook-secret");
  const raw = await req.text().catch(() => "");
  console.log("[webhook]", req.method, req.headers.get("content-type"), "token_ok:", token === process.env.WEBHOOK_SECRET, raw.slice(0, 500));
  if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const sent = await sendToAll({ title: "Nova venda confirmada!", body: "" });
    return Response.json({ ok: true, sent });
  } catch (e) {
    console.log("[webhook] erro", e);
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;
export const PUT = handle;
