# zenstack-validator

**ZenStack plugin and utilities for [class-validator](https://www.npmjs.com/package/class-validator)**: auto-generate
DTO classes from your ZModel schema, plus Nest-style mapped types driven by that schema.

---

## Installation

```bash
npm install zenstack-validator class-validator class-transformer
# or
pnpm add zenstack-validator class-validator class-transformer
# or
yarn add zenstack-validator class-validator class-transformer
```

For mapped types (Nest create/update DTOs), also install:

```bash
pnpm add @nestjs/common @nestjs/mapped-types @zenstackhq/schema
```

**Peer dependencies**

| Package | Required for |
| --- | --- |
| `class-validator`, `class-transformer` | Generated DTOs & decorators |
| `@zenstackhq/sdk` | Plugin generation |
| `@nestjs/common` (≥ 7.6.2), `@nestjs/mapped-types`, `@zenstackhq/schema` | `zenstack-validator/mapped-types` |

---

## ZenStack Plugin (Generate DTOs)

The plugin generates a TypeScript file of DTO classes with `class-validator` and `class-transformer` decorators from
your ZenStack schema.

### 1. Register the plugin

Add the plugin to your `schema.zmodel`:

```zmodel
plugin validator {
  provider = 'zenstack-validator/plugin'
  output = './src/dto'
}
```

- **`output`** (optional): Directory where DTOs are written.
- _Default:_ ZenStack’s default generation directory if omitted.

### 2. Run ZenStack Generate

```bash
npx zen generate
```

This creates typed DTO classes (for example `UserDTO`, `PostDTO`) in the configured output folder.

### 3. Use the generated DTOs

```typescript
import { UserDTO } from "./src/dto/validators";

@Post()
async createUser(@Body() body: UserDTO) {
  console.log(body.email); // Fully typed and validated
}
```

---

## Example: Schema → Generated Code

**Input: `schema.zmodel`**

```prisma
model User {
   id        String   @id @default(cuid())
   email     String   @email
   name      String?  @trim @lower
   age       Int      @gt(0, "Must be positive") @lte(120)
   createdAt DateTime @default(now())
}
```

**Output (illustrative)**

```typescript
import { IsEmail, IsOptional, IsInt, IsDate, Max } from "class-validator";
import { Type } from "class-transformer";
import { Trim, LowerCase, Gt } from "zenstack-validator";

export class UserDTO {
   @IsEmail()
   email!: string;

   @IsOptional()
   @Trim()
   @LowerCase()
   name?: string;

   @IsInt()
   @Gt(0, { message: "Must be positive" })
   @Max(120)
   age!: number;

   @IsDate()
   @Type(() => Date)
   createdAt!: Date;
}
```

A runnable project lives in [`example/`](./example) (generation + mapped types).

---

## Mapped Types

Schema-aware Nest mapped types live under `zenstack-validator/mapped-types`. They use Nest’s `OmitType` / `PickType` /
`PartialType` under the hood and keep validation metadata on the resulting classes.

### Bind the schema once

```typescript
import { CreateMappedTypes, OmitRelations, OmitPK, chain } from "zenstack-validator/mapped-types";
import { PartialType } from "@nestjs/mapped-types";
import { schema } from "./zenstack/schema";
import { UserDTO } from "./dto/validators";

const mapped = CreateMappedTypes(schema);

export class CreateUserDTO extends mapped.createType("User", UserDTO) {}
export class UpdateUserDTO extends mapped.updateType("User", UserDTO) {}
```

Pass a second argument to **add** custom helpers or **override** built-ins. Use
{@link mappedTypeCustoms} so inline factories are fully typed; each factory keeps the
`(schema, model, dto)` shape and is bound for you:

```typescript
import {
  CreateMappedTypes,
  mappedTypeCustoms,
  OmitRelations,
  OmitPK,
  type SchemaMappedTypeFn,
} from "zenstack-validator/mapped-types";
import { PartialType } from "@nestjs/mapped-types";

type AppSchema = typeof schema;

const customUpdateType: SchemaMappedTypeFn<AppSchema> = (schema, model, dto) =>
  PartialType(OmitRelations(schema, model, dto));

const softDeleteType: SchemaMappedTypeFn<AppSchema> = (schema, model, dto) =>
  OmitPK(schema, model, dto);

const mapped = CreateMappedTypes(
  schema,
  mappedTypeCustoms(schema)({
    updateType: customUpdateType, // override built-in
    softDeleteType, // add new helper
  }),
);

export class UpdateUserDTO extends mapped.updateType("User", UserDTO) {}
export class SoftDeleteUserDTO extends mapped.softDeleteType("User", UserDTO) {}
```

You can also call helpers with an explicit schema:

```typescript
import { CreateType, UpdateType } from "zenstack-validator/mapped-types";

export class CreateUserDTO extends CreateType(schema, "User", UserDTO) {}
export class UpdateUserDTO extends UpdateType(schema, "User", UserDTO) {}
```

### Create / Update

| Helper | Effect |
| --- | --- |
| **`CreateType`** | Omits computed fields, auto-generated fields (`@default`, `@updatedAt`, …), and relations. Foreign-key scalars (e.g. `userId`) are kept. |
| **`UpdateType`** | `CreateType` + Nest `PartialType` (all remaining fields optional). |

### Field selectors

| Helper | Keeps / drops |
| --- | --- |
| **`OmitRelations`** / **`OnlyRelations`** | Relation fields |
| **`OmitFK`** / **`OnlyFK`** | Foreign-key scalars (`foreignKeyFor`) |
| **`OmitPK`** / **`OnlyPK`** | Primary-key fields (`idFields`, including compound keys) |
| **`OmitScalars`** / **`OnlyScalars`** | Scalar fields (no relations, no FKs) |
| **`OmitComputed`** | `computed: true` fields |
| **`OmitAutoGenerated`** | Fields with `default`, `updatedAt`, or relation `hasDefault` |

Forge-bound names match the helpers (`mapped.omitRelations`, `mapped.onlyFK`, …).

### Fluent `chain`

Compose schema-aware operators and Nest DTO-only helpers (for example `PartialType`) while preserving types:

```typescript
import { chain, OmitPK, OmitRelations } from "zenstack-validator/mapped-types";
import { PartialType } from "@nestjs/mapped-types";

export class PatchUserDTO extends chain(schema, "User", UserDTO)
  .pipe(OmitPK)
  .pipe(OmitRelations)
  .pipe(PartialType)
  .build() {}

// Or with the forge:
export class PatchUserDTO extends mapped
  .chain("User", UserDTO)
  .pipe(OmitPK)
  .pipe(OmitRelations)
  .pipe(PartialType)
  .build() {}
```

`.pipe` accepts:

1. **Schema-aware** operators — `(schema, model, dto) => Type<U>` (`OmitPK`, custom helpers, …)
2. **DTO-only** operators — `(dto) => Type<U>` (Nest `PartialType`, wrappers, …)

Custom operators work without updating the library:

```typescript
.pipe((dto) => OmitType(dto, ["internalFlag"] as const))
```

### Field helpers

Low-level helpers such as `getRelationFieldsOfModel`, `getPrimaryKeyFieldsOfModel`, etc. are exported if you need the
key lists yourself.

See [`example/mapped-types.ts`](./example/mapped-types.ts) for a full walkthrough.

---

## Custom Decorators API

Custom decorators cover gaps in `class-validator` (strict inequalities) or provide transformation utilities.

| Decorator | Arguments | Description |
| --- | --- | --- |
| **`@Gt`** | `(min: number, options?)` | Value is **strictly greater than** `min`. |
| **`@Lt`** | `(max: number, options?)` | Value is **strictly less than** `max`. |
| **`@Trim`** | `()` | Trims whitespace (`class-transformer`). |
| **`@LowerCase`** | `()` | Lowercases strings (`class-transformer`). |
| **`@UpperCase`** | `()` | Uppercases strings (`class-transformer`). |

Standard attributes like `@email`, `@length`, `@min`, `@max`, and `@regex` map to built-in `class-validator` decorators.

---

## Package Exports

**Runtime decorators** (default entry):

```typescript
import { Gt, Lt, Trim, LowerCase, UpperCase } from "zenstack-validator";
```

**Generator plugin**:

```zmodel
plugin validator {
  provider = 'zenstack-validator/plugin'
  output = './src/dto'
}
```

**Mapped types**:

```typescript
import {
  CreateMappedTypes,
  CreateType,
  UpdateType,
  chain,
  OmitRelations,
  OnlyRelations,
  // …
} from "zenstack-validator/mapped-types";
```

---

## License

MIT
