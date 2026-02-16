import type { DataModel, Model, TypeDef } from "@zenstackhq/sdk/ast";
import { isDataModel, isEnum, isTypeDef } from "@zenstackhq/sdk/ast";
import type { ClassDeclaration, DecoratorStructure, OptionalKind, SourceFile } from "ts-morph";
import { Project } from "ts-morph";
import fs from "fs/promises";
import path from "path";
import { MAPPED_TYPES_LIB, TRANSFORMER_LIB, VALIDATOR_LIB } from "./constants";
import { getDtoName } from "./dto-name";
import { getScalarType } from "./scalar-type";
import { resolveAttribute } from "./attribute-resolver";
import { ImportRegistry } from "./import-registry";
import { resolveArgs } from "./resolve-args";

const DTO_FILE_HEADER = [
   "",
   "/**",
   " * ╔═══════════════════════════════════════════════════════════════════════════╗",
   " * ║                                                                           ║",
   " * ║   ██████╗ ████████╗ ██████╗    Data Transfer Objects • Auto-generated     ║",
   " * ║   ██╔══██╗╚══██╔══╝██╔═══██╗                                              ║",
   " * ║   ██║  ██║   ██║   ██║   ██║                                              ║",
   " * ║   ██║  ██║   ██║   ██║   ██║                                              ║",
   " * ║   ██████╔╝   ██║   ╚██████╔╝   🚀 AUTO-GENERATED — DO NOT EDIT MANUALLY   ║",
   " * ║   ╚═════╝    ╚═╝    ╚═════╝    ✨ Created By - zenstack-validator         ║",
   " * ║                                                                           ║",
   " * ╚═══════════════════════════════════════════════════════════════════════════╝",
   " */",
   "",
].join("\n");

/**
 * 🏗️ Generates the DTO source file: creates classes for each model/typeDef, adds properties with decorators, and saves to disk.
 * @param model - ZenStack AST model (declarations).
 * @param defaultOutputPath - Directory path where dtos.ts will be written.
 */
export async function generateDtos(options: { model: Model; outputPath: string; schemaPath: string }): Promise<void> {
   const { model, outputPath, schemaPath } = options;
   const project = new Project();
   const outFile = path.join(outputPath, "validators.ts");
   const sourceFile = project.createSourceFile(outFile, "", { overwrite: true });

   sourceFile.addStatements(DTO_FILE_HEADER);

   const imports = new ImportRegistry();
   const items = model.declarations.filter((d): d is DataModel | TypeDef => isDataModel(d) || isTypeDef(d));

   const orderedItems = orderDeclarationsForGeneration(items);

   for (const item of orderedItems) {
      addDtoClass({ sourceFile, item, imports, schemaPath });
   }

   imports.applyToSourceFile(sourceFile);

   await fs.mkdir(outputPath, { recursive: true });

   await sourceFile.save();
}

/**
 * 📋 Orders declarations so that: (1) TypeDefs come first (mixins must be defined before models that extend them),
 * (2) DataModels are in dependency order (when model A references model B, B is emitted before A).
 * @param items - All DataModel and TypeDef declarations from the schema.
 * @returns Ordered list for emission.
 */
function orderDeclarationsForGeneration(items: (DataModel | TypeDef)[]): (DataModel | TypeDef)[] {
   const typeDefs = items.filter((d): d is TypeDef => isTypeDef(d));
   const dataModels = items.filter((d): d is DataModel => isDataModel(d));

   const modelByName = new Map(dataModels.map((m) => [m.name, m]));

   const refs = new Map<string, Set<string>>();
   for (const dm of dataModels) {
      const deps = new Set<string>();
      for (const field of dm.fields) {
         const ref = field.type.reference?.ref;
         if (ref && isDataModel(ref)) deps.add(ref.name);
      }
      refs.set(dm.name, deps);
   }

   const refsReverse = new Map<string, string[]>();
   for (const dm of dataModels) {
      refsReverse.set(dm.name, []);
   }
   for (const dm of dataModels) {
      for (const dep of refs.get(dm.name) ?? []) {
         refsReverse.get(dep)!.push(dm.name);
      }
   }

   const remainingDeps = new Map(dataModels.map((m) => [m.name, refs.get(m.name)?.size ?? 0]));
   const queue = dataModels.filter((m) => remainingDeps.get(m.name) === 0);
   const sortedNames: string[] = [];
   while (queue.length > 0) {
      const dm = queue.shift()!;
      sortedNames.push(dm.name);
      for (const other of refsReverse.get(dm.name) ?? []) {
         const r = remainingDeps.get(other)! - 1;
         remainingDeps.set(other, r);
         if (r === 0) queue.push(modelByName.get(other)!);
      }
   }

   const sortedModels =
      sortedNames.length === dataModels.length
         ? sortedNames.map((name) => modelByName.get(name)!)
         : [
              ...sortedNames.map((name) => modelByName.get(name)!),
              ...dataModels.filter((m) => !sortedNames.includes(m.name)),
           ];

   return [...typeDefs, ...sortedModels];
}

