"use client";

import React, { useEffect, useRef, useState } from "react";
import { Play, ShieldAlert, Loader2 } from "lucide-react";

interface LiveCanvasViewProps {
  code: string | null;
}

export default function LiveCanvasView({ code }: LiveCanvasViewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!code || !iframeRef.current) return;

    setRenderError(null);

    // 1. Clean out ES modules syntax so Babel Standalone compiles safely
    const cleanedCode = code
      .replace(/import\s+[\s\S]*?\s+from\s+['"].*?['"];?/g, "") // Strip imports
      .replace(/export\s+default\s+\w+;?/g, ""); // Strip export default

    // 2. Build a completely isolated HTML sandboxed runtime environment
    const srcDoc = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        
        <style>
          body { margin: 0; background-color: transparent; font-family: sans-serif; }
          /* Custom scrollbar to match dashboard layout aesthetics */
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: #374151; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div id="canvas-runtime-root"></div>

        <script type="text/babel">
          // Catch and relay nested compiler/runtime errors directly to parent view
          window.addEventListener('error', (event) => {
            window.parent.postMessage({ type: 'CANVAS_RUNTIME_ERROR', error: event.message }, '*');
          });

          try {
            ${cleanedCode}

            // Target the root and boot up our compiled dynamic React element node
            const RootElement = typeof App !== 'undefined' ? App : () => (
              <div className="p-6 text-amber-500 font-mono text-xs">
                ⚠️ Warning: Could not isolate an 'App' definition entry point component.
              </div>
            );

            const container = document.getElementById('canvas-runtime-root');
            const root = ReactDOM.createRoot(container);
            root.render(<RootElement />);
          } catch (err) {
            window.parent.postMessage({ type: 'CANVAS_RUNTIME_ERROR', error: err.message }, '*');
          }
        </script>
      </body>
      </html>
    `;

    // 3. Mount the isolated source payload into the frame runtime execution block
    const iframe = iframeRef.current;
    iframe.srcdoc = srcDoc;

    // 4. Set up window message listener to intercept compiled UI execution faults
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "CANVAS_RUNTIME_ERROR") {
        setRenderError(event.data.error);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [code]);

  if (!code) {
    return (
      <div className="h-full min-h-[350px] w-full border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-gray-500 bg-[#0E1322]">
        <Play className="h-8 w-8 text-gray-700 mb-3 animate-pulse" />
        <p className="text-sm">Awaiting live structure compilation stream...</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px] border border-gray-800 rounded-2xl overflow-hidden bg-[#0B0F19] flex flex-col shadow-2xl">
      {/* Top Banner Toolbar Context */}
      <div className="bg-[#151B2C] border-b border-gray-800 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="text-xs text-gray-400 font-mono ml-2 tracking-wide">
            sandbox_canvas_runtime.tsx
          </span>
        </div>
        <div className="text-[10px] uppercase font-mono font-bold px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
          Live Render Active
        </div>
      </div>

      {/* Frame Container */}
      <div className="flex-1 bg-white relative">
        {renderError ? (
          <div className="absolute inset-0 bg-red-950/10 backdrop-blur-sm flex items-center justify-center p-6 z-10">
            <div className="bg-[#151B2C] border border-red-900/50 p-5 rounded-xl max-w-md w-full shadow-2xl space-y-3">
              <div className="flex items-center gap-2.5 text-red-400 font-semibold text-sm">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                Compilation Runtime Blocked
              </div>
              <p className="text-xs font-mono text-gray-300 bg-red-950/30 p-3 rounded-lg border border-red-900/20 max-h-32 overflow-y-auto">
                {renderError}
              </p>
            </div>
          </div>
        ) : null}

        <iframe
          ref={iframeRef}
          title="Sandbox Component Engine preview"
          sandbox="allow-scripts"
          className="w-full h-full min-h-[350px] border-none bg-transparent"
        />
      </div>
    </div>
  );
}
