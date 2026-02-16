import type { DataModel, TypeDef } from "@zenstackhq/sdk/ast";
import { isDataModel } from "@zenstackhq/sdk/ast";

/**
 * 📛 Returns the DTO class name for a ZenStack model or type definition.
 * @param obj - A DataModel or TypeDef from the ZenStack AST.
 * @returns Class name string: "{name}DTO" for models, "{name}TypeDefDTO" for type defs.
 */
export function getDtoName(obj: DataModel | TypeDef): string {
   return isDataModel(obj) ? `${obj.name}DTO` : `${obj.name}TypeDefDTO`;
}
