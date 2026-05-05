import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Assinaturas",
  description: "Gerador de assinaturas de email",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
