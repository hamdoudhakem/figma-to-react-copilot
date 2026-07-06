"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Terminal, Copy, Check } from "lucide-react";

interface DBComponent {
  id: string;
  name: string;
  figma_url: string;
  generated_code: string | null;
  status: string;
  last_updated: string;
}

export default function ComponentSpecificationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [copied, setCopied] = React.useState(false);

  const { data: components, isLoading } = useQuery<DBComponent[]>({
    queryKey: ["components-registry"],
    queryFn: async () => {
      const response = await fetch("/api/components");
      return response.json();
    },
  });

  const activeComponent = components?.find((c) => c.id === id);

  const executeCopyAction = () => {
    if (!activeComponent?.generated_code) return;
    navigator.clipboard.writeText(activeComponent.generated_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading)
    return (
      <div className="text-sm text-gray-500 animate-pulse">
        Querying database specifications...
      </div>
    );
  if (!activeComponent) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-400">
          Specified component identifier could not be found within active cloud
          table scopes.
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-xs text-blue-400 flex items-center gap-1"
        >
          <ChevronLeft className="h-3 w-3" /> Return to Dashboard Grid
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push("/dashboard")}
          className="text-gray-400 hover:text-white text-xs font-medium flex items-center gap-1 bg-[#151B2C] border border-gray-800 px-3 py-1.5 rounded-lg transition"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to Registry
        </button>
        <button
          onClick={executeCopyAction}
          className="bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-xl flex items-center gap-2 transition shadow-md shadow-blue-600/10"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-300" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied Snapshot Code!" : "Copy Component Source Code"}
        </button>
      </div>

      <div className="bg-[#151B2C] border border-gray-800 rounded-2xl p-6 space-y-2">
        <h1 className="text-2xl font-bold text-white tracking-wide">
          {activeComponent.name}
        </h1>
        <p className="text-xs font-mono text-gray-500">
          Global ID: {activeComponent.id} • Last Generated Sync:{" "}
          {activeComponent.last_updated}
        </p>
      </div>

      <div className="bg-[#0E1321] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[550px]">
        <div className="bg-[#151B2C] px-5 py-3 border-b border-gray-800 flex items-center gap-2">
          <Terminal className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-mono font-medium text-gray-300">
            React Component Code Layout Buffer
          </span>
        </div>
        <div className="flex-1 p-6 overflow-auto font-mono text-xs text-gray-300 bg-[#0B0F19]/40 leading-relaxed">
          <pre className="whitespace-pre-wrap select-text">
            {activeComponent.generated_code ||
              "// Empty capture schema context."}
          </pre>
        </div>
      </div>
    </div>
  );
}
