"use client";

import React, { useState } from "react";

interface LogEntry {
  id: string;
  timestamp: string;
  action: string;
  targetComponent: string;
  duration: string;
  status: "SUCCESS" | "WARNING" | "ERROR";
}

const INITIAL_LOGS: LogEntry[] = [
  {
    id: "L1",
    timestamp: "17:42:11",
    action: "AST Vector Extraction",
    targetComponent: "SaaS Pricing Card",
    duration: "420ms",
    status: "SUCCESS",
  },
  {
    id: "L2",
    timestamp: "17:42:13",
    action: "LLM Code Generation",
    targetComponent: "SaaS Pricing Card",
    duration: "2180ms",
    status: "SUCCESS",
  },
  {
    id: "L3",
    timestamp: "11:15:00",
    action: "Tailwind Compilation Check",
    targetComponent: "Secure Registration Form",
    duration: "890ms",
    status: "WARNING",
  },
];

export default function HistoryPage() {
  const [logs] = useState<LogEntry[]>(INITIAL_LOGS);

  return (
    <div className="p-4 sm:p-6 md:p-8 pb-16 space-y-6 w-full max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          System Logs & Audit
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Real-time compilation events tracking and local parser audits.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#0e1322] border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-400">
          Engine Calls: <strong className="text-white">142</strong>
        </div>
        <div className="bg-[#0e1322] border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-400">
          LLM Tokens: <strong className="text-indigo-400">248K</strong>
        </div>
        <div className="bg-[#0e1322] border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-400">
          Prisma Success Rate:{" "}
          <strong className="text-emerald-400">98.4%</strong>
        </div>
      </div>

      <div className="bg-[#0e1322] border border-slate-800/80 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[10px] uppercase text-slate-500 tracking-wider bg-slate-950/20">
                <th className="p-4">Timestamp</th>
                <th className="p-4">Pipeline Action</th>
                <th className="p-4">Target Component</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-900/10">
                  <td className="p-4 font-mono text-slate-500">
                    {log.timestamp}
                  </td>
                  <td className="p-4 font-semibold text-slate-200">
                    {log.action}
                  </td>
                  <td className="p-4 text-slate-400">{log.targetComponent}</td>
                  <td className="p-4 font-mono text-slate-400">
                    {log.duration}
                  </td>
                  <td className="p-4 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.status === "SUCCESS" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}
                    >
                      {log.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
