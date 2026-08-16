import { GetModels, ScalarFields, SchemaDef } from "@zenstackhq/schema";
import { TypeWithKeys } from "./types";
import { getScalarFieldsOfModel } from "./functions";
import { pickDtoKeys } from "./dto-keys";

/**
 * Creates a Nest mapped type from `dto` that keeps only the model's scalar fields
 * (excludes relations and foreign keys).
 *
 * Compatible with {@link MappedTypeChain.pipe}.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - DTO instance shape (must include the scalar fields).
 * @param schema - Schema instance.
 * @param model - Model whose scalars to pick.
 * @param dto - Source DTO class constructor.
 */
export function OnlyScalars<Schema extends SchemaDef, M extends GetModels<Schema>, T extends object>(
   schema: Schema,
   model: M,
   dto: TypeWithKeys<T, ScalarFields<Schema, M>>,
) {
   return pickDtoKeys(dto, getScalarFieldsOfModel(schema, model));
}
