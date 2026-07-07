"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateSessionId } from "@/app/utils/session";
import {
  Activity,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
} from "lucide-react";

interface DBAuditLog {
  id: number;
  timestamp: string;
  action: string;
  target_component: string;
  duration: string;
  status: string;
  session_id: string;
}

export default function HistoryLogPage() {
  // Synchronized with query invalidations from the studio workspace
  const {
    data: logs,
    isLoading,
    refetch,
    isRefetching,
    error,
  } = useQuery<DBAuditLog[]>({
    queryKey: ["logs"],
    queryFn: async () => {
      // FIX: Added the critical session header so it queries your active automated telemetry pool
      const response = await fetch("/api/logs", {
        headers: {
          "X-Session-ID": getOrCreateSessionId(),
        },
      });
      if (!response.ok)
        throw new Error("Could not poll Supabase audit metric parameters.");
      return response.json();
    },
  });

  // Helper helper to render high-fidelity status pill markers
  const renderStatusBadge = (status: string) => {
    const normalized = status.toUpperCase();

    switch (normalized) {
      case "SUCCESS":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            SUCCESS
          </span>
        );
      case "ERROR":
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
            <XCircle className="h-3.5 w-3.5" />
            ERROR
          </span>
        );
      case "WARNING":
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3.5 w-3.5" />
            WARNING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-gray-500/10 text-gray-400 border border-gray-500/20">
            <Clock className="h-3.5 w-3.5" />
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-blue-500" />
            Operational Audit History
          </h1>
          <p className="text-gray-400 mt-2">
            Review background MCP server handshakes and automated generative
            pipeline logs across live isolated developer profiles.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="bg-[#151B2C] border border-gray-800 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition hover:bg-gray-800 disabled:opacity-50 shrink-0"
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Metrics
        </button>
      </div>

      {isLoading ? (
        <div className="bg-[#151B2C] border border-gray-800 h-64 rounded-2xl animate-pulse" />
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-5 rounded-2xl text-sm font-mono">
          Telemetry Pipeline Link Error: {(error as Error).message}
        </div>
      ) : (
        <div className="bg-[#151B2C] border border-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-300 raw-table">
              <thead className="bg-[#0E1321] text-xs font-semibold uppercase text-gray-400 border-b border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-mono w-24">Log ID</th>
                  <th className="px-6 py-4">Timestamp (UTC)</th>
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
                    className="hover:bg-gray-800/20 transition duration-150 group"
                  >
                    <td className="px-6 py-4 font-mono text-xs text-gray-500 group-hover:text-gray-400 transition">
                      #{log.id}
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs">
                      {log.timestamp}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-mono text-xs font-semibold text-gray-200 bg-[#0B0F19]/60 px-2.5 py-1.5 rounded-lg border border-gray-800/50 w-fit">
                        <Terminal className="h-3.5 w-3.5 text-blue-400/80" />
                        {log.action}
                      </div>
                    </td>
                    <td
                      className="px-6 py-4 font-mono text-xs text-blue-400 max-w-xs truncate"
                      title={log.target_component}
                    >
                      {log.target_component}
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-300">
                      {log.duration}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {renderStatusBadge(log.status)}
                    </td>
                  </tr>
                ))}

                {logs?.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-gray-500 italic text-sm"
                    >
                      <Activity className="h-8 w-8 text-gray-700 mx-auto mb-3" />
                      Telemetry log register is currently empty for this user
                      session token.
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
