/**
 * Expo config plugin that injects Google Play Billing Library 8.1.0 and the
 * R8 rules required by expo-iap/OpenIAP into a generated Android project.
 */
const { withAppBuildGradle, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Google Play currently requires Billing Library 8+ for new app updates.
// Keep this value centralized so the generated Gradle project and preflight
// validation cannot silently diverge.
const BILLING_VERSION = "8.1.0";
const BILLING_DEPENDENCIES = [
  `    implementation "com.android.billingclient:billing:${BILLING_VERSION}"`,
  `    implementation "com.android.billingclient:billing-ktx:${BILLING_VERSION}"`,
].join("\n");

// Remove direct declarations first so prebuild remains idempotent and cannot
// leave a stale direct Billing Library version beside the required one.
const BILLING_DEPENDENCY_PATTERN =
  /^\s*implementation\s+["']com\.android\.billingclient:billing(?:-ktx)?:[^"']+["']\s*\r?\n?/gm;

/**
 * Add the supported Play Billing dependency pair to app/build.gradle.
 */
function withBillingGradle(config) {
  return withAppBuildGradle(config, (config) => {
    const withoutExistingBilling = config.modResults.contents.replace(
      BILLING_DEPENDENCY_PATTERN,
      ""
    );
    const dependenciesRegex = /dependencies\s*\{/;

    if (!dependenciesRegex.test(withoutExistingBilling)) {
      throw new Error(
        "Unable to inject Google Play Billing: app/build.gradle has no dependencies block."
      );
    }

    config.modResults.contents = withoutExistingBilling.replace(
      dependenciesRegex,
      `dependencies {\n${BILLING_DEPENDENCIES}`
    );

    return config;
  });
}

/**
 * Add R8 rules needed by Google Play Billing and expo-iap/OpenIAP.
 */
function withBillingProguard(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const proguardPath = path.join(
        config.modRequest.platformProjectRoot,
        "app",
        "proguard-rules.pro"
      );

      const proguardRules = `
# Google Play Billing Library - Keep BillingClient classes
-keep class com.android.billingclient.** { *; }
-keep interface com.android.billingclient.** { *; }
-dontwarn com.android.billingclient.**

# expo-iap
-keep class com.dooboolab.rniap.** { *; }
-keep class expo.modules.iap.** { *; }
-dontwarn com.dooboolab.rniap.**
-dontwarn expo.modules.iap.**

# Keep Google Play Core
-keep class com.google.android.play.** { *; }
-dontwarn com.google.android.play.**
`;

      let existingContent = "";
      if (fs.existsSync(proguardPath)) {
        existingContent = fs.readFileSync(proguardPath, "utf-8");
      }

      if (!existingContent.includes("com.android.billingclient")) {
        fs.writeFileSync(proguardPath, existingContent + proguardRules);
      }

      return config;
    },
  ]);
}

/**
 * Keep generated legacy Gradle templates aligned with release minification.
 * expo-build-properties supplies the corresponding Gradle properties.
 */
function withR8Enabled(config) {
  return withAppBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    if (contents.includes("minifyEnabled")) {
      config.modResults.contents = contents
        .replace(/minifyEnabled\s+false/g, "minifyEnabled true")
        .replace(/shrinkResources\s+false/g, "shrinkResources true");
    }

    return config;
  });
}

function withBillingClient(config) {
  config = withBillingGradle(config);
  config = withBillingProguard(config);
  config = withR8Enabled(config);
  return config;
}

module.exports = withBillingClient;
module.exports.BILLING_VERSION = BILLING_VERSION;
