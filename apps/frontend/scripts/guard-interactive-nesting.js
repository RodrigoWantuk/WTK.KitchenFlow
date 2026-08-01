#!/usr/bin/env node
/**
 * Fail when interactive controls are nested (Link/a wrapping Button/button, or the reverse
 * without Button asChild). AST-based scan of apps/frontend/src TypeScript/JSX sources.
 */
const fs = require("fs");
const path = require("path");
const parser = require("@babel/parser");

const LINK_NAMES = new Set(["Link", "NavLink", "a"]);
const BUTTON_NAMES = new Set(["Button", "button"]);

/**
 * @param {import('@babel/types').JSXOpeningElement} opening
 * @returns {string}
 */
function jsxName(opening) {
  const n = opening?.name;
  if (!n) return "";
  if (n.type === "JSXIdentifier") return n.name;
  if (n.type === "JSXMemberExpression") {
    // e.g. React.Fragment — use property name for known components
    return jsxName({ name: n.property });
  }
  if (n.type === "JSXNamespacedName") return `${n.namespace.name}:${n.name.name}`;
  return "";
}

/**
 * @param {import('@babel/types').JSXOpeningElement} opening
 */
function hasAsChildTrue(opening) {
  return (opening.attributes || []).some((attr) => {
    if (attr.type !== "JSXAttribute") return false;
    if (attr.name?.name !== "asChild") return false;
    if (attr.value == null) return true; // asChild shorthand
    if (attr.value.type === "JSXExpressionContainer") {
      const expr = attr.value.expression;
      return expr.type === "BooleanLiteral" ? expr.value === true : false;
    }
    return false;
  });
}

/**
 * @param {string} code
 * @param {string} filePath
 * @returns {{ file: string, line: number, message: string }[]}
 */
function findInteractiveNestingViolations(code, filePath) {
  const violations = [];
  let ast;
  try {
    ast = parser.parse(code, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
      errorRecovery: false,
    });
  } catch (err) {
    violations.push({
      file: filePath,
      line: 1,
      message: `parse error: ${err.message}`,
    });
    return violations;
  }

  /**
   * @param {any} node
   * @param {{ name: string, asChild: boolean, line: number }[]} stack
   */
  function walk(node, stack) {
    if (!node || typeof node !== "object") return;

    if (node.type === "JSXElement") {
      const opening = node.openingElement;
      const name = jsxName(opening);
      const asChild = name === "Button" && hasAsChildTrue(opening);
      const line = opening.loc?.start?.line || 0;

      for (const ancestor of stack) {
        if (LINK_NAMES.has(ancestor.name) && BUTTON_NAMES.has(name)) {
          violations.push({
            file: filePath,
            line,
            message: `${ancestor.name} (line ${ancestor.line}) contains ${name} — use Button asChild wrapping Link, or sibling actions`,
          });
        }
        if (BUTTON_NAMES.has(ancestor.name) && LINK_NAMES.has(name)) {
          if (!(ancestor.name === "Button" && ancestor.asChild)) {
            violations.push({
              file: filePath,
              line,
              message: `${ancestor.name} (line ${ancestor.line}) contains ${name} without Button asChild`,
            });
          }
        }
      }

      const nextStack = [...stack, { name, asChild, line }];
      for (const child of node.children || []) {
        walk(child, nextStack);
      }
      return;
    }

    for (const key of Object.keys(node)) {
      if (key === "loc" || key === "start" || key === "end" || key === "range") {
        continue;
      }
      const value = node[key];
      if (Array.isArray(value)) {
        for (const item of value) walk(item, stack);
      } else if (value && typeof value === "object" && value.type) {
        walk(value, stack);
      }
    }
  }

  walk(ast, []);
  return violations;
}

/**
 * @param {string} rootDir
 */
function scanDirectory(rootDir) {
  /** @type {{ file: string, line: number, message: string }[]} */
  const all = [];

  function walkDir(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name === "build") continue;
        walkDir(full);
        continue;
      }
      if (!/\.(tsx|jsx)$/.test(entry.name)) continue;
      const code = fs.readFileSync(full, "utf8");
      const rel = path.relative(path.join(rootDir, ".."), full);
      all.push(...findInteractiveNestingViolations(code, rel));
    }
  }

  walkDir(rootDir);
  return all;
}

function main() {
  const srcRoot = path.join(__dirname, "..", "src");
  const violations = scanDirectory(srcRoot);
  if (violations.length > 0) {
    console.error("Interactive nesting guard failed:\n");
    for (const v of violations) {
      console.error(` - ${v.file}:${v.line}: ${v.message}`);
    }
    process.exit(1);
  }
  console.log(
    "Interactive nesting guard passed: no nested interactive controls under src/.",
  );
}

module.exports = {
  findInteractiveNestingViolations,
  scanDirectory,
  LINK_NAMES,
  BUTTON_NAMES,
};

if (require.main === module) {
  main();
}
