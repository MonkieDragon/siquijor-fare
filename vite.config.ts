/// <reference types="vitest/config" />

import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";

/** GitHub Pages project sites live at /<repo>/; user/org sites use *.github.io repo with assets at /. */
function githubPagesBase(): string {
  const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
  if (!repo) return "/";
  if (repo.endsWith(".github.io")) return "/";
  return `/${repo}/`;
}

const base = githubPagesBase();

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
