"use client";

import React, { useState } from "react";

export default function WorkspacePage() {
  const [figmaUrl, setFigmaUrl] = useState("");
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<"CODE" | "PREVIEW">("CODE");
  const [generatedCode, setGeneratedCode] = useState<string>("");

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!figmaUrl) return;

    setIsGenerating(true);

    // Simulating API call to your backend / LLM engine
    setTimeout(() => {
      setGeneratedCode(
        `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-6 bg-slate-800 border border-slate-700 rounded-2xl text-center shadow-xl">\n      <h3 className="text-lg font-bold text-emerald-400">🚀 UI Generated via SQLite</h3>\n      <p className="text-slate-300 text-xs mt-2">Component synchronized with your Prisma tables.</p>\n    </div>\n  );\n}`,
      );
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden bg-[#0b0f19]">
      {/* LEFT PANEL: Inputs */}
      <div className="w-full lg:w-[40%] border-b lg:border-b-0 lg:border-r border-slate-800/80 p-4 sm:p-6 overflow-y-auto space-y-6 shrink-0">
        <div className="space-y-1">
          <h2 className="text-xl font-extrabold text-white tracking-tight">
            Copilot Generator
          </h2>
          <p className="text-slate-400 text-xs">
            Transform your Figma layer structures into responsive React
            components.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Figma Node URL
            </label>
            <input
              type="url"
              required
              placeholder="https://www.figma.com/design/..."
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              AI Directives
            </label>
            <textarea
              rows={4}
              placeholder="E.g., Add hover animations and make the alignment adaptive..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isGenerating}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/20 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            {isGenerating ? "Analyzing vectors..." : "Generate Component"}
          </button>
        </form>
      </div>

      {/* RIGHT PANEL: Sandbox & Output */}
      <div className="flex-1 flex flex-col bg-slate-950/20 overflow-hidden">
        <div className="h-12 border-b border-slate-800/60 px-4 flex items-center justify-between shrink-0 bg-[#0e1322]/20">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800/60 text-[11px] font-semibold">
            <button
              onClick={() => setActiveTab("CODE")}
              className={`px-3 py-1 rounded-md ${activeTab === "CODE" ? "bg-slate-800 text-white" : "text-slate-500"}`}
            >
              Source Code
            </button>
            <button
              onClick={() => setActiveTab("PREVIEW")}
              className={`px-3 py-1 rounded-md ${activeTab === "PREVIEW" ? "bg-slate-800 text-white" : "text-slate-500"}`}
            >
              Sandbox Preview
            </button>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {!generatedCode ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-800/80 rounded-2xl">
              <p className="text-slate-500 text-xs">
                Paste a Figma link and hit compile to activate the Sandbox.
              </p>
            </div>
          ) : activeTab === "CODE" ? (
            <pre className="font-mono text-[11px] leading-relaxed text-indigo-300 bg-slate-950 p-4 rounded-xl border border-slate-900 overflow-x-auto">
              <code>{generatedCode}</code>
            </pre>
          ) : (
            <div className="h-full w-full bg-slate-900 rounded-xl p-6 flex items-center justify-center border border-slate-800">
              <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-xs text-center shadow-xl">
                <h3 className="text-md font-bold text-emerald-400">
                  🚀 UI Generated via SQLite
                </h3>
                <p className="text-slate-300 text-xs mt-2">
                  Component synchronized with your Prisma tables.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
