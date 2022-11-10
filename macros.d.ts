// @todo rename file to macros

declare global {
  // const $useCssModule: (name: string) => string;

  /**
   * Macro used to access CSS modules in script
   */
  const $style: Record<string, string>;
}

export {};
