import { exporter } from "@dbml/core";
import type { DatabaseSchema, Dialect } from "../types/schema";
import { serializeDbml } from "./serializer";

export function exportDbmlToSql(dbmlContent: string, dialect: Dialect): string {
  try {
    return exporter.export(dbmlContent, dialect);
  } catch (err: any) {
    throw new Error(
      `Gagal mengekspor ke ${dialect.toUpperCase()}: ${err?.message || String(err)}`,
    );
  }
}

export function exportSchemaToSql(
  schema: DatabaseSchema,
  dialect: Dialect,
): string {
  const dbml = serializeDbml(schema);
  return exportDbmlToSql(dbml, dialect);
}
