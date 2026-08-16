import "dotenv/config";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { applySecurityMiddleware } from "../security";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Helmet sets secure HTTP response headers (OWASP / Express security best practices)
  app.use(helmet());

  // --- SECURE CORS CONFIGURATION ---
  // Allowlist Expo / local dev origins; support credentialed requests.
  // Mobile clients that omit Origin are allowed via wildcard (no credentials).
  const ALLOWED_ORIGINS = [
    "http://localhost:8081",
    "http://localhost:19000",
    "http://localhost:19006",
    "https://exp.host",
    "https://u.expo.dev",
  ];

  app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    } else if (!origin) {
      // Native / mobile requests often send no Origin header
      res.header("Access-Control-Allow-Origin", "*");
    }

    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });

  // Apply security middleware (headers, rate limiting, sanitization, fraud detection)
  applySecurityMiddleware(app);

  registerOAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, timestamp: Date.now() });
  });

  // Privacy Policy — publicly accessible URL for Google Play Console
  app.get("/privacy-policy", (_req, res) => {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Privacy Policy - The Ice Cream Man</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 24px; line-height: 1.6; color: #333; }
h1 { color: #d63384; border-bottom: 2px solid #f8a4c8; padding-bottom: 12px; }
h2 { color: #6f42c1; margin-top: 32px; }
h3 { color: #495057; }
table { width: 100%; border-collapse: collapse; margin: 16px 0; }
th, td { border: 1px solid #dee2e6; padding: 8px 12px; text-align: left; }
th { background: #f8f9fa; font-weight: 600; }
.highlight { background: #fff3cd; padding: 12px; border-radius: 8px; margin: 16px 0; }
.footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; }
</style>
</head>
<body>
<h1>\u{1F366} Privacy Policy</h1>
<p><strong>The Ice Cream Man</strong><br>Effective Date: June 29, 2026<br>Last Updated: June 29, 2026<br>Developer: Mindy Gaines<br>Contact: icecreammanapp@gmail.com</p>

<h2>1. Introduction</h2>
<p>The Ice Cream Man ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.</p>

<h2>2. Dual-Marketplace Architecture</h2>
<p>The Ice Cream Man operates as a <strong>dual-marketplace platform</strong> connecting two distinct user roles:</p>
<table><tr><th>Role</th><th>Description</th><th>Key Data Interactions</th></tr>
<tr><td><strong>Customer</strong></td><td>Orders ice cream delivery</td><td>Shares location data (at their chosen precision) with assigned Driver</td></tr>
<tr><td><strong>Driver/Vendor</strong></td><td>Fulfills delivery requests</td><td>Shares real-time GPS for proximity verification and navigation</td></tr></table>

<h2>3. Location Data — Customer Explicit Choice</h2>
<p>Customers have <strong>explicit control</strong> over what location information is shared with Drivers:</p>
<table><tr><th>Sharing Mode</th><th>What Driver Receives</th><th>GPS Shared?</th></tr>
<tr><td>Exact Address</td><td>Full street address from GPS</td><td>Yes</td></tr>
<tr><td>Street Name Only</td><td>Street name without house number</td><td>Partial</td></tr>
<tr><td>Custom Meetup Point</td><td>Customer-written text (e.g., "the stop sign on Oak St")</td><td>No</td></tr></table>

<h2>4. Temporary Caching and Immediate Destruction</h2>
<div class="highlight"><strong>Critical Privacy Safeguard:</strong> Customer location data is temporarily cached locally on the Driver's device via AsyncStorage <strong>solely for the duration of active navigation</strong>. The moment a delivery is marked as complete, <strong>all customer location data is automatically and permanently destroyed</strong> from the Driver's device. No customer location history is retained after delivery completion.</div>

<h2>5. Payment Information</h2>
<p>The App uses <strong>Google Play Billing</strong> exclusively for the one-time $25 Driver registration fee. We do not collect, store, or process any credit card numbers or financial credentials. All payment processing is handled by Google Play's secure infrastructure.</p>

<h2>6. Data Security</h2>
<p>We implement industry-standard security measures including: OWASP-compliant security headers, rate limiting (100 req/min general; 5 req/min payments), input sanitization, purchase token validation, device Keychain/Keystore encryption, coordinate validation, and automatic data destruction upon delivery completion.</p>

<h2>7. Background Location Disclosure</h2>
<div class="highlight">This app collects location data to enable real-time tracking for ice cream deliveries even when the app is closed or not in use. This applies to Drivers with an active delivery in progress. Customers' location is collected only while the app is in the foreground.</div>

<h2>8. Children's Privacy</h2>
<p>We do not knowingly collect personal information from children under 13 without parental consent. Contact icecreammanapp@gmail.com if you believe a child has provided personal information.</p>

<h2>9. Your Rights</h2>
<table><tr><th>Right</th><th>How to Exercise</th></tr>
<tr><td>Access/Correction</td><td>In-app profile settings</td></tr>
<tr><td>Deletion</td><td>Email icecreammanapp@gmail.com</td></tr>
<tr><td>Location control</td><td>Change sharing mode per order or disable in device settings</td></tr></table>

<h2>10. Data Sharing</h2>
<p>We do <strong>not</strong> sell, rent, or share your personal data with third parties for advertising or marketing. Data is shared only between Customer and Driver during an active delivery, and with Google Play for payment processing.</p>

<h2>11. Contact Us</h2>
<p>Email: icecreammanapp@gmail.com<br>Developer: Mindy Gaines<br>Location: Beaverton, Oregon, United States</p>

<div class="footer"><p>By using The Ice Cream Man app, you acknowledge that you have read and understood this Privacy Policy.</p><p>Sweetly yours, \u2764\uFE0F -Mindy Gaines</p></div>
</body>
</html>`);
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log("Preferred port is busy, using an available port instead");
  }

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
  });
}

startServer().catch(console.error);
