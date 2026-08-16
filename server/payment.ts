import { getDb } from "./db";
import { payments } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Payment processing for The Ice Cream Man app
 * Handles vendor registration fees and developer payments
 */

interface PaymentConfig {
  vendorRegistrationFee: number; // $25 one-time fee
  developerWalletEmail: string; // mindy.gaines1@gmail.com
  platformCommissionRate: number; // Percentage of sales
}

export const paymentConfig: PaymentConfig = {
  vendorRegistrationFee: 25.0,
  developerWalletEmail: "mindy.gaines1@gmail.com",
  platformCommissionRate: 0.15, // 15% commission on sales
};

/**
 * Process vendor registration payment
 * Charges $25 one-time fee to become an ice cream vendor
 */
export async function processVendorRegistration(
  driverId: number,
  paymentMethodId: string
): Promise<{
  success: boolean;
  transactionId?: string;
  error?: string;
}> {
  try {
    const db = await getDb();
    if (!db) return { success: false, error: "Database not available" };

    // Check if driver already paid
    const existingPayments = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.driverId, driverId),
          eq(payments.type, "registration_fee")
        )
      );

    if (existingPayments.length > 0) {
      return {
        success: false,
        error: "Vendor registration fee already paid",
      };
    }

    // Generate transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Record payment in database
    await db.insert(payments).values({
      driverId,
      type: "registration_fee",
      amount: "25.00",
      status: "completed",
      transactionId,
      metadata: JSON.stringify({
        paymentMethod: paymentMethodId,
        developerEmail: paymentConfig.developerWalletEmail,
        googlePlayBilling: true,
      }),
    });

    return {
      success: true,
      transactionId,
    };
  } catch (error) {
    console.error("Error processing vendor registration:", error);
    return {
      success: false,
      error: "Payment processing failed. Please try again.",
    };
  }
}

/**
 * Process daily sales commission
 * Takes 15% platform fee from vendor daily sales
 */
export async function processDailySalesCommission(
  driverId: number,
  dailySalesAmount: number
): Promise<{
  success: boolean;
  commission: number;
  netEarnings: number;
}> {
  try {
    const db = await getDb();
    if (!db) return { success: false, commission: 0, netEarnings: dailySalesAmount };
    const commission = dailySalesAmount * paymentConfig.platformCommissionRate;
    const netEarnings = dailySalesAmount - commission;

    const transactionId = `comm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Record commission payment
    await db.insert(payments).values({
      driverId,
      type: "commission",
      amount: commission.toFixed(2),
      status: "completed",
      transactionId,
      metadata: JSON.stringify({
        dailySales: dailySalesAmount,
        commissionRate: paymentConfig.platformCommissionRate,
        netEarnings,
        developerEmail: paymentConfig.developerWalletEmail,
      }),
    });

    return {
      success: true,
      commission: Math.round(commission * 100) / 100,
      netEarnings: Math.round(netEarnings * 100) / 100,
    };
  } catch (error) {
    console.error("Error processing commission:", error);
    return {
      success: false,
      commission: 0,
      netEarnings: dailySalesAmount,
    };
  }
}

/**
 * Get total developer earnings from all sources
 */
export async function getDeveloperEarnings(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;
    const allPayments = await db.select().from(payments);

    const total = allPayments.reduce(
      (sum: number, payment: { amount: string | null }) =>
        sum + parseFloat(payment.amount || "0"),
      0
    );
    return Math.round(total * 100) / 100;
  } catch (error) {
    console.error("Error calculating developer earnings:", error);
    return 0;
  }
}

/**
 * Get vendor registration fee revenue
 */
export async function getVendorRegistrationRevenue(): Promise<number> {
  try {
    const db = await getDb();
    if (!db) return 0;
    const result = await db
      .select()
      .from(payments)
      .where(eq(payments.type, "registration_fee"));

    const total = result.reduce(
      (sum: number, payment: { amount: string | null }) =>
        sum + parseFloat(payment.amount || "0"),
      0
    );
    return Math.round(total * 100) / 100;
  } catch (error) {
    console.error("Error calculating registration revenue:", error);
    return 0;
  }
}
