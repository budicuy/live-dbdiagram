import { toCanvas, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";

export type ImageExportFormat = "png" | "webp" | "svg" | "pdf";
export type ImageResolutionScale = 1 | 2 | 3 | 4;
export type CanvasBackgroundOption = "dark" | "light" | "transparent";
export type CanvasPaddingOption = 20 | 50 | 100;
export type PdfPaperSize = "fit" | "a4" | "a3" | "letter";
export type PdfOrientation = "auto" | "landscape" | "portrait";

export interface CanvasExportOptions {
  format: ImageExportFormat;
  scale: ImageResolutionScale;
  background: CanvasBackgroundOption;
  padding: CanvasPaddingOption;
  quality?: number; // 0.1 - 1.0 (for webp)
  pdfSize?: PdfPaperSize;
  pdfOrientation?: PdfOrientation;
  filename?: string;
  customBounds?: DiagramBounds | null;
}

export interface DiagramBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FallbackTableInfo {
  name: string;
  columnCount?: number;
}

export interface ExportTransform {
  x: number;
  y: number;
  zoom: number;
  width: number;
  height: number;
}

export function calculateExportTransform(
  bounds: DiagramBounds,
  padding: number,
): ExportTransform {
  const width = Math.max(300, Math.round(bounds.width + padding * 2));
  const height = Math.max(200, Math.round(bounds.height + padding * 2));
  return {
    x: Math.round(-bounds.x + padding),
    y: Math.round(-bounds.y + padding),
    zoom: 1,
    width,
    height,
  };
}

export function getDiagramBounds(
  tables?: FallbackTableInfo[],
  positions?: Record<string, { x: number; y: number }>,
): DiagramBounds | null {
  if (typeof document !== "undefined") {
    const nodes = document.querySelectorAll(".react-flow__node");
    if (nodes && nodes.length > 0) {
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      nodes.forEach((node) => {
        const el = node as HTMLElement;
        const transform = el.style.transform;
        const match = /translate(?:3d)?\((-?[\d.]+)px,\s*(-?[\d.]+)px/.exec(
          transform,
        );
        if (match) {
          const x = Number.parseFloat(match[1]);
          const y = Number.parseFloat(match[2]);
          const w = el.offsetWidth || 260;
          const h = el.offsetHeight || 180;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + w);
          maxY = Math.max(maxY, y + h);
        }
      });

      if (minX !== Infinity && maxX > minX && maxY > minY) {
        return {
          x: minX,
          y: minY,
          width: Math.max(200, maxX - minX),
          height: Math.max(150, maxY - minY),
        };
      }
    }
  }

  // Fallback using table positions and column metadata
  if (positions && Object.keys(positions).length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const [name, pos] of Object.entries(positions)) {
      if (typeof pos?.x === "number" && typeof pos?.y === "number") {
        const table = tables?.find((t) => t.name === name);
        const colCount = table?.columnCount ?? 4;
        const width = 280;
        const height = Math.max(120, 48 + colCount * 28);

        minX = Math.min(minX, pos.x);
        minY = Math.min(minY, pos.y);
        maxX = Math.max(maxX, pos.x + width);
        maxY = Math.max(maxY, pos.y + height);
      }
    }

    if (minX !== Infinity && maxX > minX && maxY > minY) {
      return {
        x: minX,
        y: minY,
        width: Math.max(200, maxX - minX),
        height: Math.max(150, maxY - minY),
      };
    }
  }

  return null;
}

export const getDiagramBoundsFromDom = getDiagramBounds;

