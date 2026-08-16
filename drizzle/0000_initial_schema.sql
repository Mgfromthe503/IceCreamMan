DO $$ BEGIN
  CREATE TYPE "role" AS ENUM('user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "share_mode" AS ENUM('exact', 'street', 'meetup');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "request_status" AS ENUM('waiting', 'accepted', 'in_transit', 'completed', 'cancelled');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "ice_cream_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"customerId" integer NOT NULL,
	"driverId" integer,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"address" text,
	"shareMode" "share_mode" DEFAULT 'street' NOT NULL,
	"deliveryInstructions" text,
	"status" "request_status" DEFAULT 'waiting' NOT NULL,
	"price" numeric(5, 2) DEFAULT '5.00' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"acceptedAt" timestamp,
	"completedAt" timestamp,
	"cancelledAt" timestamp,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "driver_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"vehicleType" varchar(100) DEFAULT 'Ice Cream Truck',
	"licensePlate" varchar(20),
	"rating" numeric(3, 2) DEFAULT '5.00',
	"totalDeliveries" integer DEFAULT 0,
	"totalEarnings" numeric(10, 2) DEFAULT '0.00',
	"isOnline" integer DEFAULT 0,
	"currentLatitude" double precision,
	"currentLongitude" double precision,
	"lastLocationUpdate" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "driver_profiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "driver_location_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"driverId" integer NOT NULL,
	"latitude" double precision NOT NULL,
	"longitude" double precision NOT NULL,
	"heading" integer,
	"speed" numeric(5, 2),
	"accuracy" numeric(5, 2),
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"driverId" integer NOT NULL,
	"type" varchar(50) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"transactionId" varchar(191),
	"status" varchar(50) DEFAULT 'pending',
	"metadata" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "daily_sales" (
	"id" serial PRIMARY KEY NOT NULL,
	"driverId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"totalSales" numeric(10, 2) DEFAULT '0',
	"totalOrders" integer DEFAULT 0,
	"totalMiles" numeric(8, 2) DEFAULT '0',
	"gasSavedDollars" numeric(8, 2) DEFAULT '0',
	"timeSavedHours" numeric(8, 2) DEFAULT '0',
	"createdAt" timestamp DEFAULT now() NOT NULL
);
