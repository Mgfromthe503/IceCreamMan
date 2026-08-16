import { afterEach, describe, expect, it } from "vitest";
import {
  GOOGLE_PLAY_REGISTRATION_PRODUCT_ID,
  hashPurchaseToken,
  verifyGooglePlayRegistrationPurchase,
} from "../server/google-play";

const originalCredentials = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;

afterEach(() => {
  if (originalCredentials === undefined) {
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  } else {
    process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON = originalCredentials;
  }
});

describe("Google Play registration verification", () => {
  it("uses the fixed one-time product identifier", () => {
    expect(GOOGLE_PLAY_REGISTRATION_PRODUCT_ID).toBe("icm_vendor_registration");
  });

  it("derives a stable one-way hash for replay protection", () => {
    const token = "opaque-google-play-purchase-token";
    expect(hashPurchaseToken(token)).toHaveLength(64);
    expect(hashPurchaseToken(token)).toBe(hashPurchaseToken(token));
    expect(hashPurchaseToken(token)).not.toBe(token);
  });

  it("fails closed when Google Play service-account credentials are not configured", async () => {
    delete process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
    await expect(verifyGooglePlayRegistrationPurchase("opaque-test-token")).rejects.toThrow(
      "Google Play purchase verification is not configured.",
    );
  });
});
