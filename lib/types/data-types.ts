import type { Dialect } from "./schema";

export type DataTypeCategory =
  | "numeric"
  | "string"
  | "datetime"
  | "boolean"
  | "json"
  | "binary"
  | "network"
  | "special";

export interface DataTypeDefinition {
  name: string;
  defaultParam?: string;
  category: DataTypeCategory;
  description: string;
  dialects: Dialect[];
  supportsParams?: boolean;
}

export const DATA_TYPES: DataTypeDefinition[] = [
  // Numeric Types
  {
    name: "integer",
    category: "numeric",
    description: "Bilangan bulat 4-byte bertanda (-2.1M s/d +2.1M)",
    dialects: ["postgres", "mysql"],
  },
  {
    name: "int",
    category: "numeric",
    description: "Sinonim standar SQL untuk integer",
    dialects: ["postgres", "mysql"],
  },
  {
    name: "bigint",
    category: "numeric",
    description: "Bilangan bulat besar 8-byte (-9.22E18 s/d +9.22E18)",
    dialects: ["postgres", "mysql"],
  },
  {
    name: "smallint",
    category: "numeric",
    description: "Bilangan bulat kecil 2-byte (-32,768 s/d 32,767)",
    dialects: ["postgres", "mysql"],
  },
  {
    name: "tinyint",
    defaultParam: "1",
    category: "numeric",
    description: "Bilangan bulat 1-byte (-128 s/d 127)",
    dialects: ["mysql"],
    supportsParams: true,
  },
  {
    name: "mediumint",
    category: "numeric",
    description: "Bilangan bulat 3-byte (-8.3M s/d 8.3M)",
    dialects: ["mysql"],
  },
  {
    name: "decimal",
    defaultParam: "10,2",
    category: "numeric",
    description: "Angka desimal presisi tetap (contoh: harga, saldo)",
    dialects: ["postgres", "mysql"],
    supportsParams: true,
  },
  {
    name: "numeric",
    defaultParam: "10,2",
    category: "numeric",
    description: "Sinonim standar SQL untuk decimal",
    dialects: ["postgres", "mysql"],
    supportsParams: true,
  },
  {
    name: "real",
    category: "numeric",
    description: "Angka pecahan floating-point 4-byte",
    dialects: ["postgres"],
  },
  {
    name: "float",
    category: "numeric",
    description: "Angka pecahan floating-point presisi tunggal",
    dialects: ["mysql"],
    supportsParams: true,
  },
  {
    name: "double precision",
    category: "numeric",
    description: "Angka pecahan floating-point 8-byte presisi ganda",
    dialects: ["postgres"],
  },
  {
    name: "doubleprecision",
    category: "numeric",
    description: "Sinonim PostgreSQL untuk double precision",
    dialects: ["postgres"],
  },
  {
    name: "float8",
    category: "numeric",
    description: "Sinonim PostgreSQL untuk double precision (8-byte)",
    dialects: ["postgres"],
  },
  {
    name: "float4",
    category: "numeric",
    description: "Sinonim PostgreSQL untuk real (4-byte)",
    dialects: ["postgres"],
  },
  {
    name: "int8",
    category: "numeric",
    description: "Sinonim PostgreSQL untuk bigint (8-byte)",
    dialects: ["postgres"],
  },
  {
    name: "int4",
    category: "numeric",
    description: "Sinonim PostgreSQL untuk integer (4-byte)",
    dialects: ["postgres"],
  },
  {
    name: "int2",
    category: "numeric",
    description: "Sinonim PostgreSQL untuk smallint (2-byte)",
    dialects: ["postgres"],
  },
  {
    name: "double",
    category: "numeric",
    description: "Angka pecahan floating-point presisi ganda",
    dialects: ["mysql"],
  },
  {
    name: "serial",
    category: "numeric",
    description: "Auto-incrementing integer 4-byte",
    dialects: ["postgres"],
  },
  {
    name: "bigserial",
    category: "numeric",
    description: "Auto-incrementing bigint 8-byte",
    dialects: ["postgres"],
  },
  {
    name: "smallserial",
    category: "numeric",
    description: "Auto-incrementing smallint 2-byte",
    dialects: ["postgres"],
  },
  {
    name: "money",
    category: "numeric",
    description: "Tipe nominal mata uang pecahan desimal",
    dialects: ["postgres"],
  },
  {
    name: "bit",
    defaultParam: "1",
    category: "numeric",
    description: "Nilai bit-field",
    dialects: ["mysql"],
    supportsParams: true,
  },

  // String & Character Types
  {
    name: "varchar",
    defaultParam: "255",
    category: "string",
    description: "Teks panjang bervariasi dengan batas maksimum",
    dialects: ["postgres", "mysql"],
    supportsParams: true,
  },
  {
    name: "character varying",
    defaultParam: "255",
    category: "string",
    description: "Sinonim standar SQL untuk varchar",
    dialects: ["postgres"],
    supportsParams: true,
  },
  {
    name: "char",
    defaultParam: "1",
    category: "string",
    description: "Teks karakter panjang tetap",
    dialects: ["postgres", "mysql"],
    supportsParams: true,
  },
  {
    name: "character",
    defaultParam: "1",
    category: "string",
    description: "Sinonim standar SQL untuk char",
    dialects: ["postgres"],
    supportsParams: true,
  },
  {
    name: "text",
    category: "string",
    description: "Teks panjang tanpa batas tertentu",
    dialects: ["postgres", "mysql"],
  },
  {
    name: "tinytext",
    category: "string",
    description: "Teks kecil hingga 255 karakter",
    dialects: ["mysql"],
  },
  {
    name: "mediumtext",
    category: "string",
    description: "Teks sedang hingga 16MB",
    dialects: ["mysql"],
  },
  {
    name: "longtext",
    category: "string",
    description: "Teks sangat panjang hingga 4GB",
    dialects: ["mysql"],
  },
  {
    name: "citext",
    category: "string",
    description: "Teks case-insensitive (huruf besar/kecil dianggap sama)",
    dialects: ["postgres"],
  },

  // Date & Time Types
  {
    name: "timestamp",
    category: "datetime",
    description: "Tanggal dan waktu (YYYY-MM-DD HH:MM:SS)",
    dialects: ["postgres", "mysql"],
    supportsParams: true,
  },
  {
    name: "timestamptz",
    category: "datetime",
    description: "Timestamp dengan zona waktu (UTC-aware)",
    dialects: ["postgres"],
  },
  {
    name: "timestamp with time zone",
    category: "datetime",
    description: "Sinonim standar SQL untuk timestamptz",
    dialects: ["postgres"],
    supportsParams: true,
  },
  {
    name: "timestamp without time zone",
    category: "datetime",
    description: "Sinonim standar SQL untuk timestamp",
    dialects: ["postgres"],
    supportsParams: true,
  },
  {
    name: "datetime",
    category: "datetime",
    description: "Tanggal dan waktu presisi kalender",
    dialects: ["mysql"],
    supportsParams: true,
  },
  {
    name: "date",
    category: "datetime",
    description: "Hanya tanggal (YYYY-MM-DD)",
    dialects: ["postgres", "mysql"],
  },
  {
    name: "time",
    category: "datetime",
    description: "Hanya waktu (HH:MM:SS)",
    dialects: ["postgres", "mysql"],
    supportsParams: true,
  },
  {
    name: "timetz",
    category: "datetime",
    description: "Waktu dengan zona waktu",
    dialects: ["postgres"],
  },
  {
    name: "time with time zone",
    category: "datetime",
    description: "Sinonim standar SQL untuk timetz",
    dialects: ["postgres"],
    supportsParams: true,
  },
  {
    name: "time without time zone",
    category: "datetime",
    description: "Sinonim standar SQL untuk time",
    dialects: ["postgres"],
    supportsParams: true,
  },
  {
    name: "interval",
    category: "datetime",
    description: "Durasi rentang waktu (misal: '1 day', '2 hours')",
    dialects: ["postgres"],
  },
  {
    name: "year",
    category: "datetime",
    description: "Hanya 4 digit tahun (YYYY)",
    dialects: ["mysql"],
  },

  // Boolean Types
  {
    name: "boolean",
    category: "boolean",
    description: "Nilai logika benar/salah (true/false)",
    dialects: ["postgres", "mysql"],
  },
  {
    name: "bool",
    category: "boolean",
    description: "Sinonim standar SQL untuk boolean",
    dialects: ["postgres", "mysql"],
  },

  // JSON & Document Types
  {
    name: "json",
    category: "json",
    description: "Dokumen data JSON terstruktur teks",
    dialects: ["postgres", "mysql"],
  },
  {
    name: "jsonb",
    category: "json",
    description: "JSON biner terdekomposisi cepat diindeks & dicari",
    dialects: ["postgres"],
  },
  {
    name: "xml",
    category: "json",
    description: "Dokumen XML tervalidasi",
    dialects: ["postgres"],
  },

  // UUID & Network Types
  {
    name: "uuid",
    category: "network",
    description: "Pengenal unik 128-bit RFC 4122 (contoh: a0eebc99-...)",
    dialects: ["postgres"],
  },
  {
    name: "inet",
    category: "network",
    description: "Alamat host IPv4 atau IPv6",
    dialects: ["postgres"],
  },
  {
    name: "cidr",
    category: "network",
    description: "Rentang jaringan IPv4 atau IPv6",
    dialects: ["postgres"],
  },
  {
    name: "macaddr",
    category: "network",
    description: "Alamat fisik MAC kartu jaringan",
    dialects: ["postgres"],
  },

  // Binary Data Types
  {
    name: "bytea",
    category: "binary",
    description: "Data biner variabel panjang (binary string)",
    dialects: ["postgres"],
  },
  {
    name: "binary",
    defaultParam: "1",
    category: "binary",
    description: "Data biner panjang tetap",
    dialects: ["mysql"],
    supportsParams: true,
  },
  {
    name: "varbinary",
    defaultParam: "255",
    category: "binary",
    description: "Data biner variabel panjang dengan batas",
    dialects: ["mysql"],
    supportsParams: true,
  },
  {
    name: "blob",
    category: "binary",
    description: "Binary Large Object hingga 64KB",
    dialects: ["mysql"],
  },
  {
    name: "tinyblob",
    category: "binary",
    description: "Binary Large Object kecil hingga 255 byte",
    dialects: ["mysql"],
  },
  {
    name: "mediumblob",
    category: "binary",
    description: "Binary Large Object sedang hingga 16MB",
    dialects: ["mysql"],
  },
  {
    name: "longblob",
    category: "binary",
    description: "Binary Large Object sangat besar hingga 4GB",
    dialects: ["mysql"],
  },

  // Special Types
  {
    name: "enum",
    defaultParam: "'val1', 'val2'",
    category: "special",
    description: "Tipe enumerasi nilai daftar opsi tetap",
    dialects: ["mysql"],
    supportsParams: true,
  },
  {
    name: "regclass",
    category: "special",
    description: "Tipe pengenal sistem PostgreSQL OID untuk relasi",
    dialects: ["postgres"],
  },
];

