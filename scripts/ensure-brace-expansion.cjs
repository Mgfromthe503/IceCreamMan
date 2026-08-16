/**
 * EAS Build pre-install / local guard.
 *
 * minimatch@9.x (used by @react-native/codegen / Gradle codegen) does:
 *   const brace_expansion_1 = __importDefault(require("brace-expansion"));
 *   brace_expansion_1.default(...)
 *
 * TypeScript __importDefault returns `mod` unchanged when mod.__esModule === true.
 *
 * brace-expansion@5.x CJS builds set __esModule and only export named `expand`
 * (no exports.default) → TypeError in:
 *   :react-native-gesture-handler:generateCodegenSchemaFromJavaScript
 *
 * brace-expansion@2.1.3 is security-patched but still needs interop shimming
 * for minimatch's default-export call path.
 *
 * See: https://github.com/expo/eas-cli/issues/3695
 *      docs/records/eas-android-codegen.md
 *
 * This script runs via package.json "eas-build-pre-install" on EAS workers
 * and can be run locally before Android builds.
 */
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const SAFE = "2.1.3";

function log(msg) {
  console.log(`[ensure-brace-expansion] ${msg}`);
}

function tryRequireExpand() {
  try {
    const be = require("brace-expansion");
    // Match minimatch / TypeScript __importDefault path
    const imported = be && be.__esModule ? be : { default: be };
    const expand =
      typeof imported.default === "function"
        ? imported.default
        : typeof be === "function"
          ? be
          : be && typeof be.expand === "function"
            ? be.expand
            : null;
    if (typeof expand !== "function") {
      return {
        ok: false,
        reason:
          "no callable default (minimatch interop path). " +
          `typeof=${typeof be}, hasExpand=${!!(be && be.expand)}, hasDefault=${!!(be && be.default)}`,
      };
    }
    const out = expand("{a,b}");
    if (!Array.isArray(out) || out.length < 2) {
      return { ok: false, reason: "expand() did not return expected array" };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, reason: String(err && err.message ? err.message : err) };
  }
}

function forceInstall() {
  log(`Forcing brace-expansion@${SAFE} ...`);
  try {
    execSync(`pnpm add brace-expansion@${SAFE} --save-exact`, {
      stdio: "inherit",
      env: process.env,
    });
  } catch {
    try {
      execSync(`npm install brace-expansion@${SAFE} --save-exact --no-save`, {
        stdio: "inherit",
        env: process.env,
      });
    } catch (e) {
      log(`WARN: could not force-install: ${e.message}`);
    }
  }
}

function main() {
  const root = process.cwd();
  const pkgPath = path.join(root, "package.json");
  if (!fs.existsSync(pkgPath)) {
    log("No package.json in cwd — skipping");
    return;
  }

  const nm = path.join(root, "node_modules", "brace-expansion");
  if (!fs.existsSync(nm)) {
    log(
      `node_modules/brace-expansion not present yet (expected on eas-build-pre-install). ` +
        `Overrides pin ${SAFE}; postinstall shim will inject .default when needed.`
    );
    return;
  }

  const check = tryRequireExpand();
  if (check.ok) {
    log("brace-expansion is CJS-safe for minimatch interop. OK.");
    return;
  }

  log(`Broken brace-expansion detected: ${check.reason}`);
  forceInstall();

  const recheck = tryRequireExpand();
  if (!recheck.ok) {
    log(
      `Still broken after force install (${recheck.reason}). ` +
        `Expected: postinstall / eas-build-post-install patch will inject exports.default as fallback.`
    );
    return;
  }
  log("Repaired brace-expansion successfully.");
}

main();
