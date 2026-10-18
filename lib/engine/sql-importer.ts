import { importer } from "@dbml/core";
import type { DatabaseSchema, Dialect } from "../types/schema";
import { parseDbml } from "./parser";

export interface SqlImportResult {
  success: boolean;
  dbml?: string;
  schema?: DatabaseSchema;
  warnings: string[];
  error?: string;
}

export interface CleanSqlResult {
  cleanSql: string;
  stats: {
    copyBlocks: number;
    insertStatements: number;
    ddlStatementsCount: number;
    skippedLines: number;
  };
}

function isDdlStart(line: string): boolean {
  return /^\s*(CREATE\s+(TEMPORARY\s+|UNLOGGED\s+)?TABLE|ALTER\s+TABLE|CREATE\s+TYPE|CREATE\s+SCHEMA)\b/i.test(
    line,
  );
}

function checkStatementTermination(
  line: string,
  initialQuote: string | null,
): { ends: boolean; nextQuote: string | null } {
  let quote = initialQuote;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nextCh = i + 1 < line.length ? line[i + 1] : "";

    // Ignore SQL line comments outside quotes
    if (!quote && ch === "-" && nextCh === "-") {
      break;
    }

    if (quote) {
      if (ch === quote && line[i - 1] !== "\\") {
        quote = null;
      }
    } else {
      if (ch === "'" || ch === '"' || ch === "`") {
        quote = ch;
      } else if (ch === ";") {
        return { ends: true, nextQuote: null };
      }
    }
  }

  return { ends: false, nextQuote: quote };
}

/**
 * Extracts ONLY DDL statements (CREATE TABLE, ALTER TABLE, CREATE TYPE, CREATE SCHEMA)
 * using a fast single-pass whitelisting scanner.
 * All DML data rows (INSERT INTO, COPY ... FROM stdin, REPLACE INTO, UPDATE),
 * transaction commands (START TRANSACTION, COMMIT), and session variables are skipped,
 * guaranteeing zero backtracking and zero freezing in @dbml/core.
 */
export function cleanSqlForDdl(sql: string): CleanSqlResult {
  const lines = sql.split(/\r?\n/);
  const ddlLines: string[] = [];

  let inDdl = false;
  let quote: string | null = null;
  let ddlStatementsCount = 0;
  let copyBlocks = 0;
  let insertStatements = 0;
  let skippedLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track statistics for user feedback
    if (/^COPY\s+.*?FROM\s+stdin/i.test(trimmed)) {
      copyBlocks++;
    } else if (
      /^INSERT\s+(IGNORE\s+|LOW_PRIORITY\s+|DELAYED\s+|HIGH_PRIORITY\s+)?INTO\b/i.test(
        trimmed,
      ) ||
      /^REPLACE\s+INTO\b/i.test(trimmed)
    ) {
      insertStatements++;
    }

    if (!inDdl) {
      if (isDdlStart(trimmed)) {
        inDdl = true;
        ddlStatementsCount++;
        ddlLines.push(line);
        const res = checkStatementTermination(line, null);
        quote = res.nextQuote;
        if (res.ends) {
          inDdl = false;
        }
      } else {
        skippedLines++;
      }
    } else {
      ddlLines.push(line);
      const res = checkStatementTermination(line, quote);
      quote = res.nextQuote;
      if (res.ends) {
        inDdl = false;
      }
    }
  }

  // If no DDL statements were identified (e.g. arbitrary text or syntax error),
  // return original SQL so that standard error reporting functions as expected
  if (ddlStatementsCount === 0) {
    return {
      cleanSql: sql.trim(),
      stats: {
        copyBlocks,
        insertStatements,
        ddlStatementsCount: 0,
        skippedLines: 0,
      },
    };
  }

  return {
    cleanSql: ddlLines.join("\n"),
    stats: {
      copyBlocks,
      insertStatements,
      ddlStatementsCount,
      skippedLines,
    },
  };
}

/**
 * Extracts accurate line, column, and diagnostic text from @dbml/core ANTLR errors,
 * providing clear Indonesian explanation and fix suggestions.
 */
