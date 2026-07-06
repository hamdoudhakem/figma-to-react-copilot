"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Code, ExternalLink, RefreshCw, Layers } from "lucide-react";

interface DBComponent {
  id: string;
  name: string;
  figma_url: string;
  generated_code: string | null;
  status: string;
  last_updated: string;
}

export default function DashboardPage() {
  // TanStack Query abstracting remote state lifecycles
  const {
    data: components,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery<DBComponent[]>({
    queryKey: ["components-registry"],
    queryFn: async () => {
      const response = await fetch("/api/components");
      if (!response.ok)
        throw new Error("Failed to retrieve Supabase component sync records.");
      return response.json();
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Components Registry
          </h1>
          <p className="text-gray-400 mt-2">
            Monitor live structural snapshots saved to your Supabase cloud
            database instance.
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
          Force Sync Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="bg-[#151B2C] border border-gray-800 h-48 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-5 rounded-2xl text-sm">
          Failed to load remote schema parameters matrix:{" "}
          {(error as Error).message}
        </div>
      ) : components?.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-2xl p-16 text-center space-y-4">
          <Layers className="h-10 w-10 text-gray-600 mx-auto" />
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            No code outputs stored in Supabase yet. Navigate to the Copilot
            Canvas to trigger your first automation run.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components?.map((comp) => (
            <div
              key={comp.id}
              className="bg-[#151B2C] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition duration-200"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-blue-500/10 text-blue-400 font-semibold px-2.5 py-1 rounded-lg border border-blue-500/10">
                    {comp.status}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">
                    {comp.id}
                  </span>
                </div>
                <div>
                  <h3 className="text-white font-medium text-base tracking-wide">
                    {comp.name}
                  </h3>
                  <p className="text-gray-500 text-xs mt-1">
                    Updated: {comp.last_updated}
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800/60 flex items-center gap-3">
                <Link
                  href={`/components/${comp.id}`}
                  className="flex-1 bg-gray-800/80 hover:bg-gray-800 text-gray-200 font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <Code className="h-3.5 w-3.5" />
                  Inspect Source
                </Link>
                <a
                  href={comp.figma_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0B0F19] border border-gray-700 text-gray-400 hover:text-gray-200 p-2.5 rounded-xl transition"
                  title="Open Source Figma Blueprint Link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
