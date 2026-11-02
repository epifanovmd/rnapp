import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** Корень проекта: пути в конфиге задаются относительно него. */
export const ROOT = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

export const fromRoot = (...segments) => resolve(ROOT, ...segments);
