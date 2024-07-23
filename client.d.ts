interface ImportMeta {
  /**
   * Makes a function or class hot-reloadable.
   *
   * @param options The options for making the function or class hot-reloadable.
   * @param fn The function or class to make hot-reloadable.
   * @returns The hot-reloadable function or class.
   */
  hmrify: {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    <T extends (new (...args: any[]) => any) | ((...args: any[]) => any)>(
      fn: T,
    ): T;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    <T extends (new (...args: any[]) => any) | ((...args: any[]) => any)>(
      options: {
        /**
         * Class only: Whether to reconstruct the class instance.
         *
         * If `true`, new instances will be created and existing instances' attributes will be
         * overwritten with the new instances' attributes when hot-reloaded.
         * If `false`, existing instances will be kept. Only prototype attributes will be updated.
         *
         * @see https://github.com/sevenc-nanashi/vite-plugin-hmrify/tree/main/example
         *
         * Default: `false`.
         */
        reconstruct?: boolean;
      },
      fn: T,
    ): T;
  };
}
