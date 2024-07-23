import { hmrify } from "vite-plugin-hmrify";
import { defineConfig } from "vite";
import inspect from "vite-plugin-inspect";

export default defineConfig({
  build: {
    sourcemap: false,
  },
  plugins: [hmrify(), inspect()],
});
