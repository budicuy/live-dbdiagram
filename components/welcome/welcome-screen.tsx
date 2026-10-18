"use client";

import {
  ArrowRight,
  Clock,
  Database,
  FileCode2,
  FileUp,
  FolderOpen,
  Layers,
  Moon,
  Sparkles,
  Sun,
  Table2,
} from "lucide-react";
import { useState } from "react";
import { SiMysql, SiPostgresql } from "react-icons/si";
import { useProjectStore } from "../../lib/store/use-project-store";
import type { Dialect } from "../../lib/types/schema";
import { cn } from "../../lib/utils";
import { ImportModal } from "../modals/import-modal";

export function WelcomeScreen() {
  const projectsList = useProjectStore((s) => s.projectsList);
  const startProjectFromWelcome = useProjectStore(
    (s) => s.startProjectFromWelcome,
  );
  const switchProject = useProjectStore((s) => s.switchProject);
  const theme = useProjectStore((s) => s.ui.theme);
  const toggleTheme = useProjectStore((s) => s.toggleTheme);

  const [selectedDialect, setSelectedDialect] = useState<Dialect>("postgres");
  const [projectName, setProjectName] = useState("");
  const [templateType, setTemplateType] = useState<"sample" | "blank">(
    "sample",
  );
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateNew = async () => {
    setIsCreating(true);
    try {
      await startProjectFromWelcome(projectName, selectedDialect, templateType);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white relative overflow-x-hidden">
      {/* Background Glow Accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-87.5 bg-linear-to-b from-blue-500/10 via-indigo-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* Top Bar Header */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-500 text-white shadow-md shadow-blue-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight flex items-center gap-2">
              <span>Live DB Diagram</span>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                v2.0
              </span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Visual Database Designer & Entity Relationship Diagram
            </div>
          </div>
        </div>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          title={
            theme === "dark"
              ? "Ganti ke Tema Terang (Light)"
              : "Ganti ke Tema Gelap (Dark)"
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors text-xs cursor-pointer"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-blue-500" />
              <span>Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-4xl mx-auto px-6 py-6 flex-1 flex flex-col justify-center">
        {/* Hero Title */}
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50">
            Selamat Datang di{" "}
            <span className="bg-linear-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
              Live DB Diagram
            </span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
            Rancang skema database, visualisasikan relasi tabel, dan ekspor kode
            SQL secara real-time. Pilih database untuk memulai.
          </p>
        </div>

        {/* Step 1: Database Engine Selection */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[11px]">
              1
            </span>
            <span>Pilih Mesin Database</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PostgreSQL Card */}
            <div
              onClick={() => setSelectedDialect("postgres")}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative",
                selectedDialect === "postgres"
                  ? "bg-white dark:bg-slate-900 border-blue-500 ring-2 ring-blue-500/20 shadow-md shadow-blue-500/5"
                  : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#336791]/10 dark:bg-[#336791]/20 text-[#336791] dark:text-[#5896cb] shrink-0">
                      <SiPostgresql className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        PostgreSQL
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Object-Relational DBMS
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                      selectedDialect === "postgres"
                        ? "border-blue-500 bg-blue-500"
                        : "border-slate-300 dark:border-slate-700",
                    )}
                  >
                    {selectedDialect === "postgres" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Mendukung UUID, JSONB, schema namespaces, enum types, array,
                  dan foreign key constraints canggih.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  SERIAL / IDENTITY
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  TIMESTAMPTZ
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  JSONB
                </span>
              </div>
            </div>

            {/* MySQL Card */}
            <div
              onClick={() => setSelectedDialect("mysql")}
              className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between relative",
                selectedDialect === "mysql"
                  ? "bg-white dark:bg-slate-900 border-amber-500 ring-2 ring-amber-500/20 shadow-md shadow-amber-500/5"
                  : "bg-white/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700",
              )}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[#00758F]/10 dark:bg-[#00758F]/20 text-[#00758F] dark:text-[#00a6cb] shrink-0">
                      <SiMysql className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        MySQL
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Relational DBMS
                      </div>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "w-4 h-4 rounded-full border flex items-center justify-center transition-colors",
                      selectedDialect === "mysql"
                        ? "border-amber-500 bg-amber-500"
                        : "border-slate-300 dark:border-slate-700",
                    )}
                  >
                    {selectedDialect === "mysql" && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Mendukung AUTO_INCREMENT, backtick syntax, storage engine
                  InnoDB, dan query relasional berkecepatan tinggi.
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  AUTO_INCREMENT
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  DATETIME
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  VARCHAR
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Choose Action */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[11px]">
              2
            </span>
            <span>Pilih Metode Memulai</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Action Card A: New Diagram */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Buat Diagram Baru
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Mulai dari kanvas kosong atau template sampel
                    </div>
                  </div>
                </div>

                {/* Project Name Input */}
                <div className="space-y-1">
                  <label
                    htmlFor="welcome-project-name"
                    className="text-[11px] font-medium text-slate-600 dark:text-slate-400"
                  >
                    Nama Diagram (Opsional)
                  </label>
                  <input
                    id="welcome-project-name"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder={`e.g. Proyek ${
                      selectedDialect === "postgres" ? "PostgreSQL" : "MySQL"
                    }`}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs focus:border-blue-500 focus:outline-hidden"
                  />
                </div>

                {/* Template Selector */}
                <div className="space-y-1">
                  <div className="text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    Template Skema Awal
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTemplateType("sample")}
                      className={cn(
                        "py-2 px-2.5 rounded-lg border text-xs font-medium text-left transition-colors flex items-center gap-2",
                        templateType === "sample"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400",
                      )}
                    >
                      <Layers className="w-3.5 h-3.5 shrink-0" />
                      <div className="truncate">
                        <div className="truncate font-semibold">
                          Skema Sampel
                        </div>
                        <div className="text-[10px] opacity-70 truncate">
                          5 Tabel & Relasi
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTemplateType("blank")}
                      className={cn(
                        "py-2 px-2.5 rounded-lg border text-xs font-medium text-left transition-colors flex items-center gap-2",
                        templateType === "blank"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
                          : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 text-slate-600 dark:text-slate-400",
                      )}
                    >
                      <FileCode2 className="w-3.5 h-3.5 shrink-0" />
                      <div className="truncate">
                        <div className="truncate font-semibold">
                          Kanvas Kosong
                        </div>
                        <div className="text-[10px] opacity-70 truncate">
                          Mulai dari Nol
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateNew}
                disabled={isCreating}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <span>Mulai Buat Diagram</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Action Card B: Import Schema */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
                    <FileUp className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      Impor Skema / DDL
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Konversi SQL atau DBML yang sudah ada
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="font-medium text-slate-800 dark:text-slate-200">
                    Mendukung berbagai format:
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    <li>SQL DDL PostgreSQL (`CREATE TABLE`, `ALTER TABLE`)</li>
                    <li>SQL DDL MySQL (InnoDB, primary/foreign keys)</li>
                    <li>Berkas skema DBML (`.dbml`)</li>
                    <li>Berkas cadangan JSON Proyek Live DB Diagram</li>
                  </ul>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setImportModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors cursor-pointer"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Buka Dialog Impor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Step 3: Recent Saved Projects (If Available) */}
        {projectsList.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-blue-500" />
                <span>
                  Atau Lanjutkan Proyek Tersimpan ({projectsList.length})
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {projectsList.slice(0, 6).map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => switchProject(proj.id)}
                  className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xs transition-all cursor-pointer space-y-2 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-500 transition-colors">
                      {proj.name}
                    </div>
                    <span
                      className={cn(
                        "text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase inline-flex items-center gap-1",
                        proj.dialect === "postgres"
                          ? "bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                          : "bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400",
                      )}
                    >
                      {proj.dialect === "postgres" ? (
                        <SiPostgresql className="w-2.5 h-2.5" />
                      ) : (
                        <SiMysql className="w-2.5 h-2.5" />
                      )}
                      <span>{proj.dialect}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Table2 className="w-3 h-3" />
                      <span>{proj.schema.tables.length} tabel</span>
                    </span>
                    <span className="flex items-center gap-1 text-[10px]">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(proj.updatedAt)}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-4 text-center text-xs text-slate-400 dark:text-slate-500">
        Live DB Diagram • Local-first, private & secure in your browser
      </footer>

      {/* Import Modal */}
      <ImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
      />
    </div>
  );
}
