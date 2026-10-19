"use client";

import { useEffect, useState } from "react";

const VAPID = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

type State = "loading" | "unsupported" | "needs-install" | "idle" | "active" | "denied";

export default function Home() {
  const [state, setState] = useState<State>("loading");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
      if (isIOS && !standalone) return setState("needs-install");
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) return setState("unsupported");
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.register("/sw.js");
      const sub = await reg.pushManager.getSubscription();
      setState(sub && Notification.permission === "granted" ? "active" : "idle");
    })().catch(() => setState("unsupported"));
  }, []);

  async function activate() {
    setBusy(true);
    setMsg("");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState("denied");
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID),
        }));
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub),
      });
      if (!res.ok) throw new Error("Falha ao salvar");
      setState("active");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erro ao ativar");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setMsg("");
    try {
      const res = await fetch("/api/test", { method: "POST" });
      setMsg(res.ok ? "Teste enviado" : "Falha ao enviar teste");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="logo" src="/icon.png" alt="Dominion" />
      <h1>Vendas Dominion</h1>

      {state === "loading" && <p>Carregando…</p>}
      {state === "needs-install" && (
        <p>
          No iPhone: toque em Compartilhar → “Adicionar à Tela de Início”, abra o app pela tela de início e ative as
          notificações aqui.
        </p>
      )}
      {state === "unsupported" && <p>Este navegador não suporta notificações push.</p>}
      {state === "denied" && (
        <p>Notificações bloqueadas. Ative em Ajustes do iPhone → Notificações → Dominion.</p>
      )}
      {state === "idle" && (
        <>
          <p>Ative para ser avisado a cada nova venda.</p>
          <button onClick={activate} disabled={busy}>Ativar notificações</button>
        </>
      )}
      {state === "active" && (
        <>
          <p className="ok">Notificações ativas ✓</p>
          <button onClick={test} disabled={busy}>Enviar teste</button>
        </>
      )}
      <div className="status">{msg}</div>
    </main>
  );
}