export function formatSqlParserError(err: any): string {
  if (err && Array.isArray(err.diags) && err.diags.length > 0) {
    const diag = err.diags[0];
    const line = diag.location?.start?.line ?? diag.line ?? diag.originalLine;
    const col =
      diag.location?.start?.column ?? diag.column ?? diag.originalColumn;
    const text = diag.text || diag.message || "";

    let hint = "";
    if (
      text.includes("no viable alternative at input") ||
      text.includes("mismatched input")
    ) {
      hint =
        " (Pernyataan SQL tampak tidak lengkap atau terpotong di awal baris. Pastikan diawali dengan klausa 'ALTER TABLE <nama_tabel>' atau 'CREATE TABLE').";
    }

    if (line !== undefined && col !== undefined) {
      return `Kesalahan sintaks SQL pada baris ${line} kolom ${col}: ${text}${hint}`;
    }
    if (line !== undefined) {
      return `Kesalahan sintaks SQL pada baris ${line}: ${text}${hint}`;
    }
    if (text) {
      return `Kesalahan sintaks SQL: ${text}${hint}`;
    }
  }

  if (err?.message && typeof err.message === "string") {
    return err.message;
  }

  return "Gagal mengimpor DDL SQL. Periksa kesesuaian dialect dan sintaks SQL.";
}

function splitSqlStatements(sql: string): string[] {
  const lines = sql.split(/\r?\n/);
  const statements: string[] = [];
  let currentLines: string[] = [];
  let quote: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    currentLines.push(line);
    const res = checkStatementTermination(line, quote);
    quote = res.nextQuote;
    if (res.ends) {
      const stmt = currentLines.join("\n").trim();
      if (stmt) statements.push(stmt);
      currentLines = [];
    }
  }

  if (currentLines.length > 0) {
    const remaining = currentLines.join("\n").trim();
    if (remaining) statements.push(remaining);
  }

  return statements;
}

/**
 * Normalizes SQL dialect-specific quirks and syntax variations before sending to @dbml/core.
 * E.g., for MySQL/MariaDB:
 * 1. Wraps unparenthesized function defaults in parentheses: DEFAULT curdate() -> DEFAULT (curdate())
 * 2. Strips CHECK (...) constraints which are not part of ERD modeling and break @dbml/core parsing
 */
export function normalizeSqlDialectQuirks(
  sql: string,
  dialect: Dialect,
): string {
  let normalized = sql;

  if (dialect === "mysql") {
    // Wrap function calls in DEFAULT clauses with parentheses if unparenthesized
    // e.g. DEFAULT curdate() -> DEFAULT (curdate()), DEFAULT now() -> DEFAULT (now())
    normalized = normalized.replace(
      /\bDEFAULT\s+([a-zA-Z0-9_]+\s*\([^)]*\))/gi,
      "DEFAULT ($1)",
    );

    // Strip CHECK (...) constraints (both column and table constraints)
    // Matches CHECK ( ... (single-level nested parens) ... )
    normalized = normalized.replace(
      /\bCHECK\s*\((?:[^()]+|\([^()]*\))*\)/gi,
      "",
    );
  }

  return normalized;
}

/**
 * Normalizes generated DBML to ensure full compatibility with Parser.parse(dbml, "dbml"):
 * 1. Multiplicity operators (?<?, ?>?, ?-?)
 * 2. Strips unsupported check: `...` column attributes generated by @dbml/core MySQL importer
 */
