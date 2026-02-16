import { SourceFile } from "ts-morph";

export class ImportRegistry {
   private imports = new Map<string, Set<string>>();

   add({ moduleSpecifier, namedImport }: { moduleSpecifier: string; namedImport: string }) {
      if (!this.imports.has(moduleSpecifier)) {
         this.imports.set(moduleSpecifier, new Set());
      }
      this.imports.get(moduleSpecifier)!.add(namedImport);
   }

   applyToSourceFile(sourceFile: SourceFile) {
      const sortedModules = Array.from(this.imports.keys()).sort();

      sortedModules.forEach((moduleSpecifier) => {
         const namedImports = Array.from(this.imports.get(moduleSpecifier)!).sort();
         sourceFile.addImportDeclaration({
            moduleSpecifier,
            namedImports,
         });
      });
   }
}
