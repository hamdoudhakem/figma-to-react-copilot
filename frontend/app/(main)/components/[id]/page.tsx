"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import LiveCanvasView from "@/app/(main)/components/LiveCanvasView";
import { getOrCreateSessionId } from "@/app/utils/session";
import { ArrowLeft, Loader2, Database, ExternalLink } from "lucide-react";
import Link from "next/link";

interface DBComponent {
  id: string;
  name: string;
  figma_url: string;
  generated_code: string | null;
  status: string;
  last_updated: string;
}

export default function ComponentInspectionPage() {
  const { id } = useParams();
  const router = useRouter();

  // Optimized React Query hook targeting individual entity schemas
  const {
    data: component,
    isLoading,
    error,
  } = useQuery<DBComponent>({
    queryKey: ["component-entity", id],
    queryFn: async () => {
      // Fetches the snapshot dataset directly from your components API list
      const response = await fetch("/api/components", {
        headers: { "X-Session-ID": getOrCreateSessionId() },
      });
      if (!response.ok) throw new Error("Network query context failed.");

      const list: DBComponent[] = await response.json();
      const entity = list.find((item) => item.id === id);

      if (!entity)
        throw new Error(
          "Requested component was not found in this runtime environment branch.",
        );
      return entity;
    },
  });

  if (isLoading) {
    return (
      <div className="h-[60vh] w-full flex flex-col items-center justify-center gap-3 text-gray-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="text-xs font-mono">Querying Postgres Matrix...</span>
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="space-y-4 max-w-md mx-auto mt-12 text-center">
        <div className="bg-red-950/20 border border-red-900/40 p-4 rounded-xl text-sm font-mono text-red-400">
          Error: {error ? (error as Error).message : "Component missing."}
        </div>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-blue-400 hover:underline flex items-center gap-1 mx-auto"
        >
          <ArrowLeft className="h-3 w-3" /> Return to Library
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      {/* Dynamic Header Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2.5 bg-[#151B2C] border border-gray-800 hover:border-gray-700 rounded-xl text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                {component.name}
              </h1>
              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                {component.status}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-1">
              Record ID: {component.id} • Sync: {component.last_updated}
            </p>
          </div>
        </div>

        <a
          href={component.figma_url}
          target="_blank"
          rel="noreferrer"
          className="bg-[#151B2C] border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-xs font-medium flex items-center gap-2 transition self-start sm:self-auto"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          View Figma Blueprint
        </a>
      </div>

      {/* Main Canvas Presentation View Layout */}
      <div className="flex-1 min-h-[450px]">
        <LiveCanvasView code={component.generated_code} />
      </div>
    </div>
  );
}
