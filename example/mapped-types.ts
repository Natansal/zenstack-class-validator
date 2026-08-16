/**
 * Examples of schema-aware Nest mapped types from `zenstack-validator/mapped-types`.
 *
 * Run typecheck: `pnpm exec tsc -p tsconfig.json`
 * Run: `pnpm mapped-types`
 */
import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { PartialType } from "@nestjs/mapped-types";
import {
   CreateMappedTypes,
   CreateType,
   OmitFK,
   OmitPK,
   OmitRelations,
   OnlyFK,
   UpdateType,
   chain,
   mappedTypeCustoms,
   type SchemaMappedTypeFn,
} from "zenstack-validator/mapped-types";
import { schema } from "./generated/schema";
import { PostDTO, UserDTO } from "./generated/validators";
import { Role } from "./generated/models";

type AppSchema = typeof schema;

/** Override built-in updateType: partial of non-relation fields only. */
const customUpdateType: SchemaMappedTypeFn<AppSchema> = (schema, model, dto) =>
   PartialType(OmitRelations(schema, model, dto));

/** Custom helper: patch shape without PK / relations. */
const userPatchType: SchemaMappedTypeFn<AppSchema> = (schema, model, dto) =>
   chain(schema, model, dto).pipe(OmitPK).pipe(OmitRelations).pipe(PartialType).build();

// Bind the schema once — helpers no longer need it on every call.
// Optional second arg: add/override helpers (still bound to `schema`).
const mapped = CreateMappedTypes(
   schema,
   mappedTypeCustoms(schema)({
      updateType: customUpdateType,
      userPatchType,
   }),
);

// ---------------------------------------------------------------------------
// Create / Update (composed helpers)
// ---------------------------------------------------------------------------

/** Create input: no PK/defaults/relations (FK scalars like `userId` are kept). */
export class CreateUserDTO extends mapped.createType("User", UserDTO) {}

/** Update input: overridden to PartialType(OmitRelations) via customs. */
export class UpdateUserDTO extends mapped.updateType("User", UserDTO) {}

/** Custom helper registered on the forge. */
export class UserPatchDTO extends mapped.userPatchType("User", UserDTO) {}

/** Same helpers without the forge (pass schema explicitly). */
export class CreatePostDTO extends CreateType(schema, "Post", PostDTO) {}
export class UpdatePostDTO extends UpdateType(schema, "Post", PostDTO) {}

// ---------------------------------------------------------------------------
// Individual omit / pick helpers
// ---------------------------------------------------------------------------

export class UserWithoutRelationsDTO extends mapped.omitRelations("User", UserDTO) {}
export class PostForeignKeysDTO extends OnlyFK(schema, "Post", PostDTO) {}
export class PostWithoutForeignKeysDTO extends OmitFK(schema, "Post", PostDTO) {}

// ---------------------------------------------------------------------------
// Fluent chain (schema-aware + Nest DTO-only operators)
// ---------------------------------------------------------------------------

/** Custom update shape: drop PK & relations, then make everything optional. */
export class PatchUserDTO extends mapped
   .chain("User", UserDTO)
   .pipe(OmitPK)
   .pipe(OmitRelations)
   .pipe(PartialType)
   .build() {}

/** Equivalent without the forge. */
export class PatchPostDTO extends chain(schema, "Post", PostDTO)
   .pipe(OmitRelations)
   .pipe(OmitFK)
   .pipe(PartialType)
   .build() {}

// ---------------------------------------------------------------------------
// Runtime check (optional)
// ---------------------------------------------------------------------------

async function main() {
   const createUser = plainToInstance(CreateUserDTO, {
      email: "alice@example.com",
      name: " Alice ",
      score: 42,
      role: Role.USER,
   });

   const createErrors = await validate(createUser);
   console.log("CreateUserDTO valid?", createErrors.length === 0);
   if (createErrors.length) console.log(createErrors);

   const updateUser = plainToInstance(UpdateUserDTO, { email: "bob@example.com" });
   const updateErrors = await validate(updateUser);
   console.log("UpdateUserDTO valid?", updateErrors.length === 0);

   const createPost = plainToInstance(CreatePostDTO, {
      userId: "user_1",
      title: "Hello",
      published: false,
   });
   const postErrors = await validate(createPost);
   console.log("CreatePostDTO valid?", postErrors.length === 0);
   if (postErrors.length) console.log(postErrors);

   // Types: CreateUserDTO has email, not id/posts
   const _email: string = (createUser as InstanceType<typeof CreateUserDTO>).email;
   void _email;
}

main().catch(console.error);
