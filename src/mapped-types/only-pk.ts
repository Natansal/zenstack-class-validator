import { GetModels, SchemaDef } from "@zenstackhq/schema";
import { PrimaryKeyFields, TypeWithKeys } from "./types";
import { getPrimaryKeyFieldsOfModel } from "./functions";
import { pickDtoKeys } from "./dto-keys";

/**
 * Creates a Nest mapped type from `dto` that keeps only the model's primary-key fields.
 *
 * Compatible with {@link MappedTypeChain.pipe}.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - DTO instance shape (must include the primary-key fields).
 * @param schema - Schema instance.
 * @param model - Model whose primary key to pick.
 * @param dto - Source DTO class constructor.
 */
export function OnlyPK<Schema extends SchemaDef, M extends GetModels<Schema>, T extends object>(
   schema: Schema,
   model: M,
   dto: TypeWithKeys<T, PrimaryKeyFields<Schema, M>>,
) {
   return pickDtoKeys(dto, getPrimaryKeyFieldsOfModel(schema, model));
}
