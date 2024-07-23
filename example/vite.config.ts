import { hmrify } from "vite-plugin-hmrify";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: false,
  },
  plugins: [hmrify()],
});
