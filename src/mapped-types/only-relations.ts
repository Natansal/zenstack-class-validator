import { GetModels, RelationFields, SchemaDef } from "@zenstackhq/schema";
import { TypeWithKeys } from "./types";
import { getRelationFieldsOfModel } from "./functions";
import { pickDtoKeys } from "./dto-keys";

/**
 * Creates a Nest mapped type from `dto` that keeps only the model's relation fields.
 *
 * Compatible with {@link MappedTypeChain.pipe}.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - DTO instance shape (must include the relation fields).
 * @param schema - Schema instance.
 * @param model - Model whose relations to pick.
 * @param dto - Source DTO class constructor.
 */
export function OnlyRelations<Schema extends SchemaDef, M extends GetModels<Schema>, T extends object>(
   schema: Schema,
   model: M,
   dto: TypeWithKeys<T, RelationFields<Schema, M>>,
) {
   return pickDtoKeys(dto, getRelationFieldsOfModel(schema, model));
}
