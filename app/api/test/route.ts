import { sendToAll } from "@/lib/push";

export async function POST() {
  try {
    const sent = await sendToAll({ title: "Dominion", body: "Nova venda confirmada!", tag: "test" });
    return Response.json({ ok: true, sent });
  } catch (e) {
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
