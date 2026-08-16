CREATE TABLE IF NOT EXISTS "vendor_entitlements" (
  "id" serial PRIMARY KEY NOT NULL,
  "userId" integer NOT NULL,
  "productId" varchar(191) NOT NULL,
  "purchaseTokenHash" varchar(64) NOT NULL,
  "orderId" varchar(191),
  "purchaseTimeMillis" varchar(32),
  "verifiedAt" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "vendor_entitlements_userId_unique" UNIQUE("userId"),
  CONSTRAINT "vendor_entitlements_purchaseTokenHash_unique" UNIQUE("purchaseTokenHash")
);
