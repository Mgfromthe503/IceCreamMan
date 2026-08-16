import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { GOOGLE_PLAY_REGISTRATION_PRODUCT_ID, verifyGooglePlayRegistrationPurchase } from "./google-play";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import * as db from "./db";

/**
 * Payment & Monetization API Routes
 *
 * REVENUE MODEL:
 * - $25 one-time vendor registration fee via Google Play Billing
 * - Payment goes directly to the developer's Google Play Developer account
 * - Google takes 15% ($3.75), developer receives $21.25 per registration
 * - Developer cashes out via Google Play Console → Payment settings → Bank account
 *
 * GOOGLE PLAY BILLING SETUP:
 * 1. Create in-app product "icm_vendor_registration" in Google Play Console
 * 2. Set as one-time (non-consumable) product at $25.00
 * 3. The payment is handled entirely by Google Play on the client side
 * 4. Server validates the purchase token with Google Play Developer API
 *
 * Package name for Play API calls: com.icecreamman.launch
 *
 * CASHING OUT YOUR MONEY:
 * - Google Play Console → Download reports → Financial reports
 * - Or: Settings → Developer account → Payment settings
 * - Set up bank account for automatic monthly payouts
 * - Minimum payout threshold: $100 (configurable)
 * - Payout cycle: Monthly (around 15th of each month for previous month's earnings)
 */
export const paymentRouter = router({
  /**
   * Verify the one-time vendor-registration purchase with Google Play before
   * granting any entitlement. Purchase tokens remain server input only and are
   * stored as a hash solely for idempotency and replay prevention.
   */
  verifyRegistration: protectedProcedure
    .input(
      z.object({
        purchaseToken: z.string().trim().min(20).max(4096),
        productId: z.literal(GOOGLE_PLAY_REGISTRATION_PRODUCT_ID),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await db.getVendorEntitlementForUser(ctx.user.id);
      if (existing) {
        return {
          success: true,
          verificationId: `entitlement_${existing.id}`,
          alreadyVerified: true,
        };
      }

      try {
        const purchase = await verifyGooglePlayRegistrationPurchase(input.purchaseToken);
        const result = await db.createVendorEntitlement({
          userId: ctx.user.id,
          productId: input.productId,
          purchaseTokenHash: purchase.purchaseTokenHash,
          orderId: purchase.orderId,
          purchaseTimeMillis: purchase.purchaseTimeMillis,
        });

        return {
          success: true,
          verificationId: `entitlement_${result.entitlement.id}`,
          alreadyVerified: !result.created,
        };
      } catch (error) {
        console.error("[Billing] Vendor registration verification failed", {
          userId: ctx.user.id,
          reason: error instanceof Error ? error.message : "unknown verification error",
        });
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "We could not verify this Google Play purchase. No registration access was granted.",
        });
      }
    }),

  getPaymentStatus: protectedProcedure.query(async ({ ctx }) => {
    const entitlement = await db.getVendorEntitlementForUser(ctx.user.id);
    return {
      registrationPaid: entitlement !== null,
      verifiedAt: entitlement?.verifiedAt ?? null,
    };
  }),

  /**
   * Placeholder for future server-derived impact reporting. Public clients must
   * never be shown fabricated business metrics when the reporting store is absent.
   */
  getEconomicImpact: publicProcedure.query(async () => ({
    available: false,
    message: "Platform impact reporting is not available yet.",
  })),
});

/**
 * Daily Reports API Routes
 * Handles driver daily sales reports and analytics
 */
export const reportsRouter = router({
  /**
   * Submit daily sales report
   * Called by: Driver at end of day
   *
   * Now accepts gas price and hours driven for accurate hourly rate calculations
   */
  submitDailyReport: protectedProcedure
    .input(
      z.object({
        totalSales: z.number(),
        totalOrders: z.number(),
        milesDriven: z.number(),
        hoursDriven: z.number().optional(),
        gasPricePerGallon: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const gasPrice = input.gasPricePerGallon || 3.5;
      const hoursDriven = input.hoursDriven || input.milesDriven / 25; // Estimate if not provided

      const VEHICLE_MPG = 15;

      // Without app: 3x more miles to find customers randomly
      const milesWithoutApp = input.milesDriven * 3;
      const milesSaved = milesWithoutApp - input.milesDriven;
      const gallonsSaved = milesSaved / VEHICLE_MPG;
      const gasSavedDollars = gallonsSaved * gasPrice;

      // Time savings
      const hoursWithoutApp = hoursDriven * 3; // Would take 3x longer without app
      const timeSavedHours = hoursWithoutApp - hoursDriven;

      // Hourly rate comparison
      const hourlyRateWithApp = hoursDriven > 0 ? input.totalSales / hoursDriven : 0;
      const hourlyRateWithoutApp =
        hoursWithoutApp > 0 ? input.totalSales / hoursWithoutApp : 0;

      return {
        success: true,
        report: {
          date: new Date().toISOString().split("T")[0],
          totalSales: input.totalSales,
          totalOrders: input.totalOrders,
          milesDriven: input.milesDriven,
          hoursDriven,
          gasPriceUsed: gasPrice,
          gasSavedDollars: Math.round(gasSavedDollars * 100) / 100,
          timeSavedHours: Math.round(timeSavedHours * 10) / 10,
          milesSaved: Math.round(milesSaved * 10) / 10,
          hourlyRateWithApp: Math.round(hourlyRateWithApp * 100) / 100,
          hourlyRateWithoutApp: Math.round(hourlyRateWithoutApp * 100) / 100,
          hourlyRateImprovement:
            Math.round((hourlyRateWithApp - hourlyRateWithoutApp) * 100) / 100,
          economicImpact: Math.round(input.totalSales * 2.5 * 100) / 100,
        },
      };
    }),

  /**
   * Get driver's report history
   * Called by: Driver
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional(),
      }),
    )
    .query(async () => {
      // Return report history
      return {
        reports: [],
        totalSalesAllTime: 0,
        totalGasSavedAllTime: 0,
        totalTimeSavedAllTime: 0,
      };
    }),

  /**
   * Get driver's cumulative stats
   * Called by: Driver
   */
  getCumulativeStats: protectedProcedure.query(async () => {
    return {
      totalDays: 0,
      totalSales: 0,
      totalOrders: 0,
      totalMiles: 0,
      totalGasSaved: 0,
      totalTimeSaved: 0,
      averageDailySales: 0,
      averageDailyOrders: 0,
    };
  }),
});
