"use client";

import React, { useState } from "react";

export default function SettingsPage() {
  const [dbPath, setDbPath] = useState("./prisma/dev.db");
  const [model, setModel] = useState("claude-3-5-sonnet");
  const [useTypeScript, setUseTypeScript] = useState(true);

  return (
    <div className="p-4 sm:p-6 md:p-8 pb-16 space-y-6 w-full max-w-3xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-white">
          DB & Engine Configurations
        </h2>
        <p className="text-slate-400 text-xs mt-1">
          Adjust local Prisma ORM pathways and AI model generation structures.
        </p>
      </div>

      <div className="space-y-4">
        {/* SQLite Module */}
        <div className="bg-[#0e1322] border border-slate-800/80 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            📦 Local SQLite Storage
          </h3>
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 block">
              Connection Path (DATABASE_URL)
            </label>
            <input
              type="text"
              value={dbPath}
              onChange={(e) => setDbPath(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* AI Module */}
        <div className="bg-[#0e1322] border border-slate-800/80 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            🤖 Core LLM Engine
          </h3>
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-400 block">
              Active Copilot Model
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="claude-3-5-sonnet">
                Claude 3.5 Sonnet (Recommended)
              </option>
              <option value="gpt-4o">GPT-4o (Standard)</option>
              <option value="llama3-local">
                Llama 3 (Ollama Local Client)
              </option>
            </select>
          </div>
        </div>

        {/* Language Toggles */}
        <div className="bg-[#0e1322] border border-slate-800/80 rounded-xl p-5 flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              🔧 Strict TypeScript Output
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Enforce compiler engine to render typed .tsx modules natively.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setUseTypeScript(!useTypeScript)}
            className={`w-10 h-6 rounded-full p-1 transition-all flex items-center ${useTypeScript ? "bg-indigo-600 justify-end" : "bg-slate-800 justify-start"}`}
          >
            <span className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}
