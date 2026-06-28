"use client";

import React, { useState } from "react";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

export default function MainSharedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavigationItem[] = [
    {
      name: "Dashboard Overview",
      href: "/dashboard",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
          />
        </svg>
      ),
    },
    {
      name: "Live Generator",
      href: "/workspace",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
          />
        </svg>
      ),
    },
    {
      name: "Virtualized Logs",
      href: "/history",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      name: "DB Configurations",
      href: "/settings",
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0b0f19] text-slate-100">
      {/* DESKTOP SIDEBAR PANEL */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0e1322] border-r border-slate-800/80 shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-slate-800/60 gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <span className="text-white text-md font-bold">F₂R</span>
          </div>
          <span className="font-extrabold text-sm text-white">
            Copilot Suite
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition-all duration-200"
            >
              {item.icon}
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>

      {/* CORE WORKSPACE viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* UPPER NAVIGATION BAR */}
        <header className="h-16 border-b border-slate-800/60 bg-[#0e1322]/40 backdrop-blur-md flex items-center justify-between px-4 sm:px-6 md:px-8 shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
            aria-label="Toggle Menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <span className="text-xs font-semibold text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
            Next.js Route Group Active
          </span>
        </header>

        {/* COMPACT DROP-DOWN NAVIGATION MENU FOR PHONE SCREENVIEWS */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0e1322] border-b border-slate-800/80 p-4 space-y-1.5">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800/40"
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            ))}
          </div>
        )}

        {/* ACTIVE CHILD CONTENT VIEWPORT INJECTION */}
        <main className="flex-1 overflow-y-auto bg-[#0b0f19]">{children}</main>
      </div>
    </div>
  );
}
