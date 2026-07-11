"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getOrCreateSessionId } from "@/app/utils/session";
import LiveCanvasView from "@/components/LiveCanvasView";
import {
  Code,
  ExternalLink,
  RefreshCw,
  Layers,
  Loader2,
  CalendarClock,
  Eye,
  Terminal,
  X,
  Check,
  Copy,
  MessageSquareCode,
} from "lucide-react";

interface DBComponent {
  id: string;
  name: string;
  figma_url: string;
  generated_code: string | null;
  user_prompt: string | null;
  status: string;
  session_id: string;
  last_updated: string;
}

export default function ComponentLibraryPage() {
  const [selectedComponent, setSelectedComponent] =
    useState<DBComponent | null>(null);
  const [viewerTab, setViewerTab] = useState<"preview" | "code" | "prompt">(
    "preview",
  ); // Extended tab states
  const [copied, setCopied] = useState(false);

  // Synchronized query key layer for Supabase automation tracking runs
  const {
    data: components,
    isLoading,
    isRefetching,
    refetch,
    error,
  } = useQuery<DBComponent[]>({
    queryKey: ["components"],
    queryFn: async () => {
      const response = await fetch("/api/components", {
        headers: {
          "X-Session-ID": getOrCreateSessionId(),
        },
      });
      if (!response.ok) {
        throw new Error(
          "Failed to sync library snapshot index layers from Supabase.",
        );
      }
      return response.json();
    },
  });

  // Prevents "Compilation Runtime Blocked" by cleaning raw markdown syntax boundaries
  const cleanMarkdownWrappers = (rawCode: string | null) => {
    if (!rawCode || rawCode.trim() === "") {
      return `export default function App() {\n  return (\n    <div className="p-6 text-center text-gray-500 font-mono text-xs">\n      ⚠️ No structural component source code found.\n    </div>\n  );\n}`;
    }
    let clean = rawCode.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(jsx|tsx|html|javascript|typescript)?\n/, "");
    }
    if (clean.endsWith("```")) {
      clean = clean.replace(/```$/, "");
    }
    return clean;
  };

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (selectedComponent) {
    console.log(selectedComponent.user_prompt);
  } else {
    console.log("Selected component is null");
  }

  return (
    <div className="space-y-8 relative min-h-full">
      {/* View Header Block */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Component Library
          </h1>
          <p className="text-gray-400 mt-2">
            Monitor live structural snapshots saved to your Supabase cloud
            database instance.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="bg-[#151B2C] border border-gray-800 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition hover:bg-gray-800 disabled:opacity-50 shrink-0"
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh Library
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className="bg-[#151B2C] border border-gray-800 h-64 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-950/20 border border-red-900/40 text-red-400 p-5 rounded-2xl text-sm font-mono">
          Failed to load remote schema parameters matrix:{" "}
          {(error as Error).message}
        </div>
      ) : components?.length === 0 ? (
        <div className="border border-dashed border-gray-800 rounded-2xl p-16 text-center space-y-4">
          <Layers className="h-10 w-10 text-gray-600 mx-auto" />
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            No code outputs stored in this session layer yet. Navigate to the AI
            Studio Workspace to trigger your first automation run.
          </p>
        </div>
      ) : (
        /* Component Presentation Grid Elements */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {components?.map((comp) => (
            <div
              key={comp.id}
              className="bg-[#151B2C] border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition duration-200 shadow-xl group relative"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  {comp.session_id === "PORTFOLIO_SEED" ? (
                    <span className="text-[10px] font-mono font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      Master Showcase
                    </span>
                  ) : (
                    <span className="text-xs bg-blue-500/10 text-blue-400 font-semibold px-2.5 py-1 rounded-lg border border-blue-500/10">
                      {comp.status}
                    </span>
                  )}
                  <span className="text-[11px] font-mono text-gray-600 group-hover:text-gray-400 truncate">
                    {comp.id}
                  </span>
                </div>

                <div>
                  <h3 className="text-white font-medium text-base tracking-wide truncate">
                    {comp.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1.5 font-mono">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Updated: {comp.last_updated}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800/60 flex items-center gap-3">
                <button
                  onClick={() => {
                    setSelectedComponent(comp);
                    setViewerTab("preview");
                  }}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/20"
                >
                  <Code className="h-3.5 w-3.5" />
                  Inspect & Preview
                </button>
                <a
                  href={comp.figma_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#0B0F19] border border-gray-700 text-gray-400 hover:text-white p-2.5 rounded-xl transition hover:bg-gray-800"
                  title="Open Source Figma Blueprint Link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SLIDE-DRAWER WORKSPACE PANEL */}
      {selectedComponent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end transition duration-300">
          <div className="w-full max-w-4xl bg-[#0B0F19] border-l border-gray-800 h-full flex flex-col shadow-2xl p-6 space-y-4 animate-in slide-in-from-right duration-200">
            {/* Header Block Actions */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {selectedComponent.name}
                </h2>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  ID: {selectedComponent.id}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={selectedComponent.figma_url}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#151B2C] border border-gray-800 text-gray-300 hover:text-white px-3.5 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5 transition hover:bg-gray-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Figma Node
                </a>
                <button
                  onClick={() => setSelectedComponent(null)}
                  className="text-gray-400 hover:text-white bg-gray-800/50 p-2 rounded-xl border border-gray-700/50 transition"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Workspace Operations View Toggle Toolbar */}
            <div className="flex items-center justify-between bg-[#151B2C] border border-gray-800 rounded-xl px-4 py-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewerTab("preview")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition font-mono ${
                    viewerTab === "preview"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Interactive Preview
                </button>
                <button
                  onClick={() => setViewerTab("code")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition font-mono ${
                    viewerTab === "code"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  Source Code Structure
                </button>
                <button
                  onClick={() => setViewerTab("prompt")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition font-mono ${
                    viewerTab === "prompt"
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                >
                  <MessageSquareCode className="h-3.5 w-3.5" />
                  Generation Prompt
                </button>
              </div>

              {viewerTab === "code" && (
                <button
                  onClick={() =>
                    handleCopy(
                      cleanMarkdownWrappers(selectedComponent.generated_code),
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-gray-400 hover:text-white bg-[#0B0F19] border border-gray-800 rounded-lg transition"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" />
                      <span>Copy Snapshot</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Central Content Canvas Area */}
            <div className="flex-1 min-h-0 bg-[#0E1322] border border-gray-800 rounded-2xl overflow-hidden relative">
              {viewerTab === "preview" ? (
                <div className="w-full h-full p-2 overflow-auto">
                  <LiveCanvasView
                    code={cleanMarkdownWrappers(
                      selectedComponent.generated_code,
                    )}
                  />
                </div>
              ) : viewerTab === "code" ? (
                <pre className="w-full h-full p-5 overflow-auto font-mono text-xs text-blue-400 selection:bg-blue-500/20 bg-[#0B0F19] leading-relaxed whitespace-pre-wrap">
                  {cleanMarkdownWrappers(selectedComponent.generated_code)}
                </pre>
              ) : (
                /* Prompt Render Interface Content Workspace */
                <div className="w-full h-full p-6 overflow-auto bg-[#0B0F19] text-sm text-gray-200 font-sans leading-relaxed whitespace-pre-wrap selection:bg-blue-500/20">
                  {selectedComponent.user_prompt ||
                    "No context prompt recorded for this component lineage run."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