export const CATEGORY_LABELS: Record<DataTypeCategory, string> = {
  numeric: "Angka (Numeric)",
  string: "Teks (String)",
  datetime: "Waktu (Date & Time)",
  boolean: "Logika (Boolean)",
  json: "Dokumen (JSON & XML)",
  network: "UUID & Jaringan",
  binary: "Biner (Binary / Blob)",
  special: "Khusus (Enum & Set)",
};

/**
 * Normalizes and extracts base type, parameters, and array indicators
 * Examples:
 * - "varchar(255)" => { base: "varchar", params: "255", isArray: false }
 * - "decimal(10, 2)" => { base: "decimal", params: "10, 2", isArray: false }
 * - "integer[]" => { base: "integer", params: null, isArray: true }
 * - "\"double precision\"" => { base: "double precision", params: null, isArray: false }
 */
export function parseBaseDataType(typeStr: string): {
  base: string;
  params: string | null;
  isArray: boolean;
} {
  let cleaned = typeStr.trim();
  // Strip surrounding quotes if present
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  const isArray = cleaned.endsWith("[]");
  if (isArray) {
    cleaned = cleaned.slice(0, -2).trim();
  }

  const parenMatch = /^([a-zA-Z0-9_.\s]+)\((.*)\)$/.exec(cleaned);
  if (parenMatch) {
    return {
      base: parenMatch[1].trim().toLowerCase(),
      params: parenMatch[2].trim(),
      isArray,
    };
  }

  return {
    base: cleaned.toLowerCase(),
    params: null,
    isArray,
  };
}

