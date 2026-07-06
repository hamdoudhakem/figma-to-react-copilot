"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Terminal, Activity } from "lucide-react";

export default function MainInterfaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const links = [
    { href: "/generate", label: "Copilot Canvas", icon: Terminal },
    {
      href: "/dashboard",
      label: "Components Workspace",
      icon: LayoutDashboard,
    },
    { href: "/history", label: "Operational Logs", icon: Activity },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Structural Navigation Panel Sidebar */}
      <aside className="w-64 bg-[#121826] border-r border-gray-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-10">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
              F
            </div>
            <span className="font-semibold text-lg tracking-wide">
              FigmaCopilot
            </span>
          </div>

          <nav className="space-y-2">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 font-medium border border-blue-500/20"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="text-xs text-gray-500 border-t border-gray-800 pt-4">
          Environment: Live Supabase Pipeline
        </div>
      </aside>

      {/* Primary Context Window */}
      <main className="flex-1 p-10 overflow-y-auto bg-[#0B0F19]">
        {children}
      </main>
    </div>
  );
}
