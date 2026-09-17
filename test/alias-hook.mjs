/**
 * Teaches Node's own module loader the two things the TypeScript compiler does
 * for the app but the runtime does not: the `@/*` path alias from tsconfig,
 * and extensionless imports.
 *
 * This is what lets the test runner import the real application modules —
 * unchanged, no build step, no bundler — so the tests exercise the code that
 * actually ships rather than a copy of it.
 */
import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = resolvePath(root, "src");

/** `@/lib/cn` -> `<root>/src/lib/cn`, then the extension search below. */
function fromAlias(specifier) {
  return specifier.startsWith("@/") ? resolvePath(SRC, specifier.slice(2)) : null;
}

/** Extensionless and directory imports, the way TypeScript resolves them. */
function withExtension(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    resolvePath(basePath, "index.ts"),
    resolvePath(basePath, "index.tsx"),
  ];
  return candidates.find((candidate) => existsSync(candidate) && !candidate.endsWith("/"));
}

function resolve(specifier, context, nextResolve) {
  const aliased = fromAlias(specifier);
  if (aliased) {
    const found = withExtension(aliased);
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
  }

  if (specifier.startsWith(".") && context.parentURL?.startsWith("file:")) {
    const absolute = resolvePath(dirname(fileURLToPath(context.parentURL)), specifier);
    const found = withExtension(absolute);
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
  }

  return nextResolve(specifier, context);
}

registerHooks({ resolve });
