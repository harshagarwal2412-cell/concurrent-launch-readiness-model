/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://harshagarwal2412-cell.github.io/concurrent-launch-readiness-model/ on GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? "/concurrent-launch-readiness-model/" : "/",
  test: { environment: "node", include: ["src/**/*.test.ts"] },
});
