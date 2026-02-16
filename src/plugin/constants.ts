/** 📦 Library specifiers used for generated import statements. */
export const TRANSFORMER_LIB = "class-transformer";
export const VALIDATOR_LIB = "class-validator";
export const MAPPED_TYPES_LIB = "@nestjs/mapped-types";

/** 📌 Package (or path) for custom decorators: Trim, LowerCase, UpperCase, Gt, Lt. */
export const CUSTOM_VALIDATORS_PATH = "zenstack-validator";

/** 🚫 ZenStack field attributes that are not turned into class-validator decorators. */
export const IGNORED_ATTRIBUTES: (string | RegExp)[] = [
   "deny",
   "allow",
   "map",
   /^db./,
   "default",
   "unique",
   "id",
   "updatedAt",
   "relation",
   "computed",
   /^prisma./,
   "omit",
   "ignore",
];
