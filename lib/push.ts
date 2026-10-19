import webpush from "web-push";
import { Redis } from "@upstash/redis";

const KEY = "push:subscriptions";

function redis() {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error("Redis não configurado (KV_REST_API_URL / KV_REST_API_TOKEN)");
  return new Redis({ url, token });
}

export async function saveSubscription(sub: webpush.PushSubscription) {
  await redis().hset(KEY, { [sub.endpoint]: JSON.stringify(sub) });
}

export async function sendToAll(payload: { title: string; body: string; tag?: string }) {
  const rawSubject = process.env.VAPID_SUBJECT?.trim();
  const subject = rawSubject && !/^(mailto:|https?:)/.test(rawSubject) ? `mailto:${rawSubject}` : rawSubject;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const priv = process.env.VAPID_PRIVATE_KEY?.trim();
  if (!subject || !pub || !priv) throw new Error("VAPID não configurado");
  webpush.setVapidDetails(subject, pub, priv);

  const r = redis();
  const all = (await r.hgetall<Record<string, unknown>>(KEY)) ?? {};
  let sent = 0;
  await Promise.all(
    Object.entries(all).map(async ([endpoint, raw]) => {
      const sub = (typeof raw === "string" ? JSON.parse(raw) : raw) as webpush.PushSubscription;
      try {
        await webpush.sendNotification(sub, JSON.stringify(payload), { TTL: 3600, urgency: "high" });
        sent++;
      } catch (err) {
        const code = (err as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await r.hdel(KEY, endpoint);
      }
    })
  );
  return sent;
}

// Retorna true se esta chave ainda não foi usada nos últimos `ttl` segundos (e já a reserva).
export async function claim(key: string, ttl: number) {
  const res = await redis().set(`claim:${key}`, "1", { nx: true, ex: ttl });
  return res === "OK";
}

export async function clearSubscriptions() {
  await redis().del(KEY);
}
