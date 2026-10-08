import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Denguinhos | Vigilância e alerta precoce",
  description: "Plataforma de monitoramento territorial, Saúde Única e alerta antecipado de arboviroses.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
