"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, FolderHeart, History } from "lucide-react";

export default function MainDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const navigationItems = [
    {
      name: "AI Component Studio",
      href: "/generate",
      icon: Sparkles,
    },
    {
      name: "Component Library",
      href: "/dashboard",
      icon: FolderHeart,
    },
    {
      name: "Generation History",
      href: "/history", // Points back to your history logs route
      icon: History,
    },
  ];

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-gray-100">
      {/* Permanent Sidebar Workspace Navigation */}
      <aside className="w-64 bg-[#151B2C] border-r border-gray-800 p-6 flex flex-col justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
              Ω
            </div>
            <span className="font-semibold text-sm tracking-wide text-white">
              Copilot Engine v4
            </span>
          </div>

          <nav className="space-y-1.5">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition duration-150 ${
                    isActive
                      ? "bg-blue-600/10 text-blue-400 border border-blue-500/20"
                      : "text-gray-400 hover:bg-gray-800/50 hover:text-gray-200 border border-transparent"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="text-[10px] font-mono text-gray-600 border-t border-gray-800 pt-4">
          Status: Operational Engine
        </div>
      </aside>

      {/* Main Stream Canvas Content Panel */}
      <main className="flex-1 p-10 overflow-y-auto">{children}</main>
    </div>
  );
}
