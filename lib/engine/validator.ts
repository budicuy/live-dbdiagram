import { getSuggestedDataTypes, isValidDataType } from "../types/data-types";
import type {
  DatabaseSchema,
  Dialect,
  SchemaDiagnostic,
} from "../types/schema";

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function findTableLocation(
  dbmlLines: string[],
  tableName: string,
): { line: number; column: number } {
  if (dbmlLines.length === 0) return { line: 1, column: 1 };
  const regex = new RegExp(
    `^\\s*Table\\s+["']?${escapeRegex(tableName)}["']?\\b`,
    "i",
  );
  for (let i = 0; i < dbmlLines.length; i++) {
    if (regex.test(dbmlLines[i])) {
      const colIndex = dbmlLines[i].indexOf(tableName);
      return { line: i + 1, column: colIndex >= 0 ? colIndex + 1 : 1 };
    }
  }
  return { line: 1, column: 1 };
}

function findColumnLocation(
  dbmlLines: string[],
  tableName: string,
  columnName: string,
): { line: number; column: number } {
  if (dbmlLines.length === 0) return { line: 1, column: 1 };
  const tableRegex = new RegExp(
    `^\\s*Table\\s+["']?${escapeRegex(tableName)}["']?\\b`,
    "i",
  );
  let inTable = false;
  let braceCount = 0;

  for (let i = 0; i < dbmlLines.length; i++) {
    const lineText = dbmlLines[i];
    if (!inTable && tableRegex.test(lineText)) {
      inTable = true;
    }

    if (inTable) {
      if (lineText.includes("{")) braceCount++;
      const trimmed = lineText.trim();
      const colRegex = new RegExp(
        `^["']?${escapeRegex(columnName)}["']?\\b`,
        "i",
      );
      if (
        colRegex.test(trimmed) &&
        !trimmed.startsWith("Table") &&
        !trimmed.startsWith("indexes") &&
        !trimmed.startsWith("Note")
      ) {
        const colIndex = lineText.indexOf(columnName);
        return { line: i + 1, column: colIndex >= 0 ? colIndex + 1 : 1 };
      }
      if (lineText.includes("}")) {
        braceCount--;
        if (braceCount <= 0) {
          inTable = false;
        }
      }
    }
  }
  return findTableLocation(dbmlLines, tableName);
}

function findColumnTypeLocation(
  dbmlLines: string[],
  tableName: string,
  columnName: string,
  colType: string,
): { line: number; column: number } {
  if (dbmlLines.length === 0) return { line: 1, column: 1 };
  const tableRegex = new RegExp(
    `^\\s*Table\\s+["']?${escapeRegex(tableName)}["']?\\b`,
    "i",
  );
  let inTable = false;
  let braceCount = 0;

  for (let i = 0; i < dbmlLines.length; i++) {
    const lineText = dbmlLines[i];
    if (!inTable && tableRegex.test(lineText)) {
      inTable = true;
    }

    if (inTable) {
      if (lineText.includes("{")) braceCount++;
      const trimmed = lineText.trim();
      const colRegex = new RegExp(
        `^["']?${escapeRegex(columnName)}["']?\\b`,
        "i",
      );
      if (
        colRegex.test(trimmed) &&
        !trimmed.startsWith("Table") &&
        !trimmed.startsWith("indexes") &&
        !trimmed.startsWith("Note")
      ) {
        const typeIndex = lineText.indexOf(colType);
        if (typeIndex >= 0) {
          return { line: i + 1, column: typeIndex + 1 };
        }
        const colIndex = lineText.indexOf(columnName);
        return { line: i + 1, column: colIndex >= 0 ? colIndex + 1 : 1 };
      }
      if (lineText.includes("}")) {
        braceCount--;
        if (braceCount <= 0) {
          inTable = false;
        }
      }
    }
  }
  return findTableLocation(dbmlLines, tableName);
}

