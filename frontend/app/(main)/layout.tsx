"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Terminal,
  FolderHeart,
  History,
  Cpu,
} from "lucide-react";

export default function MainSharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Navigation Items matching your core operational layout pages
  const navigationItems = [
    {
      name: "Analytics Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      // description: "Ollama telemetry & server logs",
    },
    {
      name: "AI Studio Workspace",
      href: "/workspace",
      icon: Terminal,
      // description: "Figma engine compilation workspace",
    },
    {
      name: "Component Library",
      href: "/library", // Your custom 'previous_codes' route folder name
      icon: FolderHeart,
      // description: "Saved structural database snapshots",
    },
    {
      name: "Audit History Logs",
      href: "/history",
      icon: History,
      // description: "Database operational tracking rows",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-gray-100 antialiased">
      {/* 🧭 FIXED LEFT SIDEBAR PANEL NAVIGATION */}
      <aside className="w-72 bg-[#151B2C] border-r border-gray-800 flex flex-col justify-between shrink-0 sticky top-0 h-screen z-40">
        <div className="flex flex-col flex-1 pt-6 overflow-y-auto">
          {/* Header Brand Layer */}
          <div className="px-6 pb-6 border-b border-gray-800/60 flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Cpu className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide uppercase">
                Copilot Suite
              </h2>
              <span className="text-[10px] font-mono text-gray-500 block">
                v4.0.0 • Local Mesh
              </span>
            </div>
          </div>

          {/* Navigation Matrix Link Group */}
          <nav className="flex-1 px-4 py-6 space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const IconComponent = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-start gap-3.5 px-4 py-3 rounded-xl transition duration-150 border ${
                    isActive
                      ? "bg-blue-600 border-blue-500/30 text-white shadow-xl shadow-blue-950/30"
                      : "border-transparent text-gray-400 hover:text-white hover:bg-[#0B0F19] hover:border-gray-800/80"
                  }`}
                >
                  <IconComponent
                    className={`h-5 w-5 mt-0.5 shrink-0 ${
                      isActive
                        ? "text-white"
                        : "text-gray-500 group-hover:text-blue-400 transition"
                    }`}
                  />
                  <div className="space-y-0.5">
                    <span className="text-sm font-medium block tracking-wide">
                      {item.name}
                    </span>
                    <span
                      className={`text-[10px] font-mono block ${
                        isActive
                          ? "text-blue-200"
                          : "text-gray-500 group-hover:text-gray-400"
                      }`}
                    >
                      {item.description}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Infrastructure Status Panel Footer */}
        <div className="p-4 border-t border-gray-800/60 bg-[#0B0F19]/40">
          <div className="bg-[#0B0F19] border border-gray-800 rounded-xl p-3 flex items-center gap-2.5">
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-mono font-medium text-gray-300 truncate">
                Ollama Engine Stack
              </p>
              <span className="text-[9px] font-mono text-gray-500 block truncate">
                Operational Runtime
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* 🖥️ DYNAMIC CONTENT VIEW LAYER PORT */}
      <main className="flex-1 min-w-0 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto w-full h-full">{children}</div>
      </main>
    </div>
  );
}
