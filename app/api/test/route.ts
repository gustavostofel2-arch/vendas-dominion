import { sendToAll } from "@/lib/push";

export async function POST() {
  const sent = await sendToAll({ title: "Nova venda Dominion", body: "Notificação de teste", tag: "test" });
  return Response.json({ ok: true, sent });
}
