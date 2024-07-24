import type { Plugin } from "vite";
import {
  decoratorLoaderSource,
  loaderSource,
  productionLoaderSource,
} from "./loader.js";

export const hmrify = (): Plugin[] => {
  return [
    {
      name: "hmrify",
      apply: "serve",
      enforce: "post",
      transform(code, id) {
        if (id.includes("/node_modules/")) {
          return;
        }
        if (![".ts", ".js"].some((ext) => id.endsWith(ext))) {
          return;
        }

        if (!code.includes("import.meta.hmrify")) {
          return;
        }

        const hmrifyReplaced = code
          .replace(
            /export(?<exportSpace>\s+)const(?<constNameSpace>\s+)(?<constName>\S+)(?<constValue>\s+=\s+)import\.meta\.hmrify\(/g,
            (_match, exportSpace, constNameSpace, constName, constValue) => {
              return `export${exportSpace}const${constNameSpace}${constName}${constValue}__hmrify_internal(${JSON.stringify(constName)})(`;
            },
          )
          .replace(
            /export(?<exportSpace>\s+)default(?<defaultSpace>\s+)import\.meta\.hmrify\(/g,
            (_match, exportSpace, defaultSpace) => {
              return `export${exportSpace}default${defaultSpace}(__hmrify_internal)('default')(`;
            },
          )
          .replace(
            /(?<name>\w+)(?<beforeDecorate>\s*=\s*)__decorateClass\(\[(?<before>(?:[\s\S]*?,)?\s*)import\.meta\.hmrify/g,
            (_match, name, beforeDecorate, before) => {
              const exportName = code.includes(` ${name} as default`)
                ? "default"
                : name;
              return `${name}${beforeDecorate}__decorateClass([${before}(__hmrify_internal_decorator)(${JSON.stringify(exportName)})`;
            },
          );
        if (hmrifyReplaced.includes("import.meta.hmrify")) {
          this.error(
            [
              "import.meta.hmrify is not replaced completely, please check your code.",
              "You may have used import.meta.hmrify in a way that is not supported.",
              "You only can use import.meta.hmrify in one of the following ways:",
              "- export const foo = import.meta.hmrify(/* { ... options ... }, */ () => {});",
              "- export default import.meta.hmrify(/* { ... options ... }, */ () => {});",
              "- export const foo = import.meta.hmrify(/* { ... options ... }, */ class Foo {});",
              "- export default import.meta.hmrify(/* { ... options ... }, */ class Foo {});",
              "- @(import.meta.hmrify/* ({ ... options ... }) */) export class Foo {}",
              "- @(import.meta.hmrify/* ({ ... options ... }) */) export default class Foo {}",
              hmrifyReplaced.includes("@(import.meta.hmrify") &&
                "Hint: import.meta.hmrify cannot be used as a native decorator, have you set experimentalDecorators: true in your tsconfig.json?",
            ]
              .filter((line: string) => typeof line === "string")
              .join("\n"),
          );
        }
        return {
          code: `var __hmrify_internal = ${loaderSource};var __hmrify_internal_decorator = ${decoratorLoaderSource};${hmrifyReplaced}`,
          map: null,
        };
      },
    },
    {
      name: "hmrify",
      apply: "build",
      enforce: "post",
      transform(code, id) {
        if (id.includes("/node_modules/")) {
          return;
        }
        if (![".ts", ".js"].some((ext) => id.endsWith(ext))) {
          return;
        }

        const replaced = code.replaceAll(
          "import.meta.hmrify",
          `(${productionLoaderSource})`,
        );
        return { code: replaced, map: null };
      },
    },
  ];
};

export default hmrify;