/**
 * 📝 Adds a single DTO class (model or typeDef) to the source file and registers imports.
 */
function addDtoClass({
   sourceFile,
   item,
   imports,
   schemaPath,
}: {
   sourceFile: SourceFile;
   item: DataModel | TypeDef;
   imports: ImportRegistry;
   schemaPath: string;
}): void {
   const className = getDtoName(item);

   const classDecl = sourceFile.addClass({
      name: className,
      isExported: true,
   });

   applyMixins({ classDecl, item, imports });

   addFields({ classDecl, item, imports, schemaPath });
}

/**
 * 🔗 If the item has mixins, extends IntersectionType(mixinDTOs).
 */
function applyMixins({
   classDecl,
   item,
   imports,
}: {
   classDecl: ClassDeclaration;
   item: DataModel | TypeDef;
   imports: ImportRegistry;
}): void {
   const mixins = item.mixins.map((v) => v.ref).filter(Boolean) as TypeDef[];

   if (!mixins.length) return;

   imports.add({ moduleSpecifier: MAPPED_TYPES_LIB, namedImport: "IntersectionType" });
   const mixinNames = mixins.map(getDtoName).join(", ");
   classDecl.setExtends(`IntersectionType(${mixinNames})`);
}

/**
 * 📋 Adds all fields of the model/typeDef as decorated properties.
 */
function addFields({
   classDecl,
   item,
   imports,
   schemaPath,
}: {
   classDecl: ClassDeclaration;
   item: DataModel | TypeDef;
   imports: ImportRegistry;
   schemaPath: string;
}): void {
   for (const field of item.fields) {
      if (field.attributes.some((attr) => attr.decl.$refText.trim().slice(1).trim() === "ignore")) {
         continue;
      }

      const isArray = field.type.array ?? false;
      const isOptional = field.type.optional ?? false;
      const decorators: OptionalKind<DecoratorStructure>[] = [];

      let tsType = "any";

      if (field.type.reference) {
         const ref = field.type.reference.ref!;
         if (isEnum(ref)) {
            imports.add({ moduleSpecifier: schemaPath, namedImport: ref.name });
            imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "IsEnum" });
            tsType = ref.name;
            decorators.push({
               name: "IsEnum",
               arguments: resolveArgs([ref.name, isArray ? "{ each: true }" : undefined]),
            });
         } else if (isDataModel(ref) || isTypeDef(ref)) {
            const refDtoName = getDtoName(ref);
            imports.add({ moduleSpecifier: TRANSFORMER_LIB, namedImport: "Type" });
            imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "ValidateNested" });
            tsType = refDtoName;
            decorators.push({
               name: "ValidateNested",
               arguments: resolveArgs([isArray ? "{ each: true }" : undefined]),
            });
            decorators.push({ name: "Type", arguments: resolveArgs([`() => ${refDtoName}`]) });
         }
      } else {
         const scalar = field.type.type!;
         tsType = getScalarType({ scalarType: scalar, imports });
         addScalarDecorators({ scalar, isArray, decorators, imports });
      }

      for (const attr of field.attributes) {
         const dec = resolveAttribute({ attr, imports });
         if (dec) decorators.push(dec);
      }

      if (isOptional) {
         imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "IsOptional" });
         decorators.push({ name: "IsOptional", arguments: resolveArgs([]) });
      }

      classDecl.addProperty({
         name: field.name,
         type: `${tsType}${isArray ? "[]" : ""}`,
         hasQuestionToken: isOptional,
         hasExclamationToken: !isOptional,
         decorators,
         leadingTrivia: classDecl.getProperties().length === 0 ? undefined : "\n",
      });
   }
}

/**
 * 📐 Adds base type validators (IsNumber, IsString, IsDate, etc.) for scalar fields.
 */
function addScalarDecorators({
   scalar,
   isArray,
   decorators,
   imports,
}: {
   scalar: string;
   isArray: boolean;
   decorators: OptionalKind<DecoratorStructure>[];
   imports: ImportRegistry;
}): void {
   const eachOpt = isArray ? "{ each: true }" : undefined;

   if (["Int", "Float"].includes(scalar)) {
      imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "IsNumber" });
      decorators.push({ name: "IsNumber", arguments: resolveArgs([undefined, eachOpt]) });
   } else if (["String", "BigInt", "Decimal"].includes(scalar)) {
      imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "IsString" });
      decorators.push({ name: "IsString", arguments: resolveArgs([eachOpt]) });
   } else if (scalar === "Boolean") {
      imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "IsBoolean" });
      decorators.push({ name: "IsBoolean", arguments: resolveArgs([eachOpt]) });
   } else if (scalar === "DateTime") {
      imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "IsDate" });
      decorators.push({ name: "IsDate", arguments: resolveArgs([eachOpt]) });
      decorators.push({ name: "Type", arguments: resolveArgs(["() => Date"]) });
   } else if (scalar === "Json") {
      imports.add({ moduleSpecifier: VALIDATOR_LIB, namedImport: "IsObject" });
      decorators.push({ name: "IsObject", arguments: resolveArgs([eachOpt]) });
   }
}
