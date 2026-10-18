"use client";

import {
  AlertCircle,
  AlertTriangle,
  FileUp,
  Loader2,
  Upload,
  X,
} from "lucide-react";
import type React from "react";
import { useState } from "react";
import { parseDbml } from "../../lib/engine/parser";
import { cleanSqlForDdl, importSqlToDbml } from "../../lib/engine/sql-importer";
import { useProjectStore } from "../../lib/store/use-project-store";
import { type Dialect, ProjectBackupSchema } from "../../lib/types/schema";
import { cn } from "../../lib/utils";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

type ImportType = "dbml" | "sql-mysql" | "sql-postgres" | "json";

export function ImportModal({ open, onClose }: ImportModalProps) {
  const project = useProjectStore((s) => s.project);
  const setDbml = useProjectStore((s) => s.setDbml);
  const setDialect = useProjectStore((s) => s.setDialect);
  const updateAllPositions = useProjectStore((s) => s.updateAllPositions);
  const createNewProject = useProjectStore((s) => s.createNewProject);
  const setShowWelcomeScreen = useProjectStore((s) => s.setShowWelcomeScreen);

  const [importType, setImportType] = useState<ImportType>("dbml");
  const [inputText, setInputText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [replaceActive, setReplaceActive] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!open) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || "";
      setErrorMsg(null);
      setWarnings([]);

      if (
        file.name.toLowerCase().endsWith(".sql") ||
        importType.startsWith("sql")
      ) {
        const { cleanSql, stats } = cleanSqlForDdl(text);
        setInputText(cleanSql);
        if (stats.copyBlocks > 0 || stats.insertStatements > 0) {
          setWarnings([
            `Data baris tabel (${stats.copyBlocks > 0 ? `${stats.copyBlocks} blok COPY` : ""}${stats.copyBlocks > 0 && stats.insertStatements > 0 ? ", " : ""}${stats.insertStatements > 0 ? `${stats.insertStatements} pernyataan INSERT` : ""}) telah dipangkas secara otomatis dari berkas agar memori editor tetap ringan.`,
          ]);
        }
      } else {
        setInputText(text);
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setErrorMsg(null);
    setWarnings([]);

    const content = inputText.trim();
    if (!content) {
      setErrorMsg("Konten impor tidak boleh kosong.");
      return;
    }

    setIsProcessing(true);
    // Yield execution to allow React to paint the loading spinner
    await new Promise((resolve) => setTimeout(resolve, 40));

    try {
      if (importType === "dbml") {
        const parseRes = parseDbml(content, project?.dialect || "postgres");
        if (!parseRes.success) {
          setErrorMsg(parseRes.diagnostics.map((d) => d.message).join("; "));
          return;
        }

        if (replaceActive) {
          setDbml(content);
        } else {
          await createNewProject(
            "Proyek Impor DBML",
            project?.dialect || "postgres",
            content,
          );
        }
        setShowWelcomeScreen(false);
        onClose();
      } else if (importType === "sql-mysql" || importType === "sql-postgres") {
        const dialect: Dialect =
          importType === "sql-mysql" ? "mysql" : "postgres";
        const importRes = importSqlToDbml(content, dialect);

        if (!importRes.success || !importRes.dbml) {
          setErrorMsg(importRes.error || "Gagal memproses DDL SQL.");
          setWarnings(importRes.warnings);
          return;
        }

        if (importRes.warnings.length > 0) {
          setWarnings(importRes.warnings);
        }

        if (replaceActive) {
          setDialect(dialect);
          setDbml(importRes.dbml);
        } else {
          await createNewProject(
            `Proyek Impor ${dialect.toUpperCase()}`,
            dialect,
            importRes.dbml,
          );
        }
        setShowWelcomeScreen(false);
        onClose();
      } else if (importType === "json") {
        let parsedJson: any;
        try {
          parsedJson = JSON.parse(content);
        } catch {
          setErrorMsg("Format JSON tidak valid.");
          return;
        }

        const validRes = ProjectBackupSchema.safeParse(parsedJson);
        if (!validRes.success) {
          setErrorMsg("Struktur file backup proyek tidak sesuai format skema.");
          return;
        }

        const backup = validRes.data;
        if (replaceActive) {
          setDialect(backup.dialect);
          setDbml(backup.dbml);
          updateAllPositions(backup.metadata.positions);
        } else {
          await createNewProject(
            backup.name || "Proyek Cadangan",
            backup.dialect,
            backup.dbml,
          );
        }
        setShowWelcomeScreen(false);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Terjadi kesalahan saat mengimpor.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    if (importType !== "sql-mysql" && importType !== "sql-postgres") return;

    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    if (
      pastedText.length > 20000 ||
      /INSERT\s+(IGNORE\s+)?INTO|COPY\s+.*?FROM\s+stdin|phpMyAdmin\s+SQL\s+Dump/i.test(
        pastedText,
      )
    ) {
      const { cleanSql, stats } = cleanSqlForDdl(pastedText);
      if (stats.ddlStatementsCount > 0) {
        e.preventDefault();
        setInputText(cleanSql);
        setErrorMsg(null);
        setWarnings([
          `Data baris tabel (${stats.skippedLines} baris data/perintah non-DDL) berhasil dipangkas otomatis dari clipboard. Hanya ${stats.ddlStatementsCount} deklarasi skema DDL yang dimuat agar editor tetap cepat dan responsif.`,
        ]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-100 text-sm">
            <FileUp className="w-4 h-4 text-blue-500" />
            <span>Impor Skema Database</span>
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
            onClick={() => {
              setImportType("dbml");
              setErrorMsg(null);
            }}
            className={cn(
              "flex-1 py-2.5 font-medium border-b-2 text-center transition-colors",
              importType === "dbml"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            DBML
          </button>
          <button
            type="button"
            onClick={() => {
              setImportType("sql-postgres");
              setErrorMsg(null);
            }}
            className={cn(
              "flex-1 py-2.5 font-medium border-b-2 text-center transition-colors",
              importType === "sql-postgres"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            PostgreSQL DDL
          </button>
          <button
            type="button"
            onClick={() => {
              setImportType("sql-mysql");
              setErrorMsg(null);
            }}
            className={cn(
              "flex-1 py-2.5 font-medium border-b-2 text-center transition-colors",
              importType === "sql-mysql"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            MySQL DDL
          </button>
          <button
            type="button"
            onClick={() => {
              setImportType("json");
              setErrorMsg(null);
            }}
            className={cn(
              "flex-1 py-2.5 font-medium border-b-2 text-center transition-colors",
              importType === "json"
                ? "border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200",
            )}
          >
            File Cadangan JSON
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 overflow-y-auto text-xs">
          {/* File Upload Box */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
              <Upload className="w-4 h-4 text-blue-500" />
              <span>
                Unggah berkas (
                {importType === "json"
                  ? ".json"
                  : importType === "dbml"
                    ? ".dbml"
                    : ".sql"}
                )
              </span>
            </div>
            <label className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer font-medium transition-colors">
              Pilih Berkas
              <input
                type="file"
                accept={
                  importType === "json"
                    ? ".json"
                    : importType === "dbml"
                      ? ".dbml"
                      : ".sql"
                }
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Textarea */}
          <div className="space-y-1">
            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Atau tempelkan kode skema langsung di bawah:
            </div>
            <textarea
              rows={10}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onPaste={handlePaste}
              placeholder={`Tempelkan kode ${importType.toUpperCase()} di sini...`}
              className="w-full p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs focus:border-blue-500 focus:outline-hidden"
            />
          </div>

          {/* Option: Replace active project vs create new */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="replaceActive"
              checked={replaceActive}
              onChange={(e) => setReplaceActive(e.target.checked)}
              className="rounded text-blue-500"
            />
            <label
              htmlFor="replaceActive"
              className="text-slate-600 dark:text-slate-400 cursor-pointer"
            >
              Gantikan skema pada proyek aktif saat ini (uncheck untuk membuat
              proyek baru)
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Peringatan Kompatibilitas:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <button
            type="button"
            disabled={isProcessing}
            onClick={onClose}
            className="px-4 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={isProcessing}
            onClick={handleImport}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md bg-blue-500 hover:bg-blue-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium text-xs shadow-xs transition-colors"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses Skema...</span>
              </>
            ) : (
              <span>Mulai Impor</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
