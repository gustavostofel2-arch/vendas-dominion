import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dominion",
  description: "Notificações de vendas Dominion",
  icons: { icon: "/icon-192.png", apple: "/icon-180.png" },
  appleWebApp: { capable: true, title: "Dominion", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