function findRelationLocation(
  dbmlLines: string[],
  sourceTable: string,
  sourceCol: string,
  targetTable: string,
  targetCol: string,
): { line: number; column: number } {
  if (dbmlLines.length === 0) return { line: 1, column: 1 };
  const sPattern = `${escapeRegex(sourceTable)}\\.${escapeRegex(sourceCol)}`;
  const tPattern = `${escapeRegex(targetTable)}\\.${escapeRegex(targetCol)}`;
  const relRegex = new RegExp(
    `(${sPattern}.*${tPattern}|${tPattern}.*${sPattern})`,
    "i",
  );

  for (let i = 0; i < dbmlLines.length; i++) {
    if (relRegex.test(dbmlLines[i])) {
      return { line: i + 1, column: 1 };
    }
  }
  return findTableLocation(dbmlLines, sourceTable);
}

export function validateSchema(
  schema: DatabaseSchema,
  dbmlContent = "",
  dialect?: Dialect,
): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];
  const tableMap = new Map<string, Set<string>>();
  const dbmlLines = dbmlContent ? dbmlContent.split("\n") : [];
  const activeDialect = dialect || schema.dialect || "postgres";

  // Collect custom enum types defined in DBML or schema
  const customEnums: string[] = (schema.enums || []).map((e) => e.name);
  const enumMatches = dbmlContent.matchAll(
    /Enum\s+["']?([a-zA-Z0-9_.]+)["']?\s*\{/gi,
  );
  for (const match of enumMatches) {
    if (match[1] && !customEnums.includes(match[1])) {
      customEnums.push(match[1]);
    }
  }

  // Check duplicate tables and column uniqueness
  for (const table of schema.tables) {
    const tableNameLower = table.name.toLowerCase();
    const tableLoc = findTableLocation(dbmlLines, table.name);

    if (tableMap.has(tableNameLower)) {
      diagnostics.push({
        message: `Tabel '${table.name}' terdefinisi lebih dari satu kali.`,
        severity: "error",
        line: tableLoc.line,
        column: tableLoc.column,
        rule: "duplicate-table",
        suggestion: `Ganti nama salah satu blok tabel '${table.name}' atau hapus definisi blok tabel yang duplikat.`,
      });
    }

    const colSet = new Set<string>();
    let hasPk = false;

    for (const col of table.columns) {
      const colNameLower = col.name.toLowerCase();
      const colLoc = findColumnLocation(dbmlLines, table.name, col.name);

      if (colSet.has(colNameLower)) {
        diagnostics.push({
          message: `Kolom '${col.name}' terdefinisi lebih dari satu kali pada tabel '${table.name}'.`,
          severity: "error",
          line: colLoc.line,
          column: colLoc.column,
          rule: "duplicate-column",
          suggestion: `Ubah nama kolom atau hapus salah satu baris deklarasi kolom '${col.name}' yang duplikat.`,
        });
      }
      colSet.add(colNameLower);

      // Validate column data type
      if (!isValidDataType(col.type, activeDialect, customEnums)) {
        const typeLoc = findColumnTypeLocation(
          dbmlLines,
          table.name,
          col.name,
          col.type,
        );
        const suggestions = getSuggestedDataTypes(
          col.type,
          activeDialect,
          3,
          customEnums,
        );
        const suggestionText =
          suggestions.length > 0
            ? `Gunakan tipe data valid seperti: ${suggestions.join(", ")}.`
            : `Gunakan tipe data standar yang didukung oleh ${activeDialect === "postgres" ? "PostgreSQL" : "MySQL"}.`;

        diagnostics.push({
          message: `Tipe data '${col.type}' pada kolom '${col.name}' tidak valid untuk ${activeDialect === "postgres" ? "PostgreSQL" : "MySQL"}.`,
          severity: "error",
          line: typeLoc.line,
          column: typeLoc.column,
          rule: "invalid-column-type",
          suggestion: suggestionText,
        });
      }

      if (col.pk) {
        hasPk = true;
      }
    }

    if (!hasPk && table.columns.length > 0) {
      diagnostics.push({
        message: `Tabel '${table.name}' tidak memiliki primary key. Disarankan memiliki primary key.`,
        severity: "warning",
        line: tableLoc.line,
        column: tableLoc.column,
        rule: "missing-primary-key",
        suggestion: `Tambahkan atribut '[pk]' pada kolom unik di tabel '${table.name}' (contoh: id integer [pk, increment]).`,
      });
    }

    tableMap.set(tableNameLower, colSet);
  }

  // Check relation references
  for (const rel of schema.relations) {
    const srcTable = rel.sourceTable.toLowerCase();
    const tgtTable = rel.targetTable.toLowerCase();
    const relLoc = findRelationLocation(
      dbmlLines,
      rel.sourceTable,
      rel.sourceColumn,
      rel.targetTable,
      rel.targetColumn,
    );

    const srcCols = tableMap.get(srcTable);
    if (!srcCols) {
      diagnostics.push({
        message: `Relasi mereferensikan tabel sumber '${rel.sourceTable}' yang tidak ditemukan.`,
        severity: "error",
        line: relLoc.line,
        column: relLoc.column,
        rule: "missing-source-table",
        suggestion: `Pastikan blok 'Table ${rel.sourceTable}' sudah dibuat dan tidak salah ketik (typo).`,
      });
    } else if (
      rel.sourceColumn &&
      !srcCols.has(rel.sourceColumn.toLowerCase())
    ) {
      diagnostics.push({
        message: `Kolom sumber '${rel.sourceColumn}' tidak ditemukan pada tabel '${rel.sourceTable}'.`,
        severity: "error",
        line: relLoc.line,
        column: relLoc.column,
        rule: "missing-source-column",
        suggestion: `Tambahkan kolom '${rel.sourceColumn}' pada tabel '${rel.sourceTable}' atau periksa ejaan nama kolom.`,
      });
    }

    const tgtCols = tableMap.get(tgtTable);
    if (!tgtCols) {
      diagnostics.push({
        message: `Relasi mereferensikan tabel target '${rel.targetTable}' yang tidak ditemukan.`,
        severity: "error",
        line: relLoc.line,
        column: relLoc.column,
        rule: "missing-target-table",
        suggestion: `Pastikan blok 'Table ${rel.targetTable}' sudah dibuat dan tidak salah ketik (typo).`,
      });
    } else if (
      rel.targetColumn &&
      !tgtCols.has(rel.targetColumn.toLowerCase())
    ) {
      diagnostics.push({
        message: `Kolom target '${rel.targetColumn}' tidak ditemukan pada tabel '${rel.targetTable}'.`,
        severity: "error",
        line: relLoc.line,
        column: relLoc.column,
        rule: "missing-target-column",
        suggestion: `Tambahkan kolom '${rel.targetColumn}' pada tabel '${rel.targetTable}' atau periksa ejaan nama kolom.`,
      });
    }

    // Check self-referencing relation
    if (srcTable === tgtTable) {
      if (
        rel.sourceColumn &&
        rel.targetColumn &&
        rel.sourceColumn.toLowerCase() === rel.targetColumn.toLowerCase()
      ) {
        diagnostics.push({
          message: `Relasi pada tabel '${rel.sourceTable}' tidak dapat mereferensikan kolom '${rel.sourceColumn}' ke dirinya sendiri.`,
          severity: "error",
          line: relLoc.line,
          column: relLoc.column,
          rule: "invalid-self-reference",
          suggestion: `Gunakan kolom penunjuk relasi hierarkis terpisah (contoh: parent_id > id), bukan kolom yang sama.`,
        });
      }
    }
  }

  // Check duplicate relations
  const seenSignatures = new Set<string>();
  for (const rel of schema.relations) {
    const sTable = rel.sourceTable.toLowerCase();
    const sCol = rel.sourceColumn.toLowerCase();
    const tTable = rel.targetTable.toLowerCase();
    const tCol = rel.targetColumn.toLowerCase();

    const forward = `${sTable}.${sCol}->${tTable}.${tCol}`;
    const reverse = `${tTable}.${tCol}->${sTable}.${sCol}`;

    if (seenSignatures.has(forward) || seenSignatures.has(reverse)) {
      const relLoc = findRelationLocation(
        dbmlLines,
        rel.sourceTable,
        rel.sourceColumn,
        rel.targetTable,
        rel.targetColumn,
      );
      diagnostics.push({
        message: `Relasi antara '${rel.sourceTable}.${rel.sourceColumn}' dan '${rel.targetTable}.${rel.targetColumn}' terdefinisi lebih dari satu kali.`,
        severity: "warning",
        line: relLoc.line,
        column: relLoc.column,
        rule: "duplicate-relation",
        suggestion: `Hapus salah satu deklarasi 'Ref:' yang mendefinisikan relasi yang sama.`,
      });
    }
    seenSignatures.add(forward);
  }

  return diagnostics;
}
