import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    rolldownOptions: {
      output: {
        strictExecutionOrder: true,
      },
    },
  },
});
