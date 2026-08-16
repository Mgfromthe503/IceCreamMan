import { and, eq, inArray, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import {
  InsertUser,
  users,
  iceCreamRequests,
  driverProfiles,
  driverLocationHistory,
  vendorEntitlements,
  type InsertIceCreamRequest,
  type InsertDriverProfile,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============= AUTH FUNCTIONS (Required for OAuth) =============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }
  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }
    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }
    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }
    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============= ICE CREAM REQUEST FUNCTIONS =============

/**
 * Create a new ice cream request
 */
export async function createRequest(data: InsertIceCreamRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(iceCreamRequests).values(data);
  return (result as any).insertId || 0;
}

/**
 * Get all waiting requests (for drivers to see)
 */
export async function getWaitingRequests() {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(iceCreamRequests)
    .where(eq(iceCreamRequests.status, "waiting"));
}

/**
 * Get requests for a specific customer
 */
export async function getCustomerRequests(customerId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(iceCreamRequests)
    .where(eq(iceCreamRequests.customerId, customerId));
}

/**
 * Get active requests for a driver
 */
export async function getDriverRequests(driverId: number) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(iceCreamRequests)
    .where(
      and(
        eq(iceCreamRequests.driverId, driverId),
        eq(iceCreamRequests.status, "in_transit"),
      ),
    );
}

/**
 * Accept a request (assign to driver)
 */
export async function acceptRequest(requestId: number, driverId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const accepted = await db
    .update(iceCreamRequests)
    .set({
      driverId,
      status: "accepted",
      acceptedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(iceCreamRequests.id, requestId), eq(iceCreamRequests.status, "waiting")))
    .returning({ id: iceCreamRequests.id });
  return accepted.length === 1;
}

export async function updateAssignedRequestStatus(
  requestId: number,
  driverId: number,
  expectedStatus: "accepted" | "in_transit",
  nextStatus: "in_transit",
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updated = await db
    .update(iceCreamRequests)
    .set({ status: nextStatus, updatedAt: new Date() })
    .where(
      and(
        eq(iceCreamRequests.id, requestId),
        eq(iceCreamRequests.driverId, driverId),
        eq(iceCreamRequests.status, expectedStatus),
      ),
    )
    .returning({ id: iceCreamRequests.id });
  return updated.length === 1;
}

export async function cancelCustomerRequest(requestId: number, customerId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const cancelled = await db
    .update(iceCreamRequests)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(iceCreamRequests.id, requestId),
        eq(iceCreamRequests.customerId, customerId),
        inArray(iceCreamRequests.status, ["waiting", "accepted"]),
      ),
    )
    .returning({ id: iceCreamRequests.id });
  return cancelled.length === 1;
}

export async function completeDriverDelivery(requestId: number, driverId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db.transaction(async (tx) => {
    const completed = await tx
      .update(iceCreamRequests)
      .set({ status: "completed", completedAt: new Date(), updatedAt: new Date() })
      .where(
        and(
          eq(iceCreamRequests.id, requestId),
          eq(iceCreamRequests.driverId, driverId),
          eq(iceCreamRequests.status, "in_transit"),
        ),
      )
      .returning({ price: iceCreamRequests.price });
    if (completed.length !== 1) return false;

    const updatedProfile = await tx
      .update(driverProfiles)
      .set({
        totalEarnings: sql`${driverProfiles.totalEarnings} + ${completed[0].price}`,
        totalDeliveries: sql`${driverProfiles.totalDeliveries} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(driverProfiles.id, driverId))
      .returning({ id: driverProfiles.id });
    if (updatedProfile.length !== 1) {
      throw new Error("Driver profile not found while completing delivery");
    }
    return true;
  });
}

/**
 * Get driver profile
 */
export async function getDriverProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const profiles = await db
    .select()
    .from(driverProfiles)
    .where(eq(driverProfiles.userId, userId));

  return profiles[0] || null;
}

/**
 * Create driver profile
 */
export async function createDriverProfile(data: InsertDriverProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(driverProfiles).values(data);
  return (result as any).insertId || 0;
}

/**
 * Update driver location
 */
export async function updateDriverLocation(
  driverId: number,
  latitude: number,
  longitude: number,
  heading?: number,
  speed?: number,
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Update driver profile with latest location
  await db
    .update(driverProfiles)
    .set({
      currentLatitude: latitude,
      currentLongitude: longitude,
      lastLocationUpdate: new Date(),
    })
    .where(eq(driverProfiles.id, driverId));

  // Record location history
  await db.insert(driverLocationHistory).values({
    driverId,
    latitude,
    longitude,
    heading,
    speed: speed ? String(speed) : undefined,
  });
}

/**
 * Get driver location history
 */
export async function getDriverLocationHistory(driverId: number, limit: number = 100) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(driverLocationHistory)
    .where(eq(driverLocationHistory.driverId, driverId))
    .limit(limit);
}

/**
 * Update driver earnings
 */
export async function updateDriverEarnings(driverId: number, amount: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const profile = await getDriverProfile(driverId);
  if (!profile) throw new Error("Driver profile not found");

  const newEarnings = (parseFloat(String(profile.totalEarnings)) + amount).toFixed(2);
  const newDeliveries = (profile.totalDeliveries || 0) + 1;

  await db
    .update(driverProfiles)
    .set({
      totalEarnings: newEarnings,
      totalDeliveries: newDeliveries,
    })
    .where(eq(driverProfiles.id, driverId));
}

/**
 * Set driver online status
 */
export async function setDriverOnlineStatus(driverId: number, isOnline: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(driverProfiles)
    .set({
      isOnline: isOnline ? 1 : 0,
    })
    .where(eq(driverProfiles.id, driverId));
}

export async function getVendorEntitlementForUser(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select()
    .from(vendorEntitlements)
    .where(eq(vendorEntitlements.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function createVendorEntitlement(input: {
  userId: number;
  productId: string;
  purchaseTokenHash: string;
  orderId: string | null;
  purchaseTimeMillis: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existingForUser = await getVendorEntitlementForUser(input.userId);
  if (existingForUser) {
    return { entitlement: existingForUser, created: false };
  }

  const inserted = await db
    .insert(vendorEntitlements)
    .values(input)
    .onConflictDoNothing()
    .returning();
  if (inserted[0]) {
    return { entitlement: inserted[0], created: true };
  }

  const tokenMatches = await db
    .select()
    .from(vendorEntitlements)
    .where(eq(vendorEntitlements.purchaseTokenHash, input.purchaseTokenHash))
    .limit(1);
  const existingForToken = tokenMatches[0];
  if (existingForToken?.userId === input.userId) {
    return { entitlement: existingForToken, created: false };
  }

  throw new Error("This Google Play purchase has already been used by another account.");
}
