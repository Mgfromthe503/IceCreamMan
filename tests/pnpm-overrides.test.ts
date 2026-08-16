import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const read = (relPath: string) => readFileSync(join(ROOT, relPath), "utf8");

const pkg = JSON.parse(read("package.json")) as {
  packageManager: string;
  pnpm?: { overrides?: Record<string, string> };
};

describe("pnpm override configuration", () => {
  it("declares overrides in package.json, where pnpm 9 reads them", () => {
    expect(Object.keys(pkg.pnpm?.overrides ?? {}).length).toBeGreaterThan(0);
  });

  it("keeps overrides out of pnpm-workspace.yaml until pnpm 10", () => {
    // pnpm < 10 ignores `overrides` in pnpm-workspace.yaml, dropping every pin.
    const major = Number(/^pnpm@(\d+)\./.exec(pkg.packageManager)?.[1]);
    if (major >= 10) return;
    expect(read("pnpm-workspace.yaml")).not.toMatch(/^overrides:/m);
  });

  it("pins brace-expansion to the latest patched 2.x release", () => {
    expect(pkg.pnpm?.overrides?.["brace-expansion"]).toBe("2.1.4");
  });

  it("keeps pnpm-lock.yaml in sync with the overrides (ERR_PNPM_LOCKFILE_CONFIG_MISMATCH)", () => {
    expect(() =>
      execFileSync("node", ["scripts/verify-pnpm-overrides.cjs"], {
        cwd: ROOT,
      }),
    ).not.toThrow();
  });
});
