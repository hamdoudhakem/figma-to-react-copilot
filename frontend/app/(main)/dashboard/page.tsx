"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateSessionId } from "@/app/utils/session";
import {
  Cpu,
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Server,
  RefreshCw,
  Loader2,
} from "lucide-react";

interface SystemStats {
  ollamaStatus: "ONLINE" | "OFFLINE";
  modelName: string;
  totalGenerations: number;
  successCount: number;
  failedCount: number;
  cancelledCount: number;
  avgDurationSec: number;
  activeSessionId: string;
  recentLogs: Array<{
    id: number;
    action: string;
    target_component: string;
    duration: string;
    status: string;
    timestamp: string;
  }>;
}

export default function AnalyticsDashboardPage() {
  const {
    data: stats,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery<SystemStats>({
    queryKey: ["systemAnalytics"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/stats", {
        headers: {
          "X-Session-ID": getOrCreateSessionId(),
        },
      });
      if (!response.ok)
        throw new Error("Failed to pull system operational matrix metrics.");
      return response.json();
    },
    refetchInterval: 15000, // Automagically refetches every 15s to monitor Ollama logs
  });

  return (
    <div className="space-y-8 relative min-h-full text-white">
      {/* Top Header Layer */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            System Control Panel
          </h1>
          <p className="text-gray-400 mt-2">
            Monitor model connection logs, generation latency loops, and
            Supabase ledger telemetry.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="bg-[#151B2C] border border-gray-800 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition hover:bg-gray-800 disabled:opacity-50"
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Sync Server Metrics
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="bg-[#151B2C] border border-gray-800 h-28 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-5 rounded-2xl text-sm font-mono">
          System Metrics Link Broken: {(error as Error).message}
        </div>
      ) : (
        <>
          {/* 📡 ROW 1: CORE INFRASTRUCTURE & INFRA STATUS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Ollama Instance Card */}
            <div className="bg-[#151B2C] border border-gray-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <span className="text-xs font-mono text-gray-400 block">
                  Ollama Node Host
                </span>
                <span className="text-sm font-semibold block font-mono">
                  127.0.0.1:11434
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-mono mt-2 px-2 py-0.5 rounded-md border ${
                    stats?.ollamaStatus === "ONLINE"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border-red-500/20"
                  }`}
                >
                  <Server className="h-3 w-3" />
                  {stats?.ollamaStatus}
                </span>
              </div>
              <div className="p-3 bg-[#0B0F19] border border-gray-800 rounded-xl text-blue-400">
                <Activity className="h-5 w-5" />
              </div>
            </div>

            {/* Quantized LLM Loaded */}
            <div className="bg-[#151B2C] border border-gray-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div className="space-y-1 max-w-[70%]">
                <span className="text-xs font-mono text-gray-400 block">
                  Target Architecture
                </span>
                <h3
                  className="text-base font-bold font-mono truncate tracking-tight text-blue-400"
                  title={stats?.modelName}
                >
                  {stats?.modelName || "None Loaded"}
                </h3>
                <span className="text-[10px] text-gray-500 block font-mono mt-1">
                  Temperature Lock: 0.1
                </span>
              </div>
              <div className="p-3 bg-[#0B0F19] border border-gray-800 rounded-xl text-purple-400">
                <Cpu className="h-5 w-5" />
              </div>
            </div>

            {/* Average Comp Latency Loop */}
            <div className="bg-[#151B2C] border border-gray-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <span className="text-xs font-mono text-gray-400 block">
                  Avg Render Latency
                </span>
                <h3 className="text-2xl font-bold font-mono text-white">
                  {stats?.avgDurationSec.toFixed(2)}s
                </h3>
                <span className="text-[10px] text-gray-500 block font-mono">
                  Tokens streaming calculation loop
                </span>
              </div>
              <div className="p-3 bg-[#0B0F19] border border-gray-800 rounded-xl text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>

            {/* Total Telemetry Records */}
            <div className="bg-[#151B2C] border border-gray-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <span className="text-xs font-mono text-gray-400 block">
                  Active Workspace Pipeline
                </span>
                <h3 className="text-2xl font-bold font-mono text-white">
                  {stats?.totalGenerations} Runs
                </h3>
                <span className="text-[10px] text-emerald-400 font-mono truncate block max-w-[150px]">
                  ID: {stats?.activeSessionId}
                </span>
              </div>
              <div className="p-3 bg-[#0B0F19] border border-gray-800 rounded-xl text-emerald-400">
                <Layers className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* 📊 ROW 2: GENERATION SUCCESS RATIOS */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-[#151B2C] border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center text-center shadow-xl space-y-4">
              <h3 className="text-sm font-medium font-mono text-gray-400 tracking-wide w-full text-left">
                Pipeline Health Summary
              </h3>
              <div className="relative flex items-center justify-center">
                {/* Visual calculation fallback ratio metrics */}
                <div className="text-4xl font-extrabold font-mono text-white">
                  {stats && stats.totalGenerations > 0
                    ? (
                        (stats.successCount / stats.totalGenerations) *
                        100
                      ).toFixed(0)
                    : 0}
                  %
                </div>
              </div>
              <p className="text-xs font-mono text-gray-500">
                Compiles completed successfully without compilation syntax crash
                blocks.
              </p>
            </div>

            {/* Status Split Columns */}
            <div className="lg:col-span-2 bg-[#151B2C] border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
              <h3 className="text-sm font-medium font-mono text-gray-400 tracking-wide">
                Compilation States Manifest
              </h3>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="bg-[#0B0F19] border border-gray-800/80 p-4 rounded-xl text-center space-y-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 mx-auto" />
                  <span className="text-xs font-mono text-gray-400 block pt-1">
                    Synced Assets
                  </span>
                  <div className="text-lg font-bold font-mono text-white">
                    {stats?.successCount}
                  </div>
                </div>
                <div className="bg-[#0B0F19] border border-gray-800/80 p-4 rounded-xl text-center space-y-1">
                  <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                  <span className="text-xs font-mono text-gray-400 block pt-1">
                    System Errors
                  </span>
                  <div className="text-lg font-bold font-mono text-white">
                    {stats?.failedCount}
                  </div>
                </div>
                <div className="bg-[#0B0F19] border border-gray-800/80 p-4 rounded-xl text-center space-y-1">
                  <Clock className="h-5 w-5 text-gray-400 mx-auto" />
                  <span className="text-xs font-mono text-gray-400 block pt-1">
                    User Aborted
                  </span>
                  <div className="text-lg font-bold font-mono text-white">
                    {stats?.cancelledCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 📃 ROW 3: RECENT AUDIT LEDGER TRANSACTION TAIL */}
          <div className="bg-[#151B2C] border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800/80">
              <h3 className="text-sm font-medium font-mono text-gray-400 tracking-wide">
                Real-time Telemetry Logs Stream
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs font-mono">
                <thead>
                  <tr className="bg-[#0B0F19] border-b border-gray-800 text-gray-400">
                    <th className="p-4 font-semibold">Timestamp</th>
                    <th className="p-4 font-semibold">Action Engine Route</th>
                    <th className="p-4 font-semibold">
                      Figma Isolated Frame Target
                    </th>
                    <th className="p-4 font-semibold">Streaming Latency</th>
                    <th className="p-4 font-semibold">Audit State Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-gray-300">
                  {stats?.recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#0E1322] transition">
                      <td className="p-4 text-gray-500 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="p-4 font-medium text-blue-400">
                        {log.action}
                      </td>
                      <td className="p-4 truncate max-w-[180px]">
                        {log.target_component}
                      </td>
                      <td className="p-4 text-amber-400">{log.duration}</td>
                      <td className="p-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === "SUCCESS"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : log.status === "ERROR"
                                ? "bg-red-500/10 text-red-400 border border-red-500/20"
                                : "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                          }`}
                        >
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {stats?.recentLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-gray-500">
                        Operational database pipeline table logs are completely
                        empty.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
