import type { Metadata } from "next";
import "./globals.css";
import OpenChatWidget from "@/components/OpenChatWidget";

export const metadata: Metadata = {
  title: "CyberCanvas Services",
  description:
    "Plateforme cloud pour vendre et gerer des tickets WiFi MikroTik.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
        <OpenChatWidget />
      </body>
    </html>
  );
}

