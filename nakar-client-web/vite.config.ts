import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@neo4j-nvl/layout-workers"],
    include: [
      "@neo4j-nvl/layout-workers > cytoscape",
      "@neo4j-nvl/layout-workers > cytoscape-cose-bilkent",
      "@neo4j-nvl/layout-workers > @neo4j-bloom/dagre",
      "@neo4j-nvl/layout-workers > bin-pack",
      "@neo4j-nvl/layout-workers > graphlib",
    ],
  },
});
