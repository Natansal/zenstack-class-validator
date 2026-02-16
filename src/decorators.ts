import { Transform, TransformOptions } from "class-transformer";
import { registerDecorator, ValidationArguments, ValidationOptions } from "class-validator";

/**
 * 📐 Registers a class-validator decorator that ensures a number is strictly greater than a given value.
 * @param params - Options object.
 * @param params.minValue - The exclusive lower bound; the property value must be greater than this.
 * @param params.validationOptions - Optional class-validator options (e.g. message, groups).
 * @returns A property decorator function.
 */
export function Gt(minValue: number, validationOptions?: ValidationOptions) {
   return function (object: Object, propertyName: string) {
      registerDecorator({
         name: "gt",
         target: object.constructor,
         propertyName: propertyName,
         constraints: [minValue],
         options: validationOptions,
         validator: {
            validate: (value: any) => typeof value === "number" && value > minValue,
            defaultMessage: (args: ValidationArguments) =>
               `${args.property} must be greater than ${args.constraints[0]}`,
         },
      });
   };
}

/**
 * 📐 Registers a class-validator decorator that ensures a number is strictly less than a given value.
 * @param params - Options object.
 * @param params.maxValue - The exclusive upper bound; the property value must be less than this.
 * @param params.validationOptions - Optional class-validator options (e.g. message, groups).
 * @returns A property decorator function.
 */
export function Lt(maxValue: number, validationOptions?: ValidationOptions) {
   return function (object: Object, propertyName: string) {
      registerDecorator({
         name: "lt",
         target: object.constructor,
         propertyName: propertyName,
         constraints: [maxValue],
         options: validationOptions,
         validator: {
            validate: (value: any) => typeof value === "number" && value < maxValue,
            defaultMessage: (args: ValidationArguments) => `${args.property} must be less than ${args.constraints[0]}`,
         },
      });
   };
}

/**
 * ✂️ Trims leading and trailing whitespace from a string property (class-transformer).
 * Non-string values are left unchanged.
 * @param options - Optional transform options (e.g. toClassOnly, toPlainOnly).
 * @returns A property decorator that applies the trim transform.
 */
export function Trim(options?: TransformOptions) {
   return Transform(({ value }) => {
      if (typeof value !== "string") return value;
      return value.trim();
   }, options);
}

/**
 * 🔤 Converts a string property to lowercase (class-transformer).
 * Non-string values are left unchanged.
 * @param options - Optional transform options (e.g. toClassOnly, toPlainOnly).
 * @returns A property decorator that applies the lowercase transform.
 */
export function LowerCase(options?: TransformOptions) {
   return Transform(({ value }) => {
      if (typeof value !== "string") return value;
      return value.toLowerCase();
   }, options);
}

/**
 * 🔤 Converts a string property to uppercase (class-transformer).
 * Non-string values are left unchanged.
 * @param options - Optional transform options (e.g. toClassOnly, toPlainOnly).
 * @returns A property decorator that applies the uppercase transform.
 */
export function UpperCase(options?: TransformOptions) {
   return Transform(({ value }) => {
      if (typeof value !== "string") return value;
      return value.toUpperCase();
   }, options);
}
