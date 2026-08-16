import { Type } from "@nestjs/common";
import { PartialType } from "@nestjs/mapped-types";
import { GetModels, SchemaDef } from "@zenstackhq/schema";
import { CreateType } from "./create-type";

/**
 * Creates a Nest mapped type suitable for update input: {@link CreateType}
 * with all remaining fields made optional via Nest `PartialType`.
 *
 * Compatible with {@link MappedTypeChain.pipe}.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - DTO instance shape.
 * @param schema - Schema instance.
 * @param model - Model the DTO corresponds to.
 * @param dto - Source DTO class constructor.
 *
 * @example
 * ```ts
 * class UpdateUserDTO extends UpdateType(schema, "User", UserDTO) {}
 * ```
 */
export function UpdateType<Schema extends SchemaDef, M extends GetModels<Schema>, T extends object>(
   schema: Schema,
   model: M,
   dto: Type<T>,
) {
   return PartialType(CreateType(schema, model, dto));
}
