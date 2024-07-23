import type { Plugin } from "vite";
import { loaderSource } from "./loader.js";

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

        const declaration = code
          .replace(
            /const(?<constNameSpace>\s+)(?<constName>\S+)(?<constValue>\s+=\s+)import\.meta\.hmrify\(/g,
            (_match, constNameSpace, constName, constValue) => {
              return `const${constNameSpace}${constName}${constValue}(${loaderSource})(${JSON.stringify(constName)})(`;
            },
          )
          .replace(
            /export(?<exportSpace>\s+)default(?<defaultSpace>\s+)import\.meta\.hmrify\(/g,
            (_match, exportSpace, defaultSpace) => {
              return `export${exportSpace}default${defaultSpace}(${loaderSource})('default')(`;
            },
          )
          .replaceAll(
            "import.meta.hmrify",
            "(() => throw new Error('Unexpected import.meta.hmrify'))",
          );
        return { code: declaration, map: null };
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

        const declaration = code.replaceAll(
          "import.meta.hmrify",
          "((...args) => args.at(-1))",
        );
        return { code: declaration, map: null };
      },
    },
  ];
};

export default hmrify;
