#!/usr/bin/env node
/**
 * Fails early if the source configuration could produce a legacy Google Play
 * Billing integration or an Android release without an R8 mapping file.
 *
 * Dependency-free on purpose: EAS runs it before the Android build.
 */
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const MIN_BILLING_VERSION = [8, 0, 0];
const errors = [];

function log(message) {
  console.log(`[verify-android-release] ${message}`);
}

function fail(message) {
  errors.push(message);
}

function readFile(relativePath) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`${relativePath} is missing.`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function parseVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version);
  return match ? match.slice(1).map(Number) : null;
}

function isAtLeast(version, minimum) {
  for (let index = 0; index < minimum.length; index += 1) {
    if (version[index] > minimum[index]) return true;
    if (version[index] < minimum[index]) return false;
  }
  return true;
}

function expectMatch(contents, pattern, message) {
  if (!pattern.test(contents)) {
    fail(message);
  }
}

function main() {
  const appConfig = readFile("app.config.ts");
  const billingPlugin = readFile("plugins/withBillingClient.js");
  const easConfig = readFile("eas.json");
  const packageJson = readFile("package.json");

  const appVersionMatch = /billingLibraryVersion:\s*["']([^"']+)["']/.exec(
    appConfig,
  );
  const pluginVersionMatch = /const BILLING_VERSION = ["']([^"']+)["']/.exec(
    billingPlugin,
  );

  if (!appVersionMatch) {
    fail("app.config.ts must declare android.billingLibraryVersion.");
  }
  if (!pluginVersionMatch) {
    fail("plugins/withBillingClient.js must declare BILLING_VERSION.");
  }

  const configuredVersions = [appVersionMatch, pluginVersionMatch]
    .filter(Boolean)
    .map((match) => match[1]);

  for (const versionText of configuredVersions) {
    const version = parseVersion(versionText);
    if (!version) {
      fail(`Billing version ${versionText} is not a complete x.y.z version.`);
    } else if (!isAtLeast(version, MIN_BILLING_VERSION)) {
      fail(
        `Billing version ${versionText} is below ${MIN_BILLING_VERSION.join(".")}; use a supported Play Billing Library version.`,
      );
    }
  }

  if (
    configuredVersions.length === 2 &&
    configuredVersions[0] !== configuredVersions[1]
  ) {
    fail(
      `Billing version mismatch: app.config.ts=${configuredVersions[0]}, plugin=${configuredVersions[1]}.`,
    );
  }

  expectMatch(
    appConfig,
    /enableProguardInReleaseBuilds:\s*true/,
    "app.config.ts must enable ProGuard/R8 for release builds.",
  );
  expectMatch(
    appConfig,
    /enableMinifyInReleaseBuilds:\s*true/,
    "app.config.ts must enable release minification so Android Gradle Plugin emits mapping.txt.",
  );
  expectMatch(
    appConfig,
    /enableShrinkResourcesInReleaseBuilds:\s*true/,
    "app.config.ts must enable release resource shrinking.",
  );
  expectMatch(
    appConfig,
    /com\.android\.vending\.BILLING/,
    "app.config.ts must retain the com.android.vending.BILLING permission.",
  );
  expectMatch(
    billingPlugin,
    /com\.android\.billingclient:billing:\$\{BILLING_VERSION\}/,
    "The Android plugin must inject the supported Billing Library dependency.",
  );
  expectMatch(
    billingPlugin,
    /com\.android\.billingclient:billing-ktx:\$\{BILLING_VERSION\}/,
    "The Android plugin must inject the matching Billing KTX dependency.",
  );
  expectMatch(
    billingPlugin,
    /com\.android\.billingclient\.\*\*/,
    "The Android plugin must retain its BillingClient R8 rules.",
  );
  expectMatch(
    packageJson,
    /"expo-iap"\s*:/,
    "package.json must include expo-iap for the app purchase flow.",
  );
  expectMatch(
    easConfig,
    /"production"\s*:\s*\{[\s\S]*?"buildType"\s*:\s*"app-bundle"/,
    "eas.json production must build an Android App Bundle.",
  );
  expectMatch(
    easConfig,
    /"production"\s*:\s*\{[\s\S]*?"autoIncrement"\s*:\s*true/,
    "eas.json production must auto-increment Android version codes.",
  );

  if (errors.length > 0) {
    console.error(`[verify-android-release] FAILED\n\n${errors.join("\n\n")}\n`);
    process.exit(1);
  }

  log(
    `OK — Play Billing ${configuredVersions[0]}, R8 mapping generation, and production AAB settings are configured.`,
  );
}

main();
