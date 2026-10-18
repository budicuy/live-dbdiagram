/**
 * Utilitas untuk mencari nomor baris (1-based) definisi Tabel atau Kolom
 * di dalam kode DBML secara presisi.
 */

function cleanIdentifier(id: string): string {
  return id.replace(/^["'`]|["'`]$/g, "").trim();
}

/**
 * Mencari nomor baris (1-based) awal deklarasi Table pada string DBML.
 */
export function findDbmlTableLine(dbml: string, tableName: string): number {
  if (!dbml || !tableName) return 1;

  const targetName = cleanIdentifier(tableName).toLowerCase();
  const lines = dbml.split("\n");

  // Regex mencocokkan: Table [schema.]tableName [as alias] [settings] {
  const tableRegex =
    /^\s*Table\s+(?:(?:"[^"]+"|[a-zA-Z0-9_]+)\.)?(?:("([^"]+)")|([a-zA-Z0-9_]+))/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(tableRegex);
    if (match) {
      const matchedName = match[2] || match[3];
      if (matchedName && matchedName.toLowerCase() === targetName) {
        return i + 1; // 1-based line number
      }
    }
  }

  return 1;
}

/**
 * Mencari nomor baris (1-based) deklarasi Kolom di dalam blok tabel tertentu.
 * Jika kolom tidak ditemukan, fallback ke baris tabel tersebut.
 */
export function findDbmlColumnLine(
  dbml: string,
  tableName: string,
  columnName?: string,
): number {
  if (!dbml || !tableName) return 1;
  const tableLine = findDbmlTableLine(dbml, tableName);
  if (!columnName) return tableLine;

  const targetCol = cleanIdentifier(columnName).toLowerCase();
  const lines = dbml.split("\n");

  let depth = 0;
  let inTargetTable = false;

  const colRegex = /^\s*(?:("([^"]+)")|([a-zA-Z0-9_]+))\s+/;

  for (let i = tableLine - 1; i < lines.length; i++) {
    const line = lines[i];

    if (i === tableLine - 1) {
      inTargetTable = true;
    }

    if (!inTargetTable) continue;

    for (const char of line) {
      if (char === "{") depth++;
      else if (char === "}") {
        depth--;
        if (depth <= 0 && i !== tableLine - 1) {
          // Keluar dari blok tabel target
          return tableLine;
        }
      }
    }

    // Lewati baris deklarasi tabel itu sendiri
    if (i === tableLine - 1) continue;

    const trimmed = line.trim();
    if (
      !trimmed ||
      trimmed.startsWith("//") ||
      trimmed.startsWith("/*") ||
      trimmed.toLowerCase().startsWith("indexes") ||
      trimmed.toLowerCase().startsWith("note")
    ) {
      continue;
    }

    const colMatch = line.match(colRegex);
    if (colMatch) {
      const matchedCol = colMatch[2] || colMatch[3];
      if (
        matchedCol &&
        matchedCol.toLowerCase() === targetCol &&
        matchedCol.toLowerCase() !== "table"
      ) {
        return i + 1; // 1-based
      }
    }
  }

  return tableLine;
}
