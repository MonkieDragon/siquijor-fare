/// <reference types="vitest/config" />

import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

const repoSegment = process.env.GITHUB_REPOSITORY?.split("/")[1];
const base = repoSegment ? `/${repoSegment}/` : "/";

// https://vite.dev/config/
export default defineConfig({
  base,

  plugins: [react()],

  test: {
    environment: "node",

    include: ["src/**/*.{test,spec}.{ts,tsx}"],

    setupFiles: ["./src/test/setup.ts"],
  },
});
