import React from "react";
import "./globals.css";

export const metadata = {
  title: "Figma to React Copilot | Dashboard",
  description:
    "Transformez vos architectures de composants Figma en code React propre via IA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark scroll-smooth">
      <body
        className="bg-[#0b0f19] text-slate-100 min-h-screen antialiased selection:bg-indigo-500/30 selection:text-indigo-200"
        style={{
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