export function calculateEstimatedDimensions(
  tableCount: number,
  padding: number,
  scale: number,
  customBounds?: DiagramBounds | null,
): {
  width: number;
  height: number;
  scaledWidth: number;
  scaledHeight: number;
} {
  const baseWidth = customBounds?.width
    ? customBounds.width + padding * 2
    : Math.max(1000, tableCount * 280);
  const baseHeight = customBounds?.height
    ? customBounds.height + padding * 2
    : Math.max(700, tableCount * 200);

  const roundWidth = Math.round(baseWidth);
  const roundHeight = Math.round(baseHeight);

  return {
    width: roundWidth,
    height: roundHeight,
    scaledWidth: roundWidth * scale,
    scaledHeight: roundHeight * scale,
  };
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement("a");
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportDiagram(
  options: CanvasExportOptions,
): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Ekspor hanya didukung di lingkungan browser.");
  }

  const viewport = document.querySelector(
    ".react-flow__viewport",
  ) as HTMLElement;
  if (!viewport) {
    throw new Error("Elemen kanvas diagram tidak ditemukan.");
  }

  const domBounds = options.customBounds || getDiagramBounds();
  const bounds = domBounds || { x: 0, y: 0, width: 1200, height: 800 };

  const {
    width: imageWidth,
    height: imageHeight,
    x,
    y,
    zoom,
  } = calculateExportTransform(bounds, options.padding);

  let backgroundColor: string | undefined;
  if (options.background === "dark") {
    backgroundColor = "#0f172a";
  } else if (options.background === "light") {
    backgroundColor = "#ffffff";
  } else {
    backgroundColor = options.format === "pdf" ? "#ffffff" : undefined;
  }

  const baseFilename = options.filename?.trim() || "diagram";

  const filterFn = (node: HTMLElement) => {
    const cl = node?.classList;
    if (!cl) return true;
    return (
      !cl.contains("react-flow__controls") &&
      !cl.contains("react-flow__minimap")
    );
  };

  const commonHtmlToImageOptions = {
    backgroundColor,
    width: imageWidth,
    height: imageHeight,
    style: {
      width: `${imageWidth}px`,
      height: `${imageHeight}px`,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      transformOrigin: "0 0",
    },
    filter: filterFn as any,
  };

  if (options.format === "svg") {
    const dataUrl = await toSvg(viewport, commonHtmlToImageOptions);
    triggerDownload(dataUrl, `${baseFilename}.svg`);
    return;
  }

  if (options.format === "png") {
    const canvas = await toCanvas(viewport, {
      ...commonHtmlToImageOptions,
      pixelRatio: options.scale,
    });
    const dataUrl = canvas.toDataURL("image/png");
    triggerDownload(dataUrl, `${baseFilename}.png`);
    return;
  }

  if (options.format === "webp") {
    const canvas = await toCanvas(viewport, {
      ...commonHtmlToImageOptions,
      backgroundColor: backgroundColor || "#ffffff",
      pixelRatio: options.scale,
    });
    const dataUrl = canvas.toDataURL("image/webp", options.quality || 0.95);
    triggerDownload(dataUrl, `${baseFilename}.webp`);
    return;
  }

  if (options.format === "pdf") {
    const canvas = await toCanvas(viewport, {
      ...commonHtmlToImageOptions,
      backgroundColor: backgroundColor || "#ffffff",
      pixelRatio: Math.max(2, options.scale),
    });

    const imgData = canvas.toDataURL("image/png");
    const isLandscape = imageWidth >= imageHeight;
    const orientation =
      options.pdfOrientation === "auto"
        ? isLandscape
          ? "landscape"
          : "portrait"
        : options.pdfOrientation || "landscape";

    const pdfSize = options.pdfSize || "fit";

    let pdf: jsPDF;
    if (pdfSize === "fit") {
      pdf = new jsPDF({
        orientation: orientation === "landscape" ? "l" : "p",
        unit: "px",
        format: [imageWidth, imageHeight],
      });
      pdf.addImage(imgData, "PNG", 0, 0, imageWidth, imageHeight);
    } else {
      pdf = new jsPDF({
        orientation: orientation === "landscape" ? "l" : "p",
        unit: "mm",
        format: pdfSize,
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availW = pageWidth - margin * 2;
      const availH = pageHeight - margin * 2;
      const imgRatio = imageWidth / imageHeight;
      const pageRatio = availW / availH;

      let finalW = availW;
      let finalH = availH;
      if (imgRatio > pageRatio) {
        finalH = availW / imgRatio;
      } else {
        finalW = availH * imgRatio;
      }

      const posX = margin + (availW - finalW) / 2;
      const posY = margin + (availH - finalH) / 2;
      pdf.addImage(imgData, "PNG", posX, posY, finalW, finalH);
    }

    pdf.save(`${baseFilename}.pdf`);
  }
}
