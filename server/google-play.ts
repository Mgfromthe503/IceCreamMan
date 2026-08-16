import { createHash } from "node:crypto";
import { google } from "googleapis";
import { APP_BUNDLE_ID } from "../config/app-identity.js";

export const GOOGLE_PLAY_REGISTRATION_PRODUCT_ID = "icm_vendor_registration";
const ANDROID_PUBLISHER_SCOPE = "https://www.googleapis.com/auth/androidpublisher";

type ServiceAccountCredentials = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
};

export type VerifiedGooglePlayPurchase = {
  orderId: string | null;
  purchaseTimeMillis: string | null;
  purchaseTokenHash: string;
};

function loadServiceAccountCredentials(): ServiceAccountCredentials {
  const serializedCredentials = process.env.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON;
  if (!serializedCredentials) {
    throw new Error("Google Play purchase verification is not configured.");
  }

  try {
    const credentials = JSON.parse(serializedCredentials) as ServiceAccountCredentials;
    if (!credentials.client_email || !credentials.private_key) {
      throw new Error("missing required service-account fields");
    }
    return credentials;
  } catch (error) {
    throw new Error("Google Play purchase verification credentials are invalid.", { cause: error });
  }
}

function getAndroidPublisherClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: loadServiceAccountCredentials(),
    scopes: [ANDROID_PUBLISHER_SCOPE],
  });

  return google.androidpublisher({ version: "v3", auth });
}

export function hashPurchaseToken(purchaseToken: string): string {
  return createHash("sha256").update(purchaseToken).digest("hex");
}

/**
 * Verifies the one-time vendor-registration entitlement against Google Play.
 * The caller must persist the token hash transactionally to make verification idempotent.
 */
export async function verifyGooglePlayRegistrationPurchase(
  purchaseToken: string,
): Promise<VerifiedGooglePlayPurchase> {
  const publisher = getAndroidPublisherClient();
  const response = await publisher.purchases.products.get({
    packageName: APP_BUNDLE_ID,
    productId: GOOGLE_PLAY_REGISTRATION_PRODUCT_ID,
    token: purchaseToken,
  });
  const purchase = response.data;

  if (
    purchase.purchaseState !== 0 ||
    (purchase.productId && purchase.productId !== GOOGLE_PLAY_REGISTRATION_PRODUCT_ID) ||
    purchase.consumptionState === 1 ||
    purchase.refundableQuantity === 0
  ) {
    throw new Error("Google Play did not confirm an active vendor-registration purchase.");
  }

  if (purchase.acknowledgementState === 0) {
    await publisher.purchases.products.acknowledge({
      packageName: APP_BUNDLE_ID,
      productId: GOOGLE_PLAY_REGISTRATION_PRODUCT_ID,
      token: purchaseToken,
      requestBody: {},
    });
  }

  return {
    orderId: purchase.orderId ?? null,
    purchaseTimeMillis: purchase.purchaseTimeMillis ?? null,
    purchaseTokenHash: hashPurchaseToken(purchaseToken),
  };
}
