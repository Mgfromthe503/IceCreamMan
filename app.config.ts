// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";
import {
  APP_BUNDLE_ID,
  APP_NAME,
  APP_SCHEME,
  APP_SLUG,
  EXPO_OWNER,
} from "./config/app-identity.js";

const config: ExpoConfig = {
  name: APP_NAME,
  slug: APP_SLUG,
  owner: EXPO_OWNER,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: APP_SCHEME,
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: APP_BUNDLE_ID,
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: APP_BUNDLE_ID,
    permissions: [
      "POST_NOTIFICATIONS",
      "com.android.vending.BILLING",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
    ],
    // Queries block for Android 11+ (API 30+) package visibility
    // Required for Linking.openURL() to work with external maps apps
    // Expo's Android config type has not caught up to this manifest field.
    // @ts-expect-error queries is emitted correctly by config plugins/prebuild.
    queries: {
      schemes: ["google.navigation", "geo", "comgooglemaps"],
      packages: ["com.google.android.apps.maps"],
    },
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [
          {
            scheme: APP_SCHEME,
            host: "*",
          },
        ],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/images/icon.png",
        color: "#E6F4FE",
        defaultChannel: "default",
      },
    ],
    // Google Play Billing (vendor registration). Requires a dev client / EAS
    // build — not available in Expo Go.
    "expo-iap",
    // Custom plugin: injects BillingClient 8.1.0 dependency + ProGuard rules
    "./plugins/withBillingClient",
    [
      "expo-location",
      {
        isAndroidBackgroundLocationEnabled: false,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
    [
      "expo-audio",
      {
        // The app uses playback only. Do not request microphone access or ship RECORD_AUDIO.
        microphonePermission: false,
        recordAudioAndroid: false,
        enableBackgroundRecording: false,
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
        dark: {
          backgroundColor: "#000000",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          // Google Play Billing Library 8.1.0 (via expo-iap) needs Kotlin 2.x.
          kotlinVersion: "2.1.20",
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
          minSdkVersion: 24,
          // Enable R8 minification and resource shrinking for Google Play compliance
          enableProguardInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
          // Enable minification (R8) for release builds
          enableMinifyInReleaseBuilds: true,
          // Google Play Billing Library version 8.1.0
          billingLibraryVersion: "8.1.0",
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
