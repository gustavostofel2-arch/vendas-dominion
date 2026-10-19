# Vendas Dominion

PWA que envia push no iPhone a cada venda da Gestlink.

## Deploy (Vercel)
1. Suba este repositório e importe na Vercel.
2. Vercel → Storage → **Upstash Redis** (grátis) → conectar ao projeto (preenche `KV_REST_API_URL/TOKEN`).
3. Em Environment Variables, copie os valores do `.env.local`: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `WEBHOOK_SECRET`.
4. Redeploy.

## iPhone
Safari → abrir o site → Compartilhar → Adicionar à Tela de Início → abrir pelo ícone → **Ativar notificações** → **Enviar teste**.

## Gestlink
Webhook de venda aprovada apontando para:
`https://SEU-DOMINIO.vercel.app/api/webhook?token=WEBHOOK_SECRET`
