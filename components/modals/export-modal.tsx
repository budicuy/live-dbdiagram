"use client";

import {
  Check,
  Copy,
  Download,
  FileCode2,
  FileDown,
  FileText,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  Palette,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  type CanvasBackgroundOption,
  type CanvasPaddingOption,
  calculateEstimatedDimensions,
  exportDiagram,
  getDiagramBounds,
  type ImageExportFormat,
  type ImageResolutionScale,
  type PdfOrientation,
  type PdfPaperSize,
} from "../../lib/engine/canvas-exporter";
import { exportDbmlToSql } from "../../lib/engine/sql-exporter";
import { useProjectStore } from "../../lib/store/use-project-store";
import { cn } from "../../lib/utils";

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

type MainCategory = "visual" | "code";
type CodeExportType = "sql-postgres" | "sql-mysql" | "dbml" | "json";

const SCALE_OPTIONS: {
  id: ImageResolutionScale;
  label: string;
  desc: string;
}[] = [
  { id: 1, label: "1x", desc: "Standar (72 DPI)" },
  { id: 2, label: "2x", desc: "Retina / HD (144 DPI)" },
  { id: 3, label: "3x", desc: "Ultra HD (216 DPI)" },
  { id: 4, label: "4x", desc: "Kualitas Cetak (300 DPI)" },
];

const PADDING_OPTIONS: { id: CanvasPaddingOption; label: string }[] = [
  { id: 20, label: "20px (Kompak)" },
  { id: 50, label: "50px (Normal)" },
  { id: 100, label: "100px (Luas)" },
];

const PDF_SIZES: { id: PdfPaperSize; label: string }[] = [
  { id: "fit", label: "Ukuran Diagram (Fit)" },
  { id: "a4", label: "A4 (Standar)" },
  { id: "a3", label: "A3 (Besar)" },
  { id: "letter", label: "US Letter" },
];

const PDF_ORIENTATIONS: { id: PdfOrientation; label: string }[] = [
  { id: "auto", label: "Otomatis (Auto)" },
  { id: "landscape", label: "Lanskap (Landscape)" },
  { id: "portrait", label: "Potret (Portrait)" },
];

