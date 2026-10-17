import type { DatabaseSchema } from "../types/schema";

export function serializeDbml(schema: DatabaseSchema): string {
  const parts: string[] = [];

  for (const table of schema.tables) {
    const tableHeader = table.alias
      ? `Table ${table.name} as ${table.alias} {`
      : `Table ${table.name} {`;

    const lines: string[] = [tableHeader];

    for (const col of table.columns) {
      const settings: string[] = [];
      if (col.pk) settings.push("pk");
      if (col.increment) settings.push("increment");
      if (col.notNull) settings.push("not null");
      if (col.unique) settings.push("unique");

      if (
        col.defaultValue !== undefined &&
        col.defaultValue !== null &&
        col.defaultValue !== ""
      ) {
        const val = col.defaultValue.trim();
        if (val.startsWith("`") && val.endsWith("`")) {
          settings.push(`default: ${val}`);
        } else if (
          val.startsWith("'") ||
          val.startsWith('"') ||
          !Number.isNaN(Number(val))
        ) {
          settings.push(`default: ${val}`);
        } else {
          settings.push(`default: '${val}'`);
        }
      }

      if (col.note) {
        const escapedNote = col.note.replace(/'/g, "\\'");
        settings.push(`note: '${escapedNote}'`);
      }

      const settingsStr =
        settings.length > 0 ? ` [${settings.join(", ")}]` : "";
      lines.push(`  ${col.name} ${col.type || "varchar"}${settingsStr}`);
    }

    if (table.indexes && table.indexes.length > 0) {
      lines.push("");
      lines.push("  indexes {");
      for (const idx of table.indexes) {
        const cols = idx.columns.join(", ");
        const idxSettings: string[] = [];
        if (idx.name) idxSettings.push(`name: '${idx.name}'`);
        if (idx.unique) idxSettings.push("unique");
        const idxSettingStr =
          idxSettings.length > 0 ? ` [${idxSettings.join(", ")}]` : "";
        lines.push(`    (${cols})${idxSettingStr}`);
      }
      lines.push("  }");
    }

    if (table.note) {
      lines.push("");
      lines.push(`  Note: '${table.note.replace(/'/g, "\\'")}'`);
    }

    lines.push("}");
    parts.push(lines.join("\n"));
  }

  // Relations
  if (schema.relations.length > 0) {
    const refLines: string[] = [];
    for (const rel of schema.relations) {
      let op = ">";
      if (rel.cardinality === "one-to-one") op = "-";
      else if (rel.cardinality === "one-to-many") op = "<";
      else if (rel.cardinality === "many-to-many") op = "<>";
      else op = ">";

      const settings: string[] = [];
      if (rel.onDelete) settings.push(`delete: ${rel.onDelete}`);
      if (rel.onUpdate) settings.push(`update: ${rel.onUpdate}`);
      const settingsStr =
        settings.length > 0 ? ` [${settings.join(", ")}]` : "";

      const refHeader = rel.name ? `Ref ${rel.name}:` : "Ref:";
      refLines.push(
        `${refHeader} ${rel.sourceTable}.${rel.sourceColumn} ${op} ${rel.targetTable}.${rel.targetColumn}${settingsStr}`,
      );
    }
    parts.push(refLines.join("\n"));
  }

  return `${parts.join("\n\n")}\n`;
}
