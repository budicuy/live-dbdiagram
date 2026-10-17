"use client";

import { Check, Copy, Download, FileDown, X } from "lucide-react";
import { useMemo, useState } from "react";
import { exportDbmlToSql } from "../../lib/engine/sql-exporter";
import { useProjectStore } from "../../lib/store/use-project-store";
import { cn } from "../../lib/utils";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

type ExportType = "dbml" | "sql-postgres" | "sql-mysql" | "json";

export function ExportModal({ open, onClose }: ExportModalProps) {
  const project = useProjectStore((s) => s.project);
  const [exportType, setExportType] = useState<ExportType>("sql-postgres");
  const [copied, setCopied] = useState(false);

  const exportedContent = useMemo(() => {
    if (!project) return "";
    try {
      if (exportType === "dbml") {
        return project.dbml;
      }
      if (exportType === "sql-postgres") {
        return exportDbmlToSql(project.dbml, "postgres");
      }
      if (exportType === "sql-mysql") {
        return exportDbmlToSql(project.dbml, "mysql");
      }
      if (exportType === "json") {
        const backup = {
          version: 1,
          id: project.id,
          name: project.name,
          dialect: project.dialect,
          dbml: project.dbml,
          schema: project.schema,
          metadata: project.metadata,
          createdAt: project.createdAt,
          updatedAt: project.updatedAt,
        };
        return JSON.stringify(backup, null, 2);
      }
      return "";
    } catch (err: any) {
      return `/* Gagal mengekspor: ${err?.message || String(err)} */`;
    }
  }, [project, exportType]);

  if (!open) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin ke clipboard:", err);
    }
  };

  const handleDownload = () => {
    if (!project) return;
    const filenameBase =
      project.name.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "database";
    let extension = "sql";
    let mimeType = "text/plain";

    if (exportType === "dbml") {
      extension = "dbml";
    } else if (exportType === "json") {
      extension = "json";
      mimeType = "application/json";
    }

    const blob = new Blob([exportedContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 text-sm">
            <FileDown className="w-4 h-4 text-blue-500" />
            <span>Ekspor Skema Database</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/40 text-xs">
          <button
            type="button"
            onClick={() => setExportType("sql-postgres")}
            className={cn(
              "flex-1 py-2.5 font-medium border-b-2 text-center transition-colors",
              exportType === "sql-postgres"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            PostgreSQL SQL
          </button>
          <button
            type="button"
            onClick={() => setExportType("sql-mysql")}
            className={cn(
              "flex-1 py-2.5 font-medium border-b-2 text-center transition-colors",
              exportType === "sql-mysql"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            MySQL SQL
          </button>
          <button
            type="button"
            onClick={() => setExportType("dbml")}
            className={cn(
              "flex-1 py-2.5 font-medium border-b-2 text-center transition-colors",
              exportType === "dbml"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            DBML
          </button>
          <button
            type="button"
            onClick={() => setExportType("json")}
            className={cn(
              "flex-1 py-2.5 font-medium border-b-2 text-center transition-colors",
              exportType === "json"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            Backup JSON
          </button>
        </div>

        {/* Code Preview Area */}
        <div className="flex-1 p-4 space-y-3 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Pratinjau Hasil Ekspor:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "Tersalin!" : "Salin ke Clipboard"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="flex items-center gap-1 px-3 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white font-medium shadow-xs transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh File</span>
              </button>
            </div>
          </div>

          <pre className="flex-1 w-full p-3 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-mono text-xs overflow-auto select-text leading-relaxed">
            {exportedContent}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
