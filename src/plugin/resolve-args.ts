/**
 * ✂️ Normalizes decorator argument lists for ts-morph: trims trailing undefined and maps undefined to the string "undefined".
 * @param args - Raw arguments (strings or undefined for optional slots).
 * @returns Trimmed array of strings, with any remaining undefined replaced by "undefined".
 */
export function resolveArgs(args: (string | undefined)[]): string[] {
   let lastDefinedIndex = -1;
   for (let i = args.length - 1; i >= 0; i--) {
      if (args[i] !== undefined) {
         lastDefinedIndex = i;
         break;
      }
   }

   return args.slice(0, lastDefinedIndex + 1).map((v) => (v === undefined ? "undefined" : v));
}
