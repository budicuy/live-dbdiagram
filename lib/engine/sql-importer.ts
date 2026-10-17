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

  try {
    let dbml = importer.import(content, dialect);
    // Normalize extended DBML multiplicity operators (e.g. ?<?, ?>?, ?-?) into standard operators
    dbml = dbml.replace(
      /\?\s*([<>-]+)\s*\?|\?\s*([<>-]+)|([<>-]+)\s*\?/g,
      (_match, p1, p2, p3) => {
        const op = p1 || p2 || p3;
        return ` ${op} `;
      },
    );
    const parseRes = parseDbml(dbml, dialect);

    if (!parseRes.success || !parseRes.schema) {
      const errMsg = parseRes.diagnostics.map((d) => d.message).join("; ");
      return {
        success: false,
        warnings,
        error: `Gagal mem-parse hasil konversi DBML: ${errMsg}`,
      };
    }

    return {
      success: true,
      dbml,
      schema: parseRes.schema,
      warnings,
    };
  } catch (err: any) {
    return {
      success: false,
      warnings,
      error:
        err?.message ||
        "Gagal mengimpor DDL SQL. Periksa kesesuaian dialect dan sintaks SQL.",
    };
  }
}