/**
 * Returns available data types filtered by dialect and optional category
 */
export function getDataTypesForDialect(
  dialect: Dialect,
  category?: DataTypeCategory,
): DataTypeDefinition[] {
  return DATA_TYPES.filter(
    (dt) =>
      dt.dialects.includes(dialect) && (!category || dt.category === category),
  );
}

/**
 * Validates if the given data type string is valid for the specified dialect or custom enums.
 */
export function isValidDataType(
  typeStr: string,
  dialect: Dialect,
  customEnums?: string[],
): boolean {
  if (!typeStr || !typeStr.trim()) return false;
  const { base, isArray } = parseBaseDataType(typeStr);

  // Clean schema prefix if present, e.g. "public.jenis_sampah" -> "jenis_sampah"
  const cleanBase = base.includes(".") ? base.split(".").pop() || base : base;

  // Check if it matches a custom enum defined in the schema/DBML
  if (customEnums && customEnums.length > 0) {
    const isCustomEnum = customEnums.some((enumName) => {
      const lowerEnum = enumName.toLowerCase();
      const cleanEnum = lowerEnum.includes(".")
        ? lowerEnum.split(".").pop() || lowerEnum
        : lowerEnum;
      return cleanEnum === cleanBase || cleanEnum === base;
    });
    if (isCustomEnum) return true;
  }

  // Array types (e.g. integer[]) are only supported in PostgreSQL
  if (isArray && dialect !== "postgres") {
    return false;
  }

  // Find matching definition (check both raw base and cleanBase without schema prefix)
  const match = DATA_TYPES.find(
    (dt) =>
      (dt.name.toLowerCase() === base || dt.name.toLowerCase() === cleanBase) &&
      dt.dialects.includes(dialect),
  );

  return Boolean(match);
}

/**
 * Suggests valid data types when a typo is detected
 */
export function getSuggestedDataTypes(
  input: string,
  dialect: Dialect,
  limit = 3,
  customEnums?: string[],
): string[] {
  const { base } = parseBaseDataType(input);
  const cleanBase = base.includes(".") ? base.split(".").pop() || base : base;
  const candidates = [
    ...DATA_TYPES.filter((dt) => dt.dialects.includes(dialect)).map(
      (dt) => dt.name,
    ),
    ...(customEnums || []),
  ];

  // Simple string similarity calculation (Levenshtein distance)
  function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }
    return matrix[b.length][a.length];
  }

  const scored = candidates.map((cand) => {
    let score = levenshtein(cleanBase, cand.toLowerCase());
    if (cand.toLowerCase().startsWith(cleanBase)) {
      score -= 2;
    } else if (cand.toLowerCase().includes(cleanBase)) {
      score -= 1;
    }
    return { name: cand, score };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored.slice(0, limit).map((s) => s.name);
}
