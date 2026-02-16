import type { CliPlugin } from "@zenstackhq/sdk";
import { generateDtos } from "./generator";
import path from "path";
import { isPlugin } from "@zenstackhq/sdk/ast";

/**
 * 🔌 ZenStack CLI plugin that generates class-validator DTOs from the schema.
 * Use as the default export for the "plugin" subpath of this package.
 */
const plugin: CliPlugin = {
   name: "DTO generator",
   statusText: "Generating DTOs...",

   generate: async ({ model, defaultOutputPath, pluginOptions, schemaFile }) => {
      const schemaDir = path.dirname(schemaFile);
      const outputDir =
         pluginOptions.output && typeof pluginOptions.output === "string"
            ? path.resolve(schemaDir, pluginOptions.output)
            : defaultOutputPath;
      const modelsDir = path.join(defaultOutputPath, "models");
      let relativePath = path.relative(outputDir, modelsDir);
      if (!relativePath.startsWith(".")) {
         relativePath = "./" + relativePath;
      }
      relativePath = relativePath.split(path.sep).join(path.posix.sep);

      await generateDtos({ model, outputPath: outputDir, schemaPath: relativePath });
   },
};

export default plugin;
