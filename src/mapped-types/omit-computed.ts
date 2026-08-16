import { Type } from "@nestjs/common";
import { GetModels, SchemaDef } from "@zenstackhq/schema";
import { getComputedFieldsOfModel } from "./functions";
import { omitDtoKeys } from "./dto-keys";

/**
 * Creates a Nest mapped type from `dto` with the model's computed fields omitted.
 *
 * Compatible with {@link MappedTypeChain.pipe}.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - DTO instance shape.
 * @param schema - Schema instance.
 * @param model - Model whose computed fields to omit.
 * @param dto - Source DTO class constructor.
 */
export function OmitComputed<Schema extends SchemaDef, M extends GetModels<Schema>, T extends object>(
   schema: Schema,
   model: M,
   dto: Type<T>,
) {
   return omitDtoKeys(dto, getComputedFieldsOfModel(schema, model));
}
