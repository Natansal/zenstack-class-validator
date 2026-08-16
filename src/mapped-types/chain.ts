import { Type } from "@nestjs/common";
import { GetModels, SchemaDef } from "@zenstackhq/schema";

/**
 * Schema-aware mapped-type operator.
 *
 * Built-ins like {@link OmitPK} use this shape; custom operators may too.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - Input DTO instance shape.
 * @typeParam U - Output DTO instance shape.
 */
export type MappedTypeOperator<
   Schema extends SchemaDef,
   M extends GetModels<Schema>,
   T extends object,
   U extends object,
> = (schema: Schema, model: M, dto: Type<T>) => Type<U>;

/**
 * DTO-only mapped-type operator that does not need the schema or model.
 *
 * Examples: Nest `PartialType`, or `(dto) => OmitType(dto, ['x'])`.
 *
 * @typeParam T - Input DTO instance shape.
 * @typeParam U - Output DTO instance shape.
 */
export type DtoMappedTypeOperator<T extends object, U extends object> = (dto: Type<T>) => Type<U>;

/**
 * Union of schema-aware and DTO-only operators accepted by {@link MappedTypeChain.pipe}.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - Input DTO instance shape.
 * @typeParam U - Output DTO instance shape.
 */
export type AnyMappedTypeOperator<
   Schema extends SchemaDef,
   M extends GetModels<Schema>,
   T extends object,
   U extends object,
> = MappedTypeOperator<Schema, M, T, U> | DtoMappedTypeOperator<T, U>;

/**
 * Fluent builder that applies mapped-type operators left-to-right while
 * preserving the resulting DTO type.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - Current DTO instance shape.
 *
 * @see {@link chain}
 */
export class MappedTypeChain<
   Schema extends SchemaDef,
   M extends GetModels<Schema>,
   T extends object,
> {
   /**
    * @param schema - Schema instance closed over by the chain.
    * @param model - Model name closed over by the chain.
    * @param dto - Current DTO class constructor.
    */
   constructor(
      private readonly schema: Schema,
      private readonly model: M,
      private readonly dto: Type<T>,
   ) {}

   /**
    * Applies a DTO-only operator (e.g. Nest `PartialType`) and returns a new chain.
    *
    * @typeParam U - Resulting DTO instance shape.
    * @param operator - Function `(dto) => Type<U>`.
    */
   pipe<U extends object>(operator: DtoMappedTypeOperator<T, U>): MappedTypeChain<Schema, M, U>;
   /**
    * Applies a schema-aware operator (e.g. {@link OmitPK}) and returns a new chain.
    *
    * @typeParam U - Resulting DTO instance shape.
    * @param operator - Function `(schema, model, dto) => Type<U>`.
    */
   pipe<U extends object>(
      operator: MappedTypeOperator<Schema, M, T, U>,
   ): MappedTypeChain<Schema, M, U>;
   pipe<U extends object>(
      operator: AnyMappedTypeOperator<Schema, M, T, U>,
   ): MappedTypeChain<Schema, M, U> {
      const next =
         operator.length < 3
            ? (operator as DtoMappedTypeOperator<T, U>)(this.dto)
            : (operator as MappedTypeOperator<Schema, M, T, U>)(this.schema, this.model, this.dto);
      return new MappedTypeChain(this.schema, this.model, next);
   }

   /**
    * Returns the final DTO class constructor.
    *
    * Safe to `extends` or pass to Nest's `ValidationPipe`.
    */
   build(): Type<T> {
      return this.dto;
   }
}

/**
 * Starts a type-safe mapped-type chain for `model` and `dto`.
 *
 * @typeParam Schema - ZenStack schema definition.
 * @typeParam M - Model name within `Schema`.
 * @typeParam T - Initial DTO instance shape.
 * @param schema - Schema instance.
 * @param model - Model the DTO corresponds to.
 * @param dto - Starting DTO class constructor.
 *
 * @example
 * ```ts
 * class CreateUserDTO extends chain(schema, "User", UserDTO)
 *   .pipe(OmitPK)
 *   .pipe(OmitRelations)
 *   .pipe(PartialType)
 *   .build() {}
 * ```
 */
export function chain<Schema extends SchemaDef, M extends GetModels<Schema>, T extends object>(
   schema: Schema,
   model: M,
   dto: Type<T>,
): MappedTypeChain<Schema, M, T> {
   return new MappedTypeChain(schema, model, dto);
}
