import { Type } from "@nestjs/common";
import { OmitType, PickType } from "@nestjs/mapped-types";
import { TypeWithKeys } from "./types";

/**
 * Creates a Nest mapped type that omits `keys` from `dto`, preserving
 * validation and transformation metadata for the remaining properties.
 *
 * @typeParam T - DTO instance shape.
 * @typeParam K - Keys to omit.
 * @param dto - Source DTO class constructor.
 * @param keys - Property names to remove.
 */
export function omitDtoKeys<T extends object, K extends PropertyKey>(
   dto: Type<T>,
   keys: K[],
): Type<Omit<T, Extract<K, keyof T>>> {
   return OmitType(dto, keys as Array<Extract<K, keyof T>>) as Type<Omit<T, Extract<K, keyof T>>>;
}

/**
 * Creates a Nest mapped type that picks only `keys` from `dto`, preserving
 * validation and transformation metadata for those properties.
 *
 * @typeParam T - DTO instance shape.
 * @typeParam K - Keys to keep (must exist on `T`).
 * @param dto - Source DTO class constructor.
 * @param keys - Property names to keep.
 */
export function pickDtoKeys<T extends object, K extends PropertyKey>(
   dto: TypeWithKeys<T, K>,
   keys: K[],
): Type<Pick<T, Extract<K, keyof T>>> {
   return PickType(dto as Type<T>, keys as Array<Extract<K, keyof T>>) as Type<
      Pick<T, Extract<K, keyof T>>
   >;
}
