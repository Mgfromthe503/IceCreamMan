import { Platform } from "react-native";
import { isRateLimited } from "./security";

export const VENDOR_REGISTRATION_PRODUCT_ID = "icm_vendor_registration";
export const REGISTRATION_PRICE = 25;

export interface PurchaseResult {
  success: boolean;
  transactionId: string | null;
  purchaseToken: string | null;
  error?: string;
}

/** Native Google Play Billing connection. Vendor registration is unavailable on web. */
export async function initializeBilling(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const ExpoIap = require("expo-iap");
    await ExpoIap.initConnection();
    return true;
  } catch (error) {
    console.error("[Billing] Connection failed", error);
    return false;
  }
}

export async function getRegistrationProduct() {
  if (Platform.OS === "web") return null;

  try {
    const ExpoIap = require("expo-iap");
    const products = await ExpoIap.getProducts({ skus: [VENDOR_REGISTRATION_PRODUCT_ID] });
    return products?.[0] ?? null;
  } catch (error) {
    console.error("[Billing] Failed to load the registration product", error);
    return null;
  }
}

/**
 * Starts Google Play Billing and returns the opaque purchase token. The caller
 * must send it to the backend and wait for server verification before granting
 * registration access or persisting any entitlement state.
 */
export async function purchaseRegistration(): Promise<PurchaseResult> {
  if (Platform.OS === "web") {
    return {
      success: false,
      transactionId: null,
      purchaseToken: null,
      error: "Vendor registration is only available in the Android app.",
    };
  }
  if (isRateLimited("purchase_registration", 3, 60_000)) {
    return { success: false, transactionId: null, purchaseToken: null, error: "Too many attempts." };
  }

  try {
    const ExpoIap = require("expo-iap");
    const purchase = await ExpoIap.requestPurchase({
      request: { sku: VENDOR_REGISTRATION_PRODUCT_ID },
    });
    const purchaseToken = typeof purchase?.purchaseToken === "string" ? purchase.purchaseToken : null;
    if (!purchase || !purchaseToken) {
      return { success: false, transactionId: null, purchaseToken: null, error: "Purchase was not completed." };
    }

    return {
      success: true,
      transactionId: purchase.transactionId ?? purchase.orderId ?? null,
      purchaseToken,
    };
  } catch (error: unknown) {
    const code = typeof error === "object" && error !== null && "code" in error ? (error as { code?: string }).code : undefined;
    if (code === "E_USER_CANCELLED") {
      return { success: false, transactionId: null, purchaseToken: null, error: "Cancelled" };
    }
    return {
      success: false,
      transactionId: null,
      purchaseToken: null,
      error: error instanceof Error ? error.message : "The purchase could not be started.",
    };
  }
}

/** Return a restorable Play purchase token; server verification is still required. */
export async function getExistingRegistrationPurchase(): Promise<PurchaseResult> {
  if (Platform.OS === "web") {
    return { success: false, transactionId: null, purchaseToken: null, error: "Not available on web." };
  }

  try {
    const ExpoIap = require("expo-iap");
    const purchases = await ExpoIap.getAvailablePurchases();
    const purchase = purchases.find((item: { productId?: string }) => item.productId === VENDOR_REGISTRATION_PRODUCT_ID);
    const purchaseToken = typeof purchase?.purchaseToken === "string" ? purchase.purchaseToken : null;
    return purchaseToken
      ? {
          success: true,
          transactionId: purchase.transactionId ?? purchase.orderId ?? null,
          purchaseToken,
        }
      : { success: false, transactionId: null, purchaseToken: null, error: "No prior purchase was found." };
  } catch (error) {
    console.error("[Billing] Failed to restore a purchase", error);
    return { success: false, transactionId: null, purchaseToken: null, error: "Unable to restore the purchase." };
  }
}

export async function finishVerifiedRegistrationPurchase(purchaseToken: string): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const ExpoIap = require("expo-iap");
    await ExpoIap.finishTransaction({
      purchase: { productId: VENDOR_REGISTRATION_PRODUCT_ID, purchaseToken },
      isConsumable: false,
    });
  } catch (error) {
    // The backend acknowledgement is authoritative. Client finalization can be retried during restore.
    console.warn("[Billing] Client transaction finalization will be retried", error);
  }
}

export async function endBillingConnection(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const ExpoIap = require("expo-iap");
    await ExpoIap.endConnection();
  } catch (error) {
    console.warn("[Billing] Failed to close the billing connection", error);
  }
}
