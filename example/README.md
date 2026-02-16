# zenstack-validator example

This folder shows how to use the **zenstack-validator** plugin to generate class-validator DTOs from a ZenStack schema.

## Prerequisites

- Node 18+
- pnpm (or npm/yarn)

## Setup

From the **repository root** (so the plugin can be linked):

```bash
# Install root dependencies and build the plugin
pnpm install
pnpm build

# Install example dependencies (links the plugin)
cd example
pnpm install
```

Set a dummy `DATABASE_URL` so the schema is valid (Prisma/ZenStack require it even if you only use the validator plugin):

```bash
export DATABASE_URL="postgresql://user:pass@localhost:5432/db"
# or add a .env in example/ with: DATABASE_URL="postgresql://..."
```

## Generate DTOs

```bash
pnpm generate
```

This runs `zenstack generate`, which:

1. Reads `schema.zmodel`
2. Runs the **zenstack-validator** plugin
3. Writes `generated/validators.ts` with `UserDTO`, `PostDTO`, etc.

## Run the usage script

The example includes a small script that uses the generated DTOs with `class-validator` and `class-transformer`:

```bash
pnpm validate
```

This runs `usage.ts`, which instantiates and validates a `UserDTO` and a `PostDTO`.

## Schema overview

- **User**: `email` (@email), optional `name` (@trim, @lower), `score` (@gt(0), @lte(100)), `role` (enum), `createdAt`.
- **Post**: `title` (@length(1, 200)), optional `content`, `published` (boolean).

The generated `validators.ts` uses decorators from **class-validator**, **class-transformer**, and **zenstack-validator** (Gt, Lt, Trim, LowerCase, etc.).

## Enums

The schema defines a `Role` enum. The plugin generates an import like `import { Role } from "./models"` in `validators.ts`. This example includes a stub **`generated/models.ts`** so that import resolves without running ZenStack’s full codegen. In a real app you’d replace it with your generated enums or define enums in that file.
