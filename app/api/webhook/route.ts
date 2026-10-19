import { claim, sendToAll } from "@/lib/push";

type Payload = {
  Buyer?: { Email?: string };
  Purchase?: { PaymentId?: string; InvoiceUrl?: string };
};

async function handle(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? req.headers.get("x-webhook-secret");
  if (!process.env.WEBHOOK_SECRET || token !== process.env.WEBHOOK_SECRET) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const raw = await req.text().catch(() => "");
  const clean = raw.replace(/^﻿/, "").trim();
  let data: Payload = {};
  try {
    data = JSON.parse(clean);
  } catch {
    console.log("[webhook] JSON inválido, usando leitura por texto");
  }
  console.log("[webhook]", req.method, raw.slice(0, 300));

  try {
    // O botão "Testar" da Lastlink manda vários eventos iguais de uma vez: notifica só 1 por minuto.
    const isTest =
      data.Buyer?.Email === "test.email@mail.com" ||
      (data.Purchase?.InvoiceUrl ?? "").endsWith("-test") ||
      clean.includes("test.email@mail.com") ||
      /-test"/.test(clean);
    const paymentId = data.Purchase?.PaymentId ?? clean.match(/"PaymentId"\s*:\s*"([^"]+)"/)?.[1];
    // Venda real: 1 notificação por pagamento (a Lastlink pode reenviar o mesmo evento).
    const key = isTest ? "test" : paymentId ? `pay:${paymentId}` : null;
    if (key && !(await claim(key, isTest ? 60 : 86400))) {
      return Response.json({ ok: true, sent: 0, duplicate: true });
    }
    const sent = await sendToAll({ title: "Dominion", body: "Nova venda confirmada!" });
    return Response.json({ ok: true, sent });
  } catch (e) {
    console.log("[webhook] erro", e);
    return Response.json({ ok: false, error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}

export const POST = handle;
export const GET = handle;
export const PUT = handle;
