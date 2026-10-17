import { Parser } from "@dbml/core";
import type {
  Cardinality,
  ColumnDefinition,
  DatabaseSchema,
  Dialect,
  RelationDefinition,
  SchemaDiagnostic,
  TableDefinition,
} from "../types/schema";

interface ParseResult {
  success: boolean;
  schema?: DatabaseSchema;
  diagnostics: SchemaDiagnostic[];
}

export function parseDbml(
  dbmlContent: string,
  dialect: Dialect = "postgres",
): ParseResult {
  const content = dbmlContent.trim();
  if (!content) {
    return {
      success: true,
      schema: {
        tables: [],
        relations: [],
        dialect,
      },
      diagnostics: [],
    };
  }

  try {
    const raw = Parser.parse(content, "dbml");
    const tables: TableDefinition[] = [];
    const relations: RelationDefinition[] = [];

    const schemas = raw.schemas || [];
    for (const schema of schemas) {
      const rawTables = schema.tables || [];
      for (const t of rawTables) {
        const columns: ColumnDefinition[] = (t.fields || []).map(
          (f: any, idx: number) => {
            let defaultValue: string | null = null;
            if (f.dbdefault !== undefined && f.dbdefault !== null) {
              if (
                typeof f.dbdefault === "object" &&
                f.dbdefault.value !== undefined
              ) {
                defaultValue = String(f.dbdefault.value);
              } else {
                defaultValue = String(f.dbdefault);
              }
            }

            return {
              id: `${t.name}_${f.name || `col_${idx}`}`,
              name: f.name || `col_${idx}`,
              type: f.type?.type_name || "varchar",
              pk: Boolean(f.pk),
              increment: Boolean(f.increment),
              notNull: Boolean(f.not_null),
              unique: Boolean(f.unique),
              defaultValue,
              note: f.note ? String(f.note) : null,
            };
          },
        );

        const indexes = (t.indexes || []).map((idx: any) => {
          const cols: string[] = (idx.columns || []).map(
            (c: any) => c.value || c.name || String(c),
          );
          return {
            name: idx.name || undefined,
            columns: cols,
            unique: Boolean(idx.unique),
          };
        });

        tables.push({
          id: t.name,
          name: t.name,
          schema: schema.name || "public",
          alias: t.alias || undefined,
          note: t.note ? String(t.note) : null,
          columns,
          indexes,
        });
      }

      const rawRefs = schema.refs || [];
      for (let i = 0; i < rawRefs.length; i++) {
        const r = rawRefs[i];
        if (!r.endpoints || r.endpoints.length < 2) continue;

        const ep0 = r.endpoints[0];
        const ep1 = r.endpoints[1];

        const sourceTable = ep0.tableName;
        const sourceColumn = ep0.fieldNames?.[0] || "";
        const targetTable = ep1.tableName;
        const targetColumn = ep1.fieldNames?.[0] || "";

        let cardinality: Cardinality = "many-to-one";
        if (ep0.relation === "*" && ep1.relation === "1") {
          cardinality = "many-to-one";
        } else if (ep0.relation === "1" && ep1.relation === "*") {
          cardinality = "one-to-many";
        } else if (ep0.relation === "1" && ep1.relation === "1") {
          cardinality = "one-to-one";
        } else if (ep0.relation === "*" && ep1.relation === "*") {
          cardinality = "many-to-many";
        }

        relations.push({
          id:
            r.name ||
            `ref_${sourceTable}_${sourceColumn}_${targetTable}_${targetColumn}_${i}`,
          name: r.name || undefined,
          sourceTable,
          sourceColumn,
          targetTable,
          targetColumn,
          cardinality,
          onDelete: r.onDelete || null,
          onUpdate: r.onUpdate || null,
        });
      }
    }

    return {
      success: true,
      schema: {
        tables,
        relations,
        dialect,
      },
      diagnostics: [],
    };
  } catch (err: any) {
    const diagnostics: SchemaDiagnostic[] = [];

    if (err && Array.isArray(err.diags)) {
      for (const diag of err.diags) {
        diagnostics.push({
          message: diag.message || "Kesalahan sintaks DBML",
          line: diag.location?.start?.line ?? 1,
          column: diag.location?.start?.column ?? 1,
          endLine: diag.location?.end?.line,
          endColumn: diag.location?.end?.column,
          severity: "error",
        });
      }
    } else {
      diagnostics.push({
        message: err?.message || String(err),
        line: 1,
        column: 1,
        severity: "error",
      });
    }

    return {
      success: false,
      diagnostics,
    };
  }
}
