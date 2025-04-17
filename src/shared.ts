/**
 * Parse optionally quoted values and string literals
 * @param val
 * @returns
 */
export const parseQuotedValue = (val: string) =>
  // prettier-ignore
  val.match(/(?<quote>['"`]?)(?<value>[^]*)\1/)!
    .groups as { 
        quote: "" | "`" | '"' | "'"
        value: string
    };
