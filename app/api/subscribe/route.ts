import { saveSubscription } from "@/lib/push";

export async function POST(req: Request) {
  const sub = await req.json().catch(() => null);
  if (!sub?.endpoint || !sub?.keys) return Response.json({ error: "invalid" }, { status: 400 });
  try {
    await saveSubscription(sub);
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
