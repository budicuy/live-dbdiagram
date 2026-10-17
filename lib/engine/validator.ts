import type { DatabaseSchema, SchemaDiagnostic } from "../types/schema";

export function validateSchema(schema: DatabaseSchema): SchemaDiagnostic[] {
  const diagnostics: SchemaDiagnostic[] = [];
  const tableMap = new Map<string, Set<string>>();

  // Check duplicate tables and column uniqueness
  for (const table of schema.tables) {
    const tableNameLower = table.name.toLowerCase();
    if (tableMap.has(tableNameLower)) {
      diagnostics.push({
        message: `Tabel '${table.name}' terdefinisi lebih dari satu kali.`,
        severity: "error",
      });
    }

    const colSet = new Set<string>();
    let hasPk = false;

    for (const col of table.columns) {
      const colNameLower = col.name.toLowerCase();
      if (colSet.has(colNameLower)) {
        diagnostics.push({
          message: `Kolom '${col.name}' duplikat pada tabel '${table.name}'.`,
          severity: "error",
        });
      }
      colSet.add(colNameLower);

      if (col.pk) {
        hasPk = true;
      }
    }

    if (!hasPk && table.columns.length > 0) {
      diagnostics.push({
        message: `Tabel '${table.name}' tidak memiliki primary key. Disarankan memiliki primary key.`,
        severity: "warning",
      });
    }

    tableMap.set(tableNameLower, colSet);
  }

  // Check relation references
  for (const rel of schema.relations) {
    const srcTable = rel.sourceTable.toLowerCase();
    const tgtTable = rel.targetTable.toLowerCase();

    const srcCols = tableMap.get(srcTable);
    if (!srcCols) {
      diagnostics.push({
        message: `Relasi mereferensikan tabel sumber '${rel.sourceTable}' yang tidak ditemukan.`,
        severity: "error",
      });
    } else if (
      rel.sourceColumn &&
      !srcCols.has(rel.sourceColumn.toLowerCase())
    ) {
      diagnostics.push({
        message: `Kolom sumber '${rel.sourceColumn}' tidak ditemukan pada tabel '${rel.sourceTable}'.`,
        severity: "error",
      });
    }

    const tgtCols = tableMap.get(tgtTable);
    if (!tgtCols) {
      diagnostics.push({
        message: `Relasi mereferensikan tabel target '${rel.targetTable}' yang tidak ditemukan.`,
        severity: "error",
      });
    } else if (
      rel.targetColumn &&
      !tgtCols.has(rel.targetColumn.toLowerCase())
    ) {
      diagnostics.push({
        message: `Kolom target '${rel.targetColumn}' tidak ditemukan pada tabel '${rel.targetTable}'.`,
        severity: "error",
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
      diagnostics.push({
        message: `Relasi antara '${rel.sourceTable}.${rel.sourceColumn}' dan '${rel.targetTable}.${rel.targetColumn}' terdefinisi lebih dari satu kali.`,
        severity: "warning",
      });
    }
    seenSignatures.add(forward);
  }

  return diagnostics;
}
