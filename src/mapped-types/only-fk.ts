import { ForeignKeyFields, GetModels, SchemaDef } from "@zenstackhq/schema";
import { TypeWithKeys } from "./types";
import { getForeignKeyFieldsOfModel } from "./functions";
import { pickDtoKeys } from "./dto-keys";

/**
 * Creates a Nest mapped type from `dto` that keeps only the model's foreign-key fields.
 *
 * Compatible with {@link MappedTypeChain.pipe}.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - DTO instance shape (must include the foreign-key fields).
 * @param schema - Schema instance.
 * @param model - Model whose foreign keys to pick.
 * @param dto - Source DTO class constructor.
 */
export function OnlyFK<Schema extends SchemaDef, M extends GetModels<Schema>, T extends object>(
   schema: Schema,
   model: M,
   dto: TypeWithKeys<T, ForeignKeyFields<Schema, M>>,
) {
   return pickDtoKeys(dto, getForeignKeyFieldsOfModel(schema, model));
}