export function ExportModal({ open, onClose }: ExportModalProps) {
  const project = useProjectStore((s) => s.project);
  const theme = useProjectStore((s) => s.ui.theme);

  // Category
  const [activeCategory, setActiveCategory] = useState<MainCategory>("visual");

  // Visual Export Options
  const [imageFormat, setImageFormat] = useState<ImageExportFormat>("png");
  const [scale, setScale] = useState<ImageResolutionScale>(2);
  const [background, setBackground] =
    useState<CanvasBackgroundOption>("transparent");
  const [padding, setPadding] = useState<CanvasPaddingOption>(50);
  const [pdfSize, setPdfSize] = useState<PdfPaperSize>("fit");
  const [pdfOrientation, setPdfOrientation] = useState<PdfOrientation>("auto");
  const [isExportingImage, setIsExportingImage] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Code Export Options
  const [codeType, setCodeType] = useState<CodeExportType>("sql-postgres");
  const [copied, setCopied] = useState(false);

  // Set default background based on current theme when modal opens
  useEffect(() => {
    if (open) {
      setExportError(null);
      setBackground(theme === "dark" ? "dark" : "light");
    }
  }, [open, theme]);

  // Code Export Content
  const exportedContent = useMemo(() => {
    if (!project) return "";
    try {
      if (codeType === "dbml") {
        return project.dbml;
      }
      if (codeType === "sql-postgres") {
        return exportDbmlToSql(project.dbml, "postgres");
      }
      if (codeType === "sql-mysql") {
        return exportDbmlToSql(project.dbml, "mysql");
      }
      if (codeType === "json") {
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
  }, [project, codeType]);

  // Estimated Dimensions calculation
  const dimensions = useMemo(() => {
    if (!open)
      return {
        width: 1200,
        height: 800,
        scaledWidth: 2400,
        scaledHeight: 1600,
      };
    const bounds = getDiagramBounds(
      project?.schema.tables.map((t) => ({
        name: t.name,
        columnCount: t.columns.length,
      })),
      project?.metadata.positions,
    );
    const count = project?.schema.tables.length || 2;
    return calculateEstimatedDimensions(count, padding, scale, bounds);
  }, [open, project, padding, scale]);

  if (!open) return null;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(exportedContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Gagal menyalin ke clipboard:", err);
    }
  };

  const handleDownloadCode = () => {
    if (!project) return;
    const filenameBase =
      project.name.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "database";
    let extension = "sql";
    let mimeType = "text/plain";

    if (codeType === "dbml") {
      extension = "dbml";
    } else if (codeType === "json") {
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

  const handleDownloadVisual = async () => {
    if (!project) return;
    setIsExportingImage(true);
    setExportError(null);

    const filenameBase =
      project.name.toLowerCase().replace(/[^a-z0-9_-]/g, "_") || "diagram";

    const customBounds = getDiagramBounds(
      project.schema.tables.map((t) => ({
        name: t.name,
        columnCount: t.columns.length,
      })),
      project.metadata.positions,
    );

    try {
      await exportDiagram({
        format: imageFormat,
        scale,
        background,
        padding,
        pdfSize,
        pdfOrientation,
        filename: `${filenameBase}_${imageFormat}`,
        customBounds,
      });
      onClose();
    } catch (err: any) {
      console.error("Gagal mengekspor diagram:", err);
      setExportError(
        err?.message || "Terjadi kesalahan saat mengekspor gambar diagram.",
      );
    } finally {
      setIsExportingImage(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-2xl rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400">
              <FileDown className="w-4 h-4" />
            </div>
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                Ekspor & Unduh Proyek
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Unduh diagram visual (PNG, WEBP, SVG, PDF) atau kode skema (SQL,
                DBML, JSON)
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Primary Category Switcher */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs gap-1">
          <button
            type="button"
            onClick={() => setActiveCategory("visual")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all cursor-pointer",
              activeCategory === "visual"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-800"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Diagram Visual (Gambar & PDF)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("code")}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-all cursor-pointer",
              activeCategory === "code"
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-800"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200",
            )}
          >
            <FileCode2 className="w-4 h-4" />
            <span>Skema & Kode (SQL / DBML / JSON)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
          {activeCategory === "visual" ? (
            /* Visual Export Panel */
            <div className="space-y-4">
              {/* 1. Format Selection */}
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                  <span>Format Unduhan:</span>
                  <span className="text-[11px] font-normal text-slate-400 uppercase font-mono">
                    .{imageFormat}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setImageFormat("png")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1",
                      imageFormat === "png"
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">PNG</span>
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Lossless, jernih & transparan
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageFormat("webp")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1",
                      imageFormat === "webp"
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">WEBP</span>
                      <Sparkles className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Ukuran sangat ringan & tajam
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageFormat("svg")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1",
                      imageFormat === "svg"
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">SVG</span>
                      <Maximize2 className="w-4 h-4 text-amber-500" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Vektor, zoom tanpa batas
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setImageFormat("pdf")}
                    className={cn(
                      "p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1",
                      imageFormat === "pdf"
                        ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">PDF</span>
                      <FileText className="w-4 h-4 text-rose-500" />
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Dokumen cetak & arsip
                    </span>
                  </button>
                </div>
              </div>

              {/* 2. Resolution & Scaling (for PNG, WEBP, PDF) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Resolusi / Kerapatan Pixel (Scale):
                  </div>
                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-medium">
                    {dimensions.scaledWidth} × {dimensions.scaledHeight} px
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {SCALE_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setScale(opt.id)}
                      className={cn(
                        "py-2 px-2.5 rounded-lg border text-center transition-all cursor-pointer",
                        scale === opt.id
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 font-semibold"
                          : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                      )}
                    >
                      <div className="text-xs font-bold">{opt.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal truncate">
                        {opt.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Background Color */}
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-blue-500" />
                  <span>Warna Latar Belakang (Background):</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBackground("dark")}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                      background === "dark"
                        ? "bg-slate-900 border-blue-500 text-white shadow-xs ring-2 ring-blue-500/20"
                        : "bg-slate-900/90 border-slate-800 text-slate-400 hover:text-white",
                    )}
                  >
                    <span className="w-3 h-3 rounded-full bg-slate-900 border border-slate-700" />
                    <span>Mode Gelap</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBackground("light")}
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                      background === "light"
                        ? "bg-white border-blue-500 text-slate-900 shadow-xs ring-2 ring-blue-500/20"
                        : "bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900",
                    )}
                  >
                    <span className="w-3 h-3 rounded-full bg-white border border-slate-300" />
                    <span>Mode Terang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBackground("transparent")}
                    disabled={imageFormat === "pdf"}
                    title={
                      imageFormat === "pdf"
                        ? "Format PDF menggunakan latar putih"
                        : "Latar belakang transparan"
                    }
                    className={cn(
                      "flex items-center justify-center gap-2 py-2 rounded-lg border text-xs font-medium transition-all cursor-pointer",
                      imageFormat === "pdf" &&
                        "opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 text-slate-400",
                      background === "transparent" && imageFormat !== "pdf"
                        ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400 shadow-xs ring-2 ring-blue-500/20"
                        : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300",
                    )}
                  >
                    <span className="w-3 h-3 rounded-full border border-dashed border-slate-400 bg-transparent" />
                    <span>Transparan</span>
                  </button>
                </div>
              </div>

              {/* 4. Canvas Padding */}
              <div className="space-y-1.5">
                <div className="font-semibold text-slate-800 dark:text-slate-200">
                  Margin / Padding Tepi Diagram:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {PADDING_OPTIONS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPadding(p.id)}
                      className={cn(
                        "py-1.5 px-3 rounded-lg border text-center transition-all cursor-pointer font-medium text-xs",
                        padding === p.id
                          ? "bg-blue-50 dark:bg-blue-950/60 border-blue-500 text-blue-600 dark:text-blue-400"
                          : "bg-white dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800",
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. PDF Options (if PDF chosen) */}
              {imageFormat === "pdf" && (
                <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-950/80 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                  <div className="font-semibold text-rose-950 dark:text-rose-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-rose-500" />
                    <span>Pengaturan Halaman PDF:</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Ukuran Kertas:
                      </span>
                      <div className="grid grid-cols-2 gap-1">
                        {PDF_SIZES.map((sz) => (
                          <button
                            key={sz.id}
                            type="button"
                            onClick={() => setPdfSize(sz.id)}
                            className={cn(
                              "py-1 px-2 rounded-md border text-[11px] font-medium transition-colors text-center",
                              pdfSize === sz.id
                                ? "bg-rose-500 text-white border-rose-600"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
                            )}
                          >
                            {sz.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        Orientasi:
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {PDF_ORIENTATIONS.map((or) => (
                          <button
                            key={or.id}
                            type="button"
                            onClick={() => setPdfOrientation(or.id)}
                            className={cn(
                              "py-1 px-1 rounded-md border text-[10px] font-medium transition-colors text-center truncate",
                              pdfOrientation === or.id
                                ? "bg-rose-500 text-white border-rose-600"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300",
                            )}
                          >
                            {or.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {exportError && (
                <div className="p-2.5 rounded-lg bg-red-100 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs">
                  {exportError}
                </div>
              )}

              {/* Visual Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadVisual}
                  disabled={isExportingImage}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isExportingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sedang Merender Diagram...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span>
                        Unduh Diagram {imageFormat.toUpperCase()} ({scale}x)
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Code / DDL Export Panel */
            <div className="space-y-3 flex flex-col h-full">
              {/* Code Tabs */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setCodeType("sql-postgres")}
                  className={cn(
                    "py-1.5 rounded-md font-medium text-center transition-all cursor-pointer",
                    codeType === "sql-postgres"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200",
                  )}
                >
                  PostgreSQL DDL
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType("sql-mysql")}
                  className={cn(
                    "py-1.5 rounded-md font-medium text-center transition-all cursor-pointer",
                    codeType === "sql-mysql"
                      ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200",
                  )}
                >
                  MySQL DDL
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType("dbml")}
                  className={cn(
                    "py-1.5 rounded-md font-medium text-center transition-all cursor-pointer",
                    codeType === "dbml"
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200",
                  )}
                >
                  DBML
                </button>
                <button
                  type="button"
                  onClick={() => setCodeType("json")}
                  className={cn(
                    "py-1.5 rounded-md font-medium text-center transition-all cursor-pointer",
                    codeType === "json"
                      ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200",
                  )}
                >
                  Backup JSON
                </button>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <span>Pratinjau Kode:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    <span>{copied ? "Tersalin!" : "Salin Kode"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadCode}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh File</span>
                  </button>
                </div>
              </div>

              {/* Code Pre Area */}
              <pre className="flex-1 w-full min-h-[220px] max-h-[360px] p-3 rounded-xl bg-slate-900 text-slate-200 border border-slate-800 font-mono text-xs overflow-auto select-text leading-relaxed">
                {exportedContent}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-xs">
          <span className="text-slate-400">
            Proyek:{" "}
            <strong className="text-slate-600 dark:text-slate-300">
              {project?.name}
            </strong>{" "}
            ({project?.schema.tables.length || 0} tabel)
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
