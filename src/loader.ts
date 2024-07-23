/// <reference types="vite/client" />
import { transformSync } from "esbuild";

type AnyClass = new (...args: unknown[]) => object;
type AnyFunction = (...args: unknown[]) => unknown;
type InternalFn = "__HMRIFY_INTERNAL_FN__";
type Proxied<T> = T & Record<InternalFn, AnyFunction>;
type Options = { reconstruct: boolean };

const loaderFn =
  (name: string) =>
  (
    ...args:
      | [target: AnyClass | AnyFunction]
      | [options: Partial<Options>, target: AnyClass | AnyFunction]
  ) => {
    let options: Partial<Options> = {};
    let target: AnyClass | AnyFunction;
    if (args.length === 1) {
      options = { reconstruct: false };
      [target] = args;
    } else {
      [options, target] = args;
    }
    if (!import.meta.hot) {
      return target;
    }

    const deepEqual = (a: unknown, b: unknown): boolean => {
      if (a === b) {
        return true;
      }
      if (typeof a !== "object" || typeof b !== "object") {
        return false;
      }
      if (a === null || b === null) {
        return false;
      }
      if (Object.keys(a).length !== Object.keys(b).length) {
        return false;
      }
      for (const key in a) {
        if (!deepEqual(a[key], b[key])) {
          return false;
        }
      }
      return true;
    };
    const resolvedOptions: Options = {
      reconstruct: true,
      ...options,
    };

    const kind: "class" | "function" | "unknown" =
      typeof target === "function"
        ? /^\s*class\s+/.test(target.toString())
          ? "class"
          : "function"
        : "unknown";
    if (kind === "unknown") {
      throw new Error(
        "Unsupported kind of export. Only classes and functions are supported.",
      );
    }

    const state: {
      instances: { instance: object; args: unknown[] }[];
      proxy: Proxied<AnyClass | AnyFunction> | undefined;
      type: "class" | "function";
      resolvedOptions: Options;
    } = {
      instances: [],
      proxy: undefined,
      type: kind,
      resolvedOptions,
    };
    if (import.meta.hot.data.hmrifyState?.[name]) {
      const previousType = import.meta.hot.data.hmrifyState[name].type;
      if (previousType !== kind) {
        import.meta.hot.invalidate(
          `[vite-plugin-hmrify] Incompatible HMR type change for ${name}, invalidating...`,
        );
        return target;
      }
      const previousResolvedOptions = import.meta.hot.data.hmrifyState[name]
        .resolvedOptions;
      if (!deepEqual(previousResolvedOptions, resolvedOptions)) {
        import.meta.hot.invalidate(
          `[vite-plugin-hmrify] ${name} options changed, invalidating...`,
        );
        return target;
      }
      console.log(`[vite-plugin-hmrify] Taking over ${name}`);
    } else {
      console.log(`[vite-plugin-hmrify] HMRifying ${kind}: ${name}`);
    }
    state.instances = import.meta.hot.data.hmrifyState?.[name]?.instances || [];
    state.proxy = import.meta.hot.data.hmrifyState?.[name]?.proxy;
    import.meta.hot.data.hmrifyState ??= {};
    import.meta.hot.data.hmrifyState[name] = state;

    const skipHook = "___HMRIFY_SKIP_TOKEN_**NONCE**___";
    const internalFn =
      "___HMRIFY_INTERNAL_FN_**NONCE**___" as unknown as InternalFn;

    import.meta.hot.accept(async (newModule) => {
      if (!newModule) {
        return;
      }
      const newTarget = newModule[name];
      if (!newTarget) {
        import.meta.hot.invalidate(
          `[vite-plugin-hmrify] ${name} not found in new module, invalidating...`,
        );
        return;
      }
      for (const { instance, args } of state.instances) {
        if (resolvedOptions.reconstruct) {
          console.log(
            `[vite-plugin-hmrify] Reconstructing ${name} instance and replacing existing instance`,
          );
          const newInstance = Reflect.construct(
            newTarget,
            [skipHook, ...args],
            newTarget,
          );
          Object.assign(instance, newInstance);
        }
        Object.setPrototypeOf(instance, newTarget.prototype);
        instance.constructor = newTarget;
      }
      if (state.proxy) {
        state.proxy[internalFn] = newTarget;
      }
    });

    if (kind === "class") {
      let replacedTarget: AnyClass | undefined = undefined;
      const proxied = new Proxy(target, {
        construct(target, argArray, newTarget) {
          if (argArray[0] === skipHook) {
            return Reflect.construct(target, argArray.slice(1), newTarget);
          }
          const instance = Reflect.construct(
            replacedTarget ?? target,
            argArray,
            newTarget,
          );
          state.instances.push({ instance, args: argArray });
          return instance;
        },

        set(target, p, value, receiver) {
          if (p === internalFn) {
            replacedTarget = value;
            return true;
          }
          return Reflect.set(target, p, value, receiver);
        },
      }) as Proxied<AnyClass>;
      state.proxy = proxied;

      return proxied;
    }
    if (kind === "function") {
      let replacedTarget: AnyFunction | undefined = undefined;
      const proxied = new Proxy(target as AnyFunction, {
        apply(target, thisArg, argArray) {
          return Reflect.apply(replacedTarget ?? target, thisArg, argArray);
        },
        set(target, p, value, receiver) {
          if (p === internalFn) {
            replacedTarget = value;
            return true;
          }
          return Reflect.set(target, p, value, receiver);
        },
      });
      state.proxy = proxied as Proxied<AnyFunction>;

      return proxied;
    }
  };

export const loaderSource = transformSync(
  `export default ${loaderFn.toString()}`,
  {
    minify: true,
  },
)
  .code.trim()
  .replace("export default ", "")
  .replace(/;$/, "")
  .replaceAll("**NONCE**", () => Math.random().toString(36).slice(2));

declare const __hmrify_internal: typeof loaderFn;
const decoratorLoader =
  (name: string) =>
  (optionOrTarget: AnyClass | AnyFunction | Partial<Options>) => {
    if (typeof optionOrTarget === "function") {
      return __hmrify_internal(name)(optionOrTarget);
    }
    return (target: AnyClass | AnyFunction) =>
      __hmrify_internal(name)(optionOrTarget, target);
  };

export const decoratorLoaderSource = transformSync(
  `export default ${decoratorLoader.toString()}`,
  {
    minify: true,
  },
)
  .code.trim()
  .replace("export default ", "")
  .replace(/;$/, "");
