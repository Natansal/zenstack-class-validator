import type { DataFieldAttribute } from "@zenstackhq/sdk/ast";
import type { DecoratorStructure, OptionalKind } from "ts-morph";
import { CUSTOM_VALIDATORS_PATH, IGNORED_ATTRIBUTES, VALIDATOR_LIB } from "./constants";
import { ImportRegistry } from "./import-registry";
import { resolveArgs } from "./resolve-args";

/**
 * 🛠️ Resolves a single ZenStack field attribute to a ts-morph DecoratorStructure, or null if ignored/unknown.
 * @param params - Options object.
 * @param params.attr - The ZenStack attribute AST node.
 * @param params.imports - Registry to add any required decorator imports.
 * @returns Decorator structure for the generated DTO property, or null.
 */
export function resolveAttribute({
   attr,
   imports,
}: {
   attr: DataFieldAttribute;
   imports: ImportRegistry;
}): OptionalKind<DecoratorStructure> | null {
   const attrName = attr.decl.$refText.trim().slice(1).trim();
   if (!attrName) return null;

   const args = attr.args.map((v) => ({
      name: (v as { $resolvedParam?: { name: string } }).$resolvedParam?.name as string,
      value: (v.value as { value?: unknown; $refText?: string }).value ?? (v.value as { $refText?: string }).$refText,
   }));

   const messageArg = args.find((a) => a.name === "message");
   const optionsObj = messageArg?.value ? `{ message: ${JSON.stringify(messageArg.value)} }` : "";
   const optionsArg = optionsObj ? `, ${optionsObj}` : "";
   const filteredArgs = args.filter((a) => a.name !== "message");
   const rawValue = filteredArgs[0]?.value;
   const safeValue = rawValue !== undefined ? JSON.stringify(rawValue) : "undefined";

   const createDec = ({
      lib,
      name,
      decArgs,
   }: {
      lib: string;
      name: string;
      decArgs: (string | undefined)[];
   }): OptionalKind<DecoratorStructure> => {
      imports.add({ moduleSpecifier: lib, namedImport: name });
      return { name, arguments: resolveArgs(decArgs) };
   };

   switch (attrName) {
      case "email":
         return createDec({ lib: VALIDATOR_LIB, name: "IsEmail", decArgs: [optionsObj] });
      case "url":
         return createDec({ lib: VALIDATOR_LIB, name: "IsUrl", decArgs: [optionsObj] });
      case "datetime":
         return createDec({ lib: VALIDATOR_LIB, name: "IsISO8601", decArgs: [optionsObj] });
      case "contains":
         return createDec({ lib: VALIDATOR_LIB, name: "Contains", decArgs: [`${safeValue}${optionsArg}`] });
      case "startsWith":
         imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "Matches" });
         return { name: "Matches", arguments: resolveArgs([`new RegExp('^' + ${safeValue})${optionsArg}`]) };
      case "endsWith":
         imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "Matches" });
         return { name: "Matches", arguments: resolveArgs([`new RegExp(${safeValue} + '$')${optionsArg}`]) };
      case "regex":
         imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "Matches" });
         return { name: "Matches", arguments: resolveArgs([`new RegExp(${safeValue})${optionsArg}`]) };
      case "length": {
         imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "Length" });
         const min = args.find((a) => a.name === "min")?.value ?? "0";
         const max = args.find((a) => a.name === "max")?.value;
         const maxArg = max ? `, ${max}` : optionsObj ? ", undefined" : "";
         return { name: "Length", arguments: resolveArgs([`${min}${maxArg}${optionsArg}`]) };
      }

      case "trim":
         return createDec({ lib: CUSTOM_VALIDATORS_PATH, name: "Trim", decArgs: [] });
      case "lower":
         return createDec({ lib: CUSTOM_VALIDATORS_PATH, name: "LowerCase", decArgs: [] });
      case "upper":
         return createDec({ lib: CUSTOM_VALIDATORS_PATH, name: "UpperCase", decArgs: [] });

      case "gt":
         return createDec({ lib: CUSTOM_VALIDATORS_PATH, name: "Gt", decArgs: [`${rawValue}${optionsArg}`] });
      case "lt":
         return createDec({ lib: CUSTOM_VALIDATORS_PATH, name: "Lt", decArgs: [`${rawValue}${optionsArg}`] });
      case "gte":
         return createDec({ lib: VALIDATOR_LIB, name: "Min", decArgs: [`${rawValue}${optionsArg}`] });
      case "lte":
         return createDec({ lib: VALIDATOR_LIB, name: "Max", decArgs: [`${rawValue}${optionsArg}`] });

      default:
         return null;
   }
}
