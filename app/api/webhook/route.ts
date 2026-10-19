import { sendToAll } from "@/lib/push";

async function handle(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("x-webhook-secret");
  if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const sent = await sendToAll({ title: "Dominion", body: "Nova venda confirmada!" });
    return Response.json({ ok: true, sent });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;
