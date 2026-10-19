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
  const subject = process.env.VAPID_SUBJECT;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
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
