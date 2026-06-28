"use client";

import React, { useState } from "react";

interface ComponentEntry {
  id: string;
  name: string;
  lastUpdated: string;
  status: "SYNCED" | "PENDING" | "ERROR";
}

const MOCK_COMPONENTS: ComponentEntry[] = [
  {
    id: "comp-001",
    name: "Premium SaaS Pricing Card",
    lastUpdated: "2 mins ago",
    status: "SYNCED",
  },
  {
    id: "comp-002",
    name: "Secure Registration Form",
    lastUpdated: "1 hour ago",
    status: "SYNCED",
  },
  {
    id: "comp-003",
    name: "Analytics Dashboard Widget",
    lastUpdated: "5 hours ago",
    status: "PENDING",
  },
];

export default function DashboardPage() {
  const [components] = useState<ComponentEntry[]>(MOCK_COMPONENTS);

  return (
    <div className="p-4 sm:p-6 md:p-8 pb-16 space-y-8 w-full max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          System Overview
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Monitor your synced UI components and database synchronization status.
        </p>
      </div>

      {/* Grid of Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {components.map((comp) => (
          <div
            key={comp.id}
            className="bg-[#0e1322] border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between h-40 hover:border-slate-600 transition-all"
          >
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {comp.id}
                </span>
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                    comp.status === "SYNCED"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {comp.status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-3">{comp.name}</h3>
            </div>

            <div className="flex items-center justify-between mt-4">
              <span className="text-[10px] text-slate-500">
                Updated {comp.lastUpdated}
              </span>
              <a
                href={`/workspace?id=${comp.id}`}
                className="bg-slate-900 hover:bg-indigo-600 border border-slate-800 hover:border-indigo-500 text-slate-300 hover:text-white text-[11px] px-3 py-1.5 rounded-lg font-bold transition-all"
              >
                Edit
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Block */}
      <div className="bg-linear-to-r from-indigo-900/20 to-slate-900/20 border border-indigo-500/20 rounded-2xl p-6 flex items-center justify-between">
        <div>
          <h4 className="text-sm font-bold text-white">
            Need a new component?
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            Start a fresh generation from a Figma node.
          </p>
        </div>
        <a
          href="/workspace"
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
        >
          Open Workspace
        </a>
      </div>
    </div>
  );
}
