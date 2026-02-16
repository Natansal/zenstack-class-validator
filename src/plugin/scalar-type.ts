import { TRANSFORMER_LIB } from "./constants";
import { ImportRegistry } from "./import-registry";

/**
 * 🔍 Maps a ZenStack scalar type name to a TypeScript type string and registers any required imports (e.g. Type for Date).
 * @param params - Options object.
 * @param params.scalarType - ZenStack scalar name (e.g. Int, String, DateTime).
 * @param params.imports - Registry to add decorator imports (e.g. class-transformer Type for DateTime).
 * @returns TypeScript type string (e.g. "number", "Date", "string").
 */
export function getScalarType({ scalarType, imports }: { scalarType: string; imports: ImportRegistry }): string {
   switch (scalarType) {
      case "Int":
      case "Float":
         return "number";
      case "BigInt":
      case "Decimal":
      case "String":
         return "string";
      case "Boolean":
         return "boolean";
      case "DateTime":
         imports.add({ moduleSpecifier: TRANSFORMER_LIB, namedImport: "Type" });
         return "Date";
      case "Json":
         return "object";
      case "Bytes":
         return "Buffer";
      default:
         return "unknown";
   }
}