export function sanitizeGeneratedDbml(dbml: string): string {
  let clean = dbml.replace(
    /\?\s*([<>-]+)\s*\?|\?\s*([<>-]+)|([<>-]+)\s*\?/g,
    (_match, p1, p2, p3) => {
      const op = p1 || p2 || p3;
      return ` ${op} `;
    },
  );

  // Clean any unsupported check: `...` attributes from column settings
  // Handles: [not null, check: `...`], [check: `...`, not null], [check: `...`]
  clean = clean
    .replace(/,\s*check:\s*`[^`]*`/gi, "")
    .replace(/check:\s*`[^`]*`,\s*/gi, "")
    .replace(/\[\s*check:\s*`[^`]*`\s*\]/gi, "[]");

  return clean;
}

export function importSqlToDbml(
  sqlContent: string,
  dialect: Dialect,
): SqlImportResult {
  const content = sqlContent.trim();
  if (!content) {
    return {
      success: false,
      warnings: [],
      error: "Isi SQL kosong",
    };
  }

  const warnings: string[] = [];

  // Pre-clean SQL to strip data rows, psql commands, and DML before passing to @dbml/core
  const { cleanSql, stats } = cleanSqlForDdl(content);

  if (stats.copyBlocks > 0 || stats.insertStatements > 0) {
    warnings.push(
      `Data baris tabel (${stats.copyBlocks > 0 ? `${stats.copyBlocks} blok COPY` : ""}${stats.copyBlocks > 0 && stats.insertStatements > 0 ? ", " : ""}${stats.insertStatements > 0 ? `${stats.insertStatements} pernyataan INSERT` : ""}) berhasil diabaikan secara otomatis sehingga proses impor berjalan cepat.`,
    );
  }

  // Semantic checks for SQL features that cannot be fully expressed in ERD/DBML
  if (/CREATE\s+TRIGGER/i.test(content)) {
    warnings.push(
      "TRIGGER terdeteksi: Pemicu (triggers) tidak divisualisasikan dalam diagram ERD.",
    );
  }
  if (
    /CREATE\s+(OR\s+REPLACE\s+)?PROCEDURE/i.test(content) ||
    /CREATE\s+(OR\s+REPLACE\s+)?FUNCTION/i.test(content)
  ) {
    warnings.push(
      "STORED PROCEDURE / FUNCTION terdeteksi: Logika prosedur tidak dimasukkan ke dalam skema tabel.",
    );
  }
  if (/CREATE\s+(OR\s+REPLACE\s+)?VIEW/i.test(content)) {
    warnings.push(
      "VIEW terdeteksi: Tampilan (views) mungkin diabaikan atau disederhanakan oleh parser DBML.",
    );
  }
  if (/PARTITION\s+BY/i.test(content)) {
    warnings.push(
      "PARTITION BY terdeteksi: Partisi tabel tidak didukung dalam DBML dan telah diabaikan.",
    );
  }

  const normalizedSql = normalizeSqlDialectQuirks(cleanSql, dialect);

  try {
    let dbml = importer.import(normalizedSql, dialect);
    dbml = sanitizeGeneratedDbml(dbml);
    const parseRes = parseDbml(dbml, dialect);

    if (!parseRes.success || !parseRes.schema) {
      const errMsg = parseRes.diagnostics.map((d) => d.message).join("; ");
      return {
        success: false,
        warnings,
        error: `Gagal mem-parse hasil konversi DBML: ${errMsg}`,
      };
    }

    if (
      parseRes.schema.tables.length === 0 &&
      parseRes.schema.relations.length === 0
    ) {
      return {
        success: false,
        warnings,
        error:
          "Tidak ditemukan deklarasi tabel ('CREATE TABLE') dalam kode SQL yang diimpor. Pastikan Anda menyertakan definisi tabel ('CREATE TABLE'), bukan hanya deklarasi constraint 'ALTER TABLE'.",
      };
    }

    return {
      success: true,
      dbml,
      schema: parseRes.schema,
      warnings,
    };
  } catch (err: any) {
    // Attempt tolerant per-statement recovery if input contains multiple statements
    const statements = splitSqlStatements(normalizedSql);
    if (statements.length > 1) {
      const validDbmlChunks: string[] = [];
      const skippedCount: number[] = [];

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        try {
          const chunk = importer.import(stmt, dialect);
          if (chunk?.trim()) {
            validDbmlChunks.push(sanitizeGeneratedDbml(chunk.trim()));
          }
        } catch {
          skippedCount.push(i + 1);
        }
      }

      if (validDbmlChunks.length > 0) {
        const mergedDbml = validDbmlChunks.join("\n\n");
        const parseRes = parseDbml(mergedDbml, dialect);
        if (
          parseRes.success &&
          parseRes.schema &&
          parseRes.schema.tables.length > 0
        ) {
          if (skippedCount.length > 0) {
            warnings.push(
              `Sebagian skema berhasil dipulihkan (${parseRes.schema.tables.length} tabel). Peringatan: ${skippedCount.length} pernyataan SQL diabaikan karena sintaks tidak lengkap atau terpotong (statement #${skippedCount.join(", #")}).`,
            );
          }
          return {
            success: true,
            dbml: mergedDbml,
            schema: parseRes.schema,
            warnings,
          };
        }
      }
    }

    return {
      success: false,
      warnings,
      error: formatSqlParserError(err),
    };
  }
}
