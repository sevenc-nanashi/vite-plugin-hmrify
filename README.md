# vite-plugin-hmrify / Add HMR to your class or function

[![npm](https://img.shields.io/npm/v/vite-plugin-hmrify)](https://www.npmjs.com/package/vite-plugin-hmrify)

> [!WARNING]
> This plugin does very hacky things to your code. It is not recommended to use this in production.

vite-plugin-hmrify is a Vite plugin that adds Hot Module Replacement (HMR) to your exported class or function.
It does this by wrapping your class or function in a proxy that listens for changes and updates the class or function.

## Installation

```bash
npm install -D vite-plugin-hmrify
```

Or you can install the development release. (powered by [pkg.pr.new](https://github.com/stackblitz-labs/pkg.pr.new))

```bash
npm install -D https://pkg.pr.new/sevenc-nanashi/vite-plugin-hmrify@[the latest commit hash here]
```

## Usage

Add the plugin to your `vite.config.ts`:

```typescript
import { hmrify } from "vite-plugin-hmrify";

export default {
  plugins: [hmrify()],
};
```

Then, add reference of `vite-plugin-hmrify/client` in your `vite-env.d.ts`:

```typescript
 /// <reference types="vite/client" />
+/// <reference types="vite-plugin-hmrify/client" />
```

Then, wrap your exported function or decorate your exported class with `import.meta.hmrify`:

> [!NOTE]
> You need `experimentalDecorators: true` to use the decorator syntax.

```typescript
export const myFunction = import.meta.hmrify(
  function myFunction() {
    console.log("Hello, world!");
  },
);

export const MyClass = import.meta.hmrify(
  class MyClass {
    constructor() {
      console.log("Hello, world!");
    }
  },
);

@(import.meta.hmrify)
export class AnotherMyClass {
  constructor() {
    console.log("Hello, world!");
  }
}
```

You can also add options to `import.meta.hmrify`:

```typescript
export const MyClass = import.meta.hmrify(
  {
    reconstruct: true,
  },
  class MyClass {
    constructor() {
      console.log("Hello, world!");
    }
  },
);

@(import.meta.hmrify({ reconstruct: true }))
export class AnotherMyClass {
  constructor() {
    console.log("Hello, world!");
  }
}
```

## License

This plugin is licensed under the MIT License.
