import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { driverProcedure, router, protectedProcedure } from "./_core/trpc";
import * as db from "./db";

/**
 * Ice Cream Request API Routes
 * Handles customer requests and driver operations
 */
export const requestsRouter = router({
  /**
   * Create a new ice cream request
   * Called by: Customer
   */
  create: protectedProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
        shareMode: z.enum(["exact", "street", "meetup"]).default("street"),
        deliveryInstructions: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const requestId = await db.createRequest({
        customerId: ctx.user.id,
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.address,
        shareMode: input.shareMode,
        deliveryInstructions: input.deliveryInstructions,
        status: "waiting",
        price: "5.00",
      });

      return { id: requestId, status: "waiting" };
    }),

  /**
   * Get all waiting requests
   * Called by: Driver
   */
  getWaiting: driverProcedure.query(async () => {
    return db.getWaitingRequests();
  }),

  /**
   * Get customer's request history
   * Called by: Customer
   */
  getCustomerHistory: protectedProcedure.query(async ({ ctx }) => {
    return db.getCustomerRequests(ctx.user.id);
  }),

  /**
   * Get driver's active requests
   * Called by: Driver
   */
  getDriverActive: driverProcedure.query(async ({ ctx }) => {
    return db.getDriverRequests(ctx.driverProfile.id);
  }),

  /**
   * Accept a request
   * Called by: Driver
   */
  accept: driverProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const accepted = await db.acceptRequest(input.requestId, ctx.driverProfile.id);
      if (!accepted) {
        throw new TRPCError({ code: "CONFLICT", message: "This request is no longer available." });
      }
      return { success: true };
    }),

  /**
   * Update request status
   * Called by: Driver
   */
  updateStatus: driverProcedure
    .input(
      z.object({
        requestId: z.number().int().positive(),
        status: z.literal("in_transit"),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await db.updateAssignedRequestStatus(
        input.requestId,
        ctx.driverProfile.id,
        "accepted",
        input.status,
      );
      if (!updated) {
        throw new TRPCError({ code: "CONFLICT", message: "This request cannot enter transit." });
      }
      return { success: true };
    }),

  /**
   * Cancel a request
   * Called by: Customer or Driver
   */
  cancel: protectedProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const cancelled = await db.cancelCustomerRequest(input.requestId, ctx.user.id);
      if (!cancelled) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the requesting customer can cancel an active request." });
      }
      return { success: true };
    }),
});

/**
 * Driver Profile API Routes
 */
export const driverRouter = router({
  /**
   * Get driver profile
   * Called by: Driver
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    return db.getDriverProfile(ctx.user.id);
  }),

  /**
   * Create driver profile
   * Called by: New Driver
   */
  createProfile: protectedProcedure
    .input(
      z.object({
        vehicleType: z.string().optional(),
        licensePlate: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const entitlement = await db.getVendorEntitlementForUser(ctx.user.id);
      if (!entitlement) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Google Play registration must be verified first." });
      }
      const existingProfile = await db.getDriverProfile(ctx.user.id);
      if (existingProfile) return { id: existingProfile.id };

      const profileId = await db.createDriverProfile({
        userId: ctx.user.id,
        vehicleType: input.vehicleType || "Ice Cream Truck",
        licensePlate: input.licensePlate,
        rating: "5.00",
        totalDeliveries: 0,
        totalEarnings: "0.00",
        isOnline: 0,
      });

      return { id: profileId };
    }),

  /**
   * Update driver location (real-time tracking)
   * Called by: Driver (frequently)
   */
  updateLocation: driverProcedure
    .input(
      z.object({
        latitude: z.number(),
        longitude: z.number(),
        heading: z.number().optional(),
        speed: z.number().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await db.updateDriverLocation(
        ctx.driverProfile.id,
        input.latitude,
        input.longitude,
        input.heading,
        input.speed,
      );
      return { success: true };
    }),

  /**
   * Get driver location history
   * Called by: Driver or Admin
   */
  getLocationHistory: driverProcedure
    .input(z.object({ limit: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      return db.getDriverLocationHistory(ctx.driverProfile.id, input.limit || 100);
    }),

  /**
   * Set driver online status
   * Called by: Driver
   */
  setOnlineStatus: driverProcedure
    .input(z.object({ isOnline: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      await db.setDriverOnlineStatus(ctx.driverProfile.id, input.isOnline);
      return { success: true };
    }),

  /**
   * Complete delivery and update earnings
   * Called by: Driver
   */
  completeDelivery: driverProcedure
    .input(z.object({ requestId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const completed = await db.completeDriverDelivery(input.requestId, ctx.driverProfile.id);
      if (!completed) {
        throw new TRPCError({ code: "CONFLICT", message: "This delivery cannot be completed." });
      }
      return { success: true };
    }),
});
