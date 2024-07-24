/// <reference types="vite/client" />
import { transformSync } from "esbuild";

type AnyClass = new (...args: unknown[]) => object;
type AnyFunction = (...args: unknown[]) => unknown;
type InternalFn = "__HMRIFY_INTERNAL_FN__";
type Proxied<T> = T & Record<InternalFn, AnyFunction>;
type Options = { reconstruct: boolean };

const compileFunction = (fn: AnyFunction) => {
  return transformSync(`export default ${fn.toString()}`, {
    minify: true,
  })
    .code.trim()
    .replace("export default", "")
    .replace(/;$/, "");
};

// This function can be called in these ways:
// - __hmrify_loader(() => { ... })
// - __hmrify_loader(class { ... })
// - __hmrify_loader({ options }, class { ... })
const loaderFn =
  (name: string) =>
  (
    ...args:
      | [target: AnyClass | AnyFunction]
      | [options: Partial<Options>, target: AnyClass | AnyFunction]
  ) => {
    // Parse arguments
    let options: Partial<Options> = {};
    let target: AnyClass | AnyFunction;
    if (args.length === 1) {
      options = { reconstruct: false };
      [target] = args;
    } else {
      [options, target] = args;
    }
    const resolvedOptions: Options = {
      reconstruct: true,
      ...options,
    };

    // Quit if HMR is unavailable
    if (!import.meta.hot) {
      return target;
    }

    // This function must not refer to any variables outside of its scope so I can't use dequal
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

    // Determine the kind of export
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
    // Load state
    if (import.meta.hot.data.hmrifyState?.[name]) {
      const previousType = import.meta.hot.data.hmrifyState[name].type;
      // Check if the kind of export has changed
      if (previousType !== kind) {
        import.meta.hot.invalidate(
          `[vite-plugin-hmrify] Incompatible HMR type change for ${name}, invalidating...`,
        );
        return target;
      }
      const previousResolvedOptions = import.meta.hot.data.hmrifyState[name]
        .resolvedOptions;
      // Check if the options have changed
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

    // A token to skip the hook of tracking instances
    const skipHook = "___HMRIFY_SKIP_TRACKING___";
    // A parameter to replace the function or constructor
    const internalFn = "___HMRIFY_INTERNAL_FN___" as unknown as InternalFn;

    import.meta.hot.accept(async (newModule) => {
      if (!newModule) {
        return;
      }
      const newTarget = newModule[name];
      // When new module does not have the target
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
      // Replace the function or constructor
      if (state.proxy) {
        state.proxy[internalFn] = newTarget;
      }
    });

    if (kind === "class") {
      let replacedTarget: AnyClass | undefined = undefined;
      const proxied = new Proxy(target, {
        construct(target, argArray, newTarget) {
          // Skip the hook of tracking instances (for { reconstruct: true })
          if (argArray[0] === skipHook) {
            return Reflect.construct(target, argArray.slice(1), newTarget);
          }
          const instance = Reflect.construct(
            replacedTarget ?? target,
            argArray,
            newTarget,
          );
          // Track the instance
          state.instances.push({ instance, args: argArray });
          return instance;
        },

        set(target, p, value, receiver) {
          if (p === internalFn) {
            // Replace the function or constructor
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
          // Call the replaced function if there is one
          return Reflect.apply(replacedTarget ?? target, thisArg, argArray);
        },
        set(target, p, value, receiver) {
          // Replace the function
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

export const loaderSource = compileFunction(loaderFn);

declare const __hmrify_loader: typeof loaderFn;

// This function can be called in these ways:
// - __decorateClass([__hmrify_internal_decorator("foo")])
//   -> (__hmrify_internal_decorator("foo"))(class { ... })
// - __decorateClass([__hmrify_internal_decorator("foo")({ options })])
//   -> (__hmrify_internal_decorator("foo")({ options }))(class { ... })
const decoratorLoader =
  (name: string) =>
  (optionOrTarget: AnyClass | AnyFunction | Partial<Options>) => {
    if (typeof optionOrTarget === "function") {
      // is Class or Function
      return __hmrify_loader(name)(optionOrTarget);
    }
    return (target: AnyClass | AnyFunction) =>
      __hmrify_loader(name)(optionOrTarget, target);
  };

export const decoratorLoaderSource = compileFunction(decoratorLoader);

// This function can be called in these ways:
// - __hmrify_loader(() => { ... })
// - __hmrify_loader(class { ... })
// - __hmrify_loader({ reconstruct: true }, class { ... })
//
// - __decorateClass([__hmrify_loader])
//   -> __hmrify_loader(class { ... })
// - __decorateClass([__hmrify_loader({ options })])
//   -> (__hmrify_loader({ options }))(class { ... })
const productionLoader = (
  ...args:
    | [options: Partial<Options>]
    | [target: AnyClass | AnyFunction]
    | [options: Partial<Options>, target: AnyClass | AnyFunction]
) => {
  if (args.length === 2) {
    return args[1];
  }
  if (typeof args[0] === "function") {
    return args[0];
  }

  return (target: AnyClass | AnyFunction) => target;
};

export const productionLoaderSource = compileFunction(productionLoader);
