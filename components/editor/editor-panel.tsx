"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Code2,
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

  const [isResizing, setIsResizing] = useState(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(ui.editorWidth);

  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  const warningCount = diagnostics.filter(
    (d) => d.severity === "warning",
  ).length;

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

  if (!ui.editorOpen) return null;

  return (
    <div
      style={{ width: `${ui.editorWidth}px` }}
      className="relative flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-10 transition-[width] duration-75"
    >
      {/* Editor Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs select-none">
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-blue-500" />
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Editor DBML
          </span>

          {/* Diagnostics Status Pill */}
          {errorCount > 0 ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-100 dark:bg-red-950/70 text-red-600 dark:text-red-400">
              <AlertCircle className="w-3 h-3" />
              {errorCount} Error
            </span>
          ) : warningCount > 0 ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              {warningCount} Peringatan
            </span>
          ) : (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              Valid
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
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
