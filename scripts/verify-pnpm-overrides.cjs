/**
 * Guards the two failure modes that have taken down EAS Android builds:
 *
 * 1. ERR_PNPM_LOCKFILE_CONFIG_MISMATCH — `pnpm install --frozen-lockfile` aborts
 *    when the `overrides` recorded in pnpm-lock.yaml differ from the resolver
 *    config. Editing package.json overrides without regenerating the lockfile
 *    is the usual cause; it only surfaces on the EAS worker.
 *
 * 2. Overrides declared in pnpm-workspace.yaml. pnpm only reads `overrides`
 *    from pnpm-workspace.yaml starting with v10. This repository builds on
 *    pnpm 9.12.0 (package.json packageManager + eas.json build.base.pnpm),
 *    where that key is ignored. Keep security overrides in package.json
 *    `pnpm.overrides` until the package-manager contract changes.
 *
 * Dependency-free on purpose: this runs before/independently of node_modules.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BRACE_EXPANSION_PIN = "2.1.4";

const errors = [];

function fail(msg) {
  errors.push(msg);
}

function log(msg) {
  console.log(`[verify-pnpm-overrides] ${msg}`);
}

function readFile(relPath) {
  const abs = path.join(ROOT, relPath);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
}

function unquote(value) {
  const trimmed = value.trim();
  const quoted =
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'));
  return quoted ? trimmed.slice(1, -1) : trimmed;
}

/**
 * Reads a top-level `overrides:` block out of a YAML document.
 * The block is a flat map of string keys to string values in both
 * pnpm-lock.yaml and pnpm-workspace.yaml, so a line scanner is enough
 * and avoids depending on a YAML parser.
 *
 * @returns {Record<string, string> | null} null when the key is absent
 */
function parseOverridesBlock(yaml) {
  const lines = yaml.split("\n");
  const start = lines.findIndex((line) => /^overrides:\s*$/.test(line));
  if (start === -1) return null;

  const overrides = {};
  for (const line of lines.slice(start + 1)) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) break;
    const separator = line.lastIndexOf(": ");
    if (separator === -1) continue;
    overrides[unquote(line.slice(0, separator))] = unquote(line.slice(separator + 2));
  }
  return overrides;
}

function pnpmMajor(packageManager) {
  const match = /^pnpm@(\d+)\./.exec(packageManager || "");
  return match ? Number(match[1]) : null;
}

function diffOverrides(expected, actual) {
  const keys = [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort();
  return keys
    .filter((key) => expected[key] !== actual[key])
    .map((key) => `  ${key}: package.json=${expected[key] ?? "(absent)"} lockfile=${actual[key] ?? "(absent)"}`);
}

function checkWorkspaceOverrides(major) {
  const workspace = readFile("pnpm-workspace.yaml");
  if (!workspace) return;

  const workspaceOverrides = parseOverridesBlock(workspace);
  if (workspaceOverrides && major !== null && major < 10) {
    fail(
      `pnpm-workspace.yaml declares "overrides", which pnpm ${major}.x ignores ` +
        `(pnpm 10+ only). Keep overrides in package.json "pnpm.overrides" until ` +
        `packageManager and eas.json move to pnpm 10.`,
    );
  }
}

function checkLockfileInSync(expected) {
  const lockfile = readFile("pnpm-lock.yaml");
  if (!lockfile) {
    fail("pnpm-lock.yaml is missing.");
    return;
  }

  const lockOverrides = parseOverridesBlock(lockfile) ?? {};
  const differences = diffOverrides(expected, lockOverrides);
  if (differences.length > 0) {
    fail(
      "pnpm-lock.yaml overrides are out of sync with package.json — EAS will abort " +
        "with ERR_PNPM_LOCKFILE_CONFIG_MISMATCH. Run `pnpm install` and commit the lockfile.\n" +
        differences.join("\n"),
    );
  }
}

function checkBraceExpansionPin(expected) {
  if (expected["brace-expansion"] !== BRACE_EXPANSION_PIN) {
    fail(
      `package.json pnpm.overrides pins brace-expansion to ` +
        `${expected["brace-expansion"] ?? "(absent)"}; must be ${BRACE_EXPANSION_PIN} ` +
        `(security-patched; preload + postinstall patch handle Gradle CJS interop). See docs/records/eas-android-codegen.md.`,
    );
  }

  const installed = path.join(ROOT, "node_modules", "brace-expansion", "package.json");
  if (!fs.existsSync(installed)) {
    log("node_modules/brace-expansion absent — skipping resolved-version check.");
    return;
  }

  const version = JSON.parse(fs.readFileSync(installed, "utf8")).version;
  if (version !== BRACE_EXPANSION_PIN) {
    fail(`Resolved brace-expansion is ${version}, expected ${BRACE_EXPANSION_PIN}.`);
  }
}

function main() {
  const pkg = JSON.parse(readFile("package.json"));
  const expected = (pkg.pnpm && pkg.pnpm.overrides) || {};
  const major = pnpmMajor(pkg.packageManager);

  if (Object.keys(expected).length === 0) {
    fail('package.json has no "pnpm.overrides" — the security overrides are not applied.');
  }

  checkWorkspaceOverrides(major);
  checkLockfileInSync(expected);
  checkBraceExpansionPin(expected);

  if (errors.length > 0) {
    console.error(`[verify-pnpm-overrides] FAILED\n\n${errors.join("\n\n")}\n`);
    process.exit(1);
  }

  log(`OK — ${Object.keys(expected).length} overrides in sync with pnpm-lock.yaml.`);
}

main();
