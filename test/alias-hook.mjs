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
import { existsSync, statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve as resolvePath } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const SRC = resolvePath(root, "src");

/** `@/lib/cn` -> `<root>/src/lib/cn`, then the extension search below. */
function fromAlias(specifier) {
  return specifier.startsWith("@/") ? resolvePath(SRC, specifier.slice(2)) : null;
}

/**
 * Extensionless and directory imports, the way TypeScript resolves them.
 *
 * The check is `isFile`, not `exists`. `@/lib/store` names a directory that
 * also exists as a path, so an existence check matched the directory itself
 * and Node then tried to read it as a module — an EISDIR crash that looked
 * like a broken test rather than a resolver that stopped one candidate short.
 */
function withExtension(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.js`,
    resolvePath(basePath, "index.ts"),
    resolvePath(basePath, "index.tsx"),
  ];
  return candidates.find((candidate) => {
    if (!existsSync(candidate)) return false;
    try {
      return statSync(candidate).isFile();
    } catch {
      return false;
    }
  });
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
