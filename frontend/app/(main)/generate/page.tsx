"use client";

import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import LiveCanvasView from "@/app/(main)/components/LiveCanvasView";
import { getOrCreateSessionId } from "@/app/utils/session";
import {
  Sparkles,
  Loader2,
  Link2,
  Code2,
  AlertCircle,
  Eye,
  Terminal,
  Copy,
  Check,
  Cpu,
  Edit3,
} from "lucide-react";

export default function AIComponentStudio() {
  const queryClient = useQueryClient(); // Instantiated to control global React Query cache state

  const [figmaUrl, setFigmaUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!generatedCode) return;
    await navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Clean syntax decorators added by the model
  const cleanMarkdownWrappers = (rawCode: string) => {
    let clean = rawCode.trim();
    if (clean.startsWith("```")) {
      clean = clean.replace(/^```(jsx|tsx|html|javascript|typescript)?\n/, "");
    }
    if (clean.endsWith("```")) {
      clean = clean.replace(/```$/, "");
    }
    return clean;
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!figmaUrl.trim() && !prompt.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Session-ID": getOrCreateSessionId(),
        },
        body: JSON.stringify({
          figma_url: figmaUrl.trim(),
          prompt: prompt.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Engine deployment failure: Status ${response.status}`);
      }

      const rawText = await response.text();

      if (rawText.startsWith("⚠️")) {
        throw new Error(rawText);
      }

      const cleanCode = cleanMarkdownWrappers(rawText);
      setGeneratedCode(cleanCode);
      setActiveTab("preview");
    } catch (err: any) {
      console.error("🔴 [Generation Fault]:", err);
      setError(err.message || "An unexpected automation error occurred.");
    } finally {
      setIsLoading(false);

      // FIXED: Force React Query to clear cache and pull fresh entries for both tables immediately
      queryClient.invalidateQueries({ queryKey: ["logs"] });
      queryClient.invalidateQueries({ queryKey: ["components"] });
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Sparkles className="text-blue-500 h-7 w-7" />
          Figma Compiler Studio
        </h1>
        <p className="text-gray-400 mt-1">
          Ingest vector frame blueprints, render components instantly, and
          modify source code directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch flex-1 min-h-[550px]">
        {/* Left Control Column */}
        <div className="lg:col-span-4 bg-[#151B2C] border border-gray-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl">
          <form
            onSubmit={handleGenerate}
            className="space-y-5 flex-1 flex flex-col justify-between"
          >
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  Figma Node Blueprint URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                    <Link2 className="h-4 w-4" />
                  </div>
                  <input
                    type="url"
                    value={figmaUrl}
                    onChange={(e) => setFigmaUrl(e.target.value)}
                    placeholder="https://www.figma.com/file/..."
                    className="w-full bg-[#0B0F19] border border-gray-800 rounded-xl pl-10 pr-4 py-3 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition font-mono"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-gray-400 font-semibold">
                  Style Modifiers & Prompt Directives (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="e.g., Modify the card spacing to match strict grid systems, change typography tracking..."
                  className="w-full h-36 bg-[#0B0F19] border border-gray-800 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-blue-500 transition resize-none font-sans leading-relaxed"
                  disabled={isLoading}
                />
              </div>

              {error && (
                <div className="bg-red-950/20 border border-red-900/30 text-red-400 p-4 rounded-xl text-xs flex gap-2.5 items-start">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="font-mono">{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || (!figmaUrl.trim() && !prompt.trim())}
              className="w-full mt-6 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium text-sm py-3.5 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Compiling Blueprint Structure...
                </>
              ) : (
                <>
                  <Code2 className="h-4 w-4" />
                  Compile to Live React Component
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Workspace Preview/Code Panel */}
        <div className="lg:col-span-8 flex flex-col h-full space-y-3">
          <div className="flex items-center justify-between bg-[#151B2C] border border-gray-800 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("preview")}
                disabled={!generatedCode || isLoading}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition font-mono ${
                  activeTab === "preview"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 disabled:opacity-30"
                }`}
              >
                <Eye className="h-3.5 w-3.5" />
                Live Preview
              </button>
              <button
                onClick={() => setActiveTab("code")}
                disabled={!generatedCode || isLoading}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition font-mono ${
                  activeTab === "code"
                    ? "bg-blue-600 text-white shadow-md"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 disabled:opacity-30"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                Source Code Editor
              </button>
            </div>

            {generatedCode && activeTab === "code" && !isLoading && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-amber-400 font-mono flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-md">
                  <Edit3 className="h-3 w-3" /> Live Sandbox Workspace
                  (Editable)
                </span>
                <button
                  onClick={handleCopy}
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
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-[450px] relative">
            {isLoading && (
              <div className="absolute inset-0 bg-[#0B0F19] border border-gray-800 rounded-2xl flex flex-col items-center justify-center p-8 space-y-6 z-20 shadow-2xl">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-blue-500/40 flex items-center justify-center animate-spin">
                  <Cpu className="h-6 w-6 text-blue-500 animate-pulse" />
                </div>
                <div className="text-center space-y-2 max-w-sm">
                  <h3 className="text-sm font-semibold text-white uppercase font-mono tracking-wide">
                    Executing Layout Pipeline Engine
                  </h3>
                  <p className="text-xs text-gray-400 font-mono animate-pulse">
                    Synthesizing responsive code matrices...
                  </p>
                </div>
              </div>
            )}

            {!generatedCode && !isLoading ? (
              <div className="h-full min-h-[450px] w-full border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-500 bg-[#0E1322]">
                <Code2 className="h-8 w-8 text-gray-700 mb-3" />
                <p className="text-sm font-medium text-gray-400">
                  Workspace Sandbox Idle
                </p>
                <p className="text-xs text-gray-600 mt-1 max-w-xs font-mono">
                  Provide a valid Figma URL token to initialize compile
                  execution.
                </p>
              </div>
            ) : generatedCode && !isLoading ? (
              activeTab === "preview" ? (
                <LiveCanvasView code={generatedCode} />
              ) : (
                <textarea
                  value={generatedCode}
                  onChange={(e) => setGeneratedCode(e.target.value)}
                  placeholder="Paste or modify code layout components here..."
                  className="w-full h-full min-h-[450px] border border-gray-800 rounded-2xl bg-[#0B0F19] font-mono text-xs text-blue-400 p-5 focus:outline-none focus:border-blue-500 resize-none leading-relaxed selection:bg-blue-500/20"
                  spellCheck={false}
                />
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
