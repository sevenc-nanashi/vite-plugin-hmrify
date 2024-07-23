# vite-plugin-hmrify / Add HMR to your class or function

[![npm](https://img.shields.io/npm/v/vite-plugin-hmrify)](https://www.npmjs.com/package/vite-plugin-hmrify)

> [!WARNING]
> This plugin does very hacky things to your code. It is not recommended to use this in production.

vite-plugin-hmrify is a Vite plugin that adds Hot Module Replacement (HMR) to your exported class or function.
It does this by wrapping your class or function in a proxy that listens for changes and updates the class or function.

## Installation

```bash
# Note: This plugin is not released yet.
npm install vite-plugin-hmrify --save-dev
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

```diff
 /// <reference types="vite/client" />
+/// <reference types="vite-plugin-hmrify/client" />
```

Then, wrap your exported class or function with `import.meta.hmrify`:

```typescript
export const MyClass = import.meta.hmrify(
  class MyClass {
    constructor() {
      console.log("Hello, world!");
    }
  },
);

export const myFunction = import.meta.hmrify(
  function myFunction() {
    console.log("Hello, world!");
  },
);
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
```

## License

This plugin is licensed under the MIT License.
