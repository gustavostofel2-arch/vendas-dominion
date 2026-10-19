import { clearSubscriptions } from "@/lib/push";

// Apaga todas as inscrições de notificação. Protegido pelo WEBHOOK_SECRET.
export async function POST(req: Request) {
  const token = new URL(req.url).searchParams.get("token");
  if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  await clearSubscriptions();
  return Response.json({ ok: true });
}
