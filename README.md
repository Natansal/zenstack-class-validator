# zenstack-validator

**ZenStack plugin and decorators for [class-validator](https://www.npmjs.com/package/class-validator)**: Auto-generate
DTOs with validation logic directly from your ZModel schema.

---

## Installation

```bash
npm install zenstack-validator class-validator class-transformer
# or
pnpm add zenstack-validator class-validator class-transformer
# or
yarn add zenstack-validator class-validator class-transformer

```

**Peer dependencies:** This package expects `class-validator`, `class-transformer`, and `@zenstackhq/sdk` to be
installed in your project.

---

## ZenStack Plugin (Generate DTOs)

The plugin generates a TypeScript file containing DTO classes—complete with `class-validator` and `class-transformer`
decorators—based on your ZenStack schema.

### 1. Register the plugin

Add the plugin to your `schema.zmodel`:

```zmodel
plugin validator {
  provider = 'zenstack-validator/plugin'
  output = './src/dto'
}

```

-  **`output`** (optional): The directory where the `dtos.ts` file will be generated.
-  _Default:_ To zenstack's default generation directory if omitted.

### 2. Run ZenStack Generate

```bash
npx zenstack generate

```

This will create `src/dto/dtos.ts` containing your typed DTO classes.

### 3. Use the generated DTOs

```typescript
// Import from your generated location
import { UserDTO } from "./src/dto/dtos";

// Example in a NestJS Controller
@Post()
async createUser(@Body() body: UserDTO) {
  console.log(body.email); // Fully typed and validated!
}

```

---

## Example: Schema → Generated Code

**Input: `schema.zmodel**`

```prisma
model User {
   id        String   @id @default(cuid())
   email     String   @email
   name      String?  @trim @lower
   age       Int      @gt(0, "Must be positive") @lte(120)
   createdAt DateTime @default(now())
}

```

**Output: `dtos.ts**`

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

---

## Custom Decorators API

This package includes custom decorators that cover gaps in the standard `class-validator` library (like strict
inequalities) or provide transformation utilities.

| Decorator        | Arguments                 | Description                                                  |
| ---------------- | ------------------------- | ------------------------------------------------------------ |
| **`@Gt`**        | `(min: number, options?)` | Validates that the value is **strictly greater than** `min`. |
| **`@Lt`**        | `(max: number, options?)` | Validates that the value is **strictly less than** `max`.    |
| **`@Trim`**      | `()`                      | Trims leading/trailing whitespace (via `class-transformer`). |
| **`@LowerCase`** | `()`                      | Converts string to lowercase (via `class-transformer`).      |
| **`@UpperCase`** | `()`                      | Converts string to uppercase (via `class-transformer`).      |

_Note: Standard validators like `@email`, `@length`, `@min`, `@max`, and `@regex` map directly to built-in
`class-validator` decorators._

---

## Package Exports

-  **Runtime Decorators** (Default export): Used by your application at runtime.

```typescript
import { Gt, Lt, Trim, LowerCase } from "zenstack-validator";
```

-  **Generator Plugin**: Used by the ZenStack CLI during generation.

```typescript
// In schema.zmodel
// provider = 'zenstack-validator/plugin'
```

---

## License

MIT
