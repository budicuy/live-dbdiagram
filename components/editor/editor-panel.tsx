"use client";

import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Code2,
  Lightbulb,
  Wand2,
  X,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { serializeDbml } from "../../lib/engine/serializer";
import { useProjectStore } from "../../lib/store/use-project-store";
import { cn } from "../../lib/utils";
import { DbmlEditor } from "./dbml-editor";

export function EditorPanel() {
  const ui = useProjectStore((s) => s.ui);
  const toggleEditor = useProjectStore((s) => s.toggleEditor);
  const setEditorWidth = useProjectStore((s) => s.setEditorWidth);
  const project = useProjectStore((s) => s.project);
  const setDbml = useProjectStore((s) => s.setDbml);
  const diagnostics = useProjectStore((s) => s.diagnostics);
  const gotoEditorLine = useProjectStore((s) => s.gotoEditorLine);

  const [isResizing, setIsResizing] = useState(false);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState(false);
  const diagnosticsRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(ui.editorWidth);

  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  const warningCount = diagnostics.filter(
    (d) => d.severity === "warning",
  ).length;
  const hasIssues = errorCount > 0 || warningCount > 0;

  // Close diagnostics popover on click outside or escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowDiagnosticsPanel(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        diagnosticsRef.current &&
        !diagnosticsRef.current.contains(e.target as Node)
      ) {
        setShowDiagnosticsPanel(false);
      }
    };

    if (showDiagnosticsPanel) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDiagnosticsPanel]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = ui.editorWidth;
    document.body.style.cursor = "col-resize";
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(
        300,
        Math.min(800, startWidthRef.current + delta),
      );
      setEditorWidth(newWidth);
    },
    [isResizing, setEditorWidth],
  );

  const handleMouseUp = useCallback(() => {
    if (isResizing) {
      setIsResizing(false);
      document.body.style.cursor = "";
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleFormat = () => {
    if (!project) return;
    try {
      const formatted = serializeDbml(project.schema);
      setDbml(formatted);
    } catch (err) {
      console.warn("Gagal merapikan kode:", err);
    }
  };

  const handleJumpToIssue = (line?: number, column?: number) => {
    if (line && line > 0) {
      gotoEditorLine(line, column || 1);
      setShowDiagnosticsPanel(false);
    }
  };

  if (!ui.editorOpen) return null;

  return (
    <div
      style={{ width: `${ui.editorWidth}px` }}
      className="relative flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 transition-[width] duration-75"
    >
      {/* Editor Header */}
      <div className="relative flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs select-none">
        <div className="flex items-center gap-2 overflow-hidden">
          <Code2 className="w-4 h-4 text-blue-500 shrink-0" />
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
            Editor DBML
          </span>

          {/* Interactive Diagnostics Status Pill */}
          {errorCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowDiagnosticsPanel((prev) => !prev)}
              title="Klik untuk melihat detail error & rekomendasi cara fix"
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer",
                "bg-red-100 hover:bg-red-200 dark:bg-red-950/70 dark:hover:bg-red-900/70 text-red-600 dark:text-red-400 active:scale-95 shadow-xs",
                showDiagnosticsPanel && "ring-2 ring-red-500/30",
              )}
            >
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{errorCount} Error</span>
              <ChevronDown
                className={cn(
                  "w-2.5 h-2.5 transition-transform duration-200",
                  showDiagnosticsPanel && "rotate-180",
                )}
              />
            </button>
          ) : warningCount > 0 ? (
            <button
              type="button"
              onClick={() => setShowDiagnosticsPanel((prev) => !prev)}
              title="Klik untuk melihat detail peringatan & rekomendasi cara fix"
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium transition-all cursor-pointer",
                "bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/70 dark:hover:bg-amber-900/70 text-amber-600 dark:text-amber-400 active:scale-95 shadow-xs",
                showDiagnosticsPanel && "ring-2 ring-amber-500/30",
              )}
            >
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>{warningCount} Peringatan</span>
              <ChevronDown
                className={cn(
                  "w-2.5 h-2.5 transition-transform duration-200",
                  showDiagnosticsPanel && "rotate-180",
                )}
              />
            </button>
          ) : (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Valid
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            title="Rapikan Kode (Format DBML)"
            onClick={handleFormat}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <Wand2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            title="Tutup Panel Editor"
            onClick={toggleEditor}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Diagnostics Popover Panel */}
      {showDiagnosticsPanel && hasIssues && (
        <div
          ref={diagnosticsRef}
          className="absolute top-9.5 left-3 w-95 max-w-[calc(100%-1.5rem)] max-h-[80%] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150 ring-1 ring-black/5 dark:ring-white/10"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                Pemeriksaan Kode DBML
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {diagnostics.length} Masalah
              </span>
            </div>
            <button
              type="button"
              title="Tutup Panel"
              onClick={() => setShowDiagnosticsPanel(false)}
              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Popover Content / Problems List */}
          <div className="overflow-y-auto p-2.5 space-y-2 text-xs divide-y divide-slate-100 dark:divide-slate-800/60">
            {diagnostics.map((d) => (
              <div
                key={`${d.rule || "diag"}-${d.line || 0}-${d.column || 0}-${d.message}`}
                onClick={() => handleJumpToIssue(d.line, d.column)}
                className={cn(
                  "p-2.5 rounded-lg border transition-all cursor-pointer group text-left",
                  d.severity === "error"
                    ? "border-red-200 dark:border-red-900/60 bg-red-50/60 dark:bg-red-950/20 hover:border-red-400 dark:hover:border-red-700 hover:shadow-xs"
                    : "border-amber-200 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/20 hover:border-amber-400 dark:hover:border-amber-700 hover:shadow-xs",
                )}
              >
                {/* Header: Severity, Message, Line Pill */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-1.5 overflow-hidden">
                    {d.severity === "error" ? (
                      <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span
                          className={cn(
                            "text-[10px] font-semibold uppercase tracking-wider px-1 rounded",
                            d.severity === "error"
                              ? "bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300"
                              : "bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300",
                          )}
                        >
                          {d.severity === "error" ? "Error" : "Peringatan"}
                        </span>
                        {d.rule && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            ({d.rule})
                          </span>
                        )}
                      </div>
                      <p
                        className={cn(
                          "font-medium text-[11px] leading-snug",
                          d.severity === "error"
                            ? "text-red-900 dark:text-red-200"
                            : "text-amber-900 dark:text-amber-200",
                        )}
                      >
                        {d.message}
                      </p>
                    </div>
                  </div>

                  {d.line && (
                    <span className="shrink-0 px-1.5 py-0.5 rounded font-mono text-[10px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs group-hover:border-blue-400 group-hover:text-blue-500 transition-colors">
                      Line {d.line}
                      {d.column ? `:${d.column}` : ""}
                    </span>
                  )}
                </div>

                {/* Recommendation Box */}
                {d.suggestion && (
                  <div className="mt-2 flex items-start gap-1.5 p-2 rounded bg-white/90 dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 text-[11px] text-slate-700 dark:text-slate-300">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div className="leading-relaxed">
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        Rekomendasi Cara Fix:{" "}
                      </span>
                      {d.suggestion}
                    </div>
                  </div>
                )}

                {/* Jump to Line Action Pill */}
                <div className="mt-2 flex items-center justify-end gap-1 text-[10px] font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                  <span>Klik untuk menuju ke baris {d.line || 1}</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor Body */}
      <div className="flex-1 w-full h-full relative">
        <DbmlEditor />
      </div>

      {/* Resize Handle on Right */}
      <div
        onMouseDown={handleMouseDown}
        className={cn(
          "absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors z-20",
          isResizing && "bg-blue-500",
        )}
      />
    </div>
  );
}
