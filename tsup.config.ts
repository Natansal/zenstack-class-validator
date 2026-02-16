import { defineConfig } from "tsup";

export default defineConfig({
   entry: ["src/index.ts", "src/plugin/index.ts"],
   format: ["cjs", "esm"],
   dts: true,
   clean: true,
   sourcemap: true,
   outDir: "dist",
   external: [
      "@zenstackhq/sdk",
      "class-validator",
      "class-transformer",
      "ts-morph",
      "path",
      "fs",
      "fs/promises",
      "node:path",
      "node:fs",
      "node:fs/promises",
   ],
});
