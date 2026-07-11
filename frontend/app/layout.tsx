import type { Metadata } from "next";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Figma React Copilot Suite",
  description:
    "Automated production component rendering engine via MCP Protocol",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="bg-[#0B0F19] text-gray-100 antialiased min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
