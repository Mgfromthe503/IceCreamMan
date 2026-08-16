import fs from "node:fs";
import path from "node:path";

const checks = [];
const pass = (name, detail) => checks.push([name, true, detail]);
const fail = (name, detail) => checks.push([name, false, detail]);
const read = (p) => fs.readFileSync(p, "utf8");

// 1. Canonical identity exists.
const identityPath = path.resolve("config/app-identity.js");
if (fs.existsSync(identityPath)) pass("01 canonical identity", "config/app-identity.js exists");
else fail("01 canonical identity", "missing config/app-identity.js");

// 2. New package ID is explicit and singular.
const identity = fs.existsSync(identityPath) ? read(identityPath) : "";
const packageMatches = [...identity.matchAll(/APP_BUNDLE_ID\s*=\s*[\"']([^\"']+)/g)].map((m) => m[1]);
if (packageMatches.length === 1 && packageMatches[0] === "com.icecreamman.launch") pass("02 Android package", packageMatches[0]);
else fail("02 Android package", `expected exactly one com.icecreamman.launch, found ${packageMatches.join(", ") || "none"}`);

// 3. Expo config consumes the canonical identity.
const appConfig = read("app.config.ts");
if (appConfig.includes("APP_BUNDLE_ID") && appConfig.includes("package: APP_BUNDLE_ID")) pass("03 Expo Android config", "app.config.ts derives android.package from canonical identity");
else fail("03 Expo Android config", "android.package is not derived from canonical identity");

// 4. EAS has exactly one production Android AAB profile.
const eas = JSON.parse(read("eas.json"));
const production = eas?.build?.production;
if (production?.android?.buildType === "app-bundle") pass("04 EAS production AAB", "production.android.buildType=app-bundle");
else fail("04 EAS production AAB", "production Android profile is not an AAB");

// 5. Version is valid.
const pkg = JSON.parse(read("package.json"));
if (/^\d+\.\d+\.\d+$/.test(pkg.version)) pass("05 app version", pkg.version);
else fail("05 app version", `invalid package version: ${pkg.version}`);

// 6. Lockfile exists for reproducibility.
if (fs.existsSync("pnpm-lock.yaml")) pass("06 deterministic dependencies", "pnpm-lock.yaml exists");
else fail("06 deterministic dependencies", "pnpm-lock.yaml missing");

// 7. No legacy package/project/signing identities in release-critical files.
const forbidden = [
  "com.icecreamman.app",
  "5bf9c92f-2974-422e-b6cb-958d6f7ae469",
  "BE:D6:3F:D3:DA:34:F1:EF:18:19:68:F9:B0:E0:35:E3:23:1B:E5:7C",
  "89:61:BC:40:53:C1:21:FF:A4:1F:58:46:98:A5:C5:11:4B:9B:2E:BF",
];
const criticalFiles = ["app.config.ts", "config/app-identity.js", "eas.json", "package.json"];
const legacyHits = criticalFiles.flatMap((f) => forbidden.filter((x) => read(f).includes(x)).map((x) => `${f}: ${x}`));
if (!legacyHits.length) pass("07 legacy identity isolation", "no old package/project/certificate fingerprints in release config");
else fail("07 legacy identity isolation", legacyHits.join(" | "));

// 8. No signing material is tracked.
const trackedSigning = [];
for (const root of ["."]) {
  const walk = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if ([".git", "node_modules"].includes(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (/\.(jks|keystore|p12|pfx)$/i.test(entry.name)) trackedSigning.push(full);
    }
  };
  walk(root);
}
if (!trackedSigning.length) pass("08 signing hygiene", "no JKS/keystore/P12/PFX files in repository");
else fail("08 signing hygiene", trackedSigning.join(", "));

// 9. Expo owner/slug are defined.
const owner = identity.match(/EXPO_OWNER\s*=\s*[\"']([^\"']+)/)?.[1];
const slug = identity.match(/APP_SLUG\s*=\s*[\"']([^\"']+)/)?.[1];
if (owner && slug) pass("09 Expo identity", `owner=${owner}, slug=${slug}`);
else fail("09 Expo identity", "Expo owner or slug missing");

// 10. Required release workflow exists.
if (fs.existsSync(".github/workflows/clean-android-build.yml")) pass("10 release automation", "clean Android EAS workflow exists");
else fail("10 release automation", "release workflow missing");

for (const [name, ok, detail] of checks) console.log(`${ok ? "PASS" : "FAIL"} ${name}: ${detail}`);
const failures = checks.filter(([, ok]) => !ok);
console.log(`\n${checks.length}/10 checks completed; ${failures.length} failure(s).`);
if (failures.length) process.exit(1);
