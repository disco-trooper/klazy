#!/usr/bin/env bun

import { rmSync } from "node:fs";

// Clean lib/
rmSync("lib", { recursive: true, force: true });

// Build main entry point
await Bun.build({
  entrypoints: ["src/index.ts"],
  outdir: "lib",
  target: "node",
  packages: "external",
});

// Build postinstall separately
await Bun.build({
  entrypoints: ["src/postinstall.ts"],
  outdir: "lib",
  target: "node",
  packages: "external",
});

console.log("Build complete!");
