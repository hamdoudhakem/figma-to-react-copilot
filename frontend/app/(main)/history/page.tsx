"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, RefreshCw } from "lucide-react";

interface DBAuditLog {
  id: number;
  timestamp: string;
  action: string;
  target_component: string;
  duration: string;
  status: string;
}

export default function HistoryLogPage() {
  const {
    data: logs,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<DBAuditLog[]>({
    queryKey: ["telemetry-audit-logs"],
    queryFn: async () => {
      const response = await fetch("/api/logs");
      if (!response.ok)
        throw new Error("Could not poll Supabase audit metric parameters.");
      return response.json();
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Operational Audit History
          </h1>
          <p className="text-gray-400 mt-2">
            Review background MCP server handshakes and LLM streaming connection
            profiles.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="bg-[#151B2C] border border-gray-800 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Refresh Metrics
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#151B2C] border border-gray-800 h-64 rounded-2xl animate-pulse" />
      ) : (
        <div className="bg-[#151B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300">
              <thead className="bg-[#0E1321] text-xs font-semibold uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-mono">Log ID</th>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Action Pipeline</th>
                  <th className="px-6 py-4">Figma Reference Node</th>
                  <th className="px-6 py-4">Execution Duration</th>
                  <th className="px-6 py-4 text-right">Pipeline Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {logs?.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-800/20 transition duration-150"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      #{log.id}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-200">
                      {log.action}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-400">
                      {log.target_component}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-300">
                      {log.duration}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                          log.status === "SUCCESS"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/10"
                            : "bg-red-500/10 text-red-400 border-red-500/10"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {logs?.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500 italic text-sm"
                    >
                      Telemetry log register is currently empty.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
