"use client";

import React, { useState } from "react";
import { Terminal, Play, Sparkles, AlertCircle } from "lucide-react";

export default function GenerateCanvasPage() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [promptOverride, setPromptOverride] = useState("");
  const [streamingCode, setStreamingCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStartGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!figmaUrl.trim()) return;

    setIsGenerating(true);
    setStreamingCode("");
    setErrorMessage(null);

    try {
      // Direct call utilizing our Next.js transparent rewrite layer configuration
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          figma_url: figmaUrl,
          prompt_override: promptOverride || null,
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Server returned error payload code: ${response.status}`,
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      if (!reader) {
        throw new Error(
          "Unable to establish readable stream interface engine from backend.",
        );
      }

      // Stream Consumption Loop
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const tokenChunk = decoder.decode(value, { stream: true });

        // Intercept inline backend pipeline runtime errors cleanly
        if (tokenChunk.startsWith("⚠️")) {
          setErrorMessage(tokenChunk);
          break;
        }

        setStreamingCode((prev) => prev + tokenChunk);
      }
    } catch (err: any) {
      setErrorMessage(
        err.message || "An unexpected communication fault occurred.",
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight">
          Copilot Generation Canvas
        </h1>
        <p className="text-gray-400 mt-2">
          Paste a Figma URL node to trigger the MCP extraction engine and stream
          structural code components.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
        {/* Left Interactive Control Panel Form */}
        <form
          onSubmit={handleStartGeneration}
          className="lg:col-span-2 bg-[#151B2C] border border-gray-800 p-6 rounded-2xl space-y-6"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 block">
              Figma Node Canvas URL
            </label>
            <input
              type="url"
              required
              disabled={isGenerating}
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://www.figma.com/design/..."
              className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl px-4 py-3 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300 block">
              Custom Prompt System Overrides (Optional)
            </label>
            <textarea
              rows={4}
              disabled={isGenerating}
              value={promptOverride}
              onChange={(e) => setPromptOverride(e.target.value)}
              placeholder="e.g., Modify the primary brand color matrix to use emerald instead of slate utility weights..."
              className="w-full bg-[#0B0F19] border border-gray-700 rounded-xl p-4 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating || !figmaUrl.trim()}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 disabled:text-gray-500 text-white font-medium text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-lg shadow-blue-600/10"
          >
            {isGenerating ? (
              <>
                <Sparkles className="h-4 w-4 animate-spin text-blue-300" />
                Interrogating MCP Server...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 fill-current" />
                Execute Generation Pipeline
              </>
            )}
          </button>
        </form>

        {/* Right High-Fidelity Streaming Preview Screen Terminal */}
        <div className="lg:col-span-3 flex flex-col h-[520px] bg-[#0E1321] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
          <div className="bg-[#151B2C] px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Terminal className="h-4 w-4 text-gray-400" />
              <span className="text-xs font-mono font-medium tracking-wider text-gray-300">
                STREAMING_OUTPUT_BUFFER
              </span>
            </div>
            {isGenerating && (
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>

          <div className="flex-1 p-6 overflow-auto font-mono text-xs text-emerald-400 space-y-4">
            {errorMessage && (
              <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 flex gap-3 text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{errorMessage}</p>
              </div>
            )}

            {streamingCode ? (
              <pre className="whitespace-pre-wrap leading-relaxed select-text">
                {streamingCode}
              </pre>
            ) : (
              !errorMessage && (
                <span className="text-gray-600 italic">
                  Await stream initialization hook...
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
