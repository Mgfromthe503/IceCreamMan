# Privacy Policy

**The Ice Cream Man**  
**Effective Date:** June 29, 2026  
**Last Updated:** June 29, 2026  
**Developer:** Mindy Gaines  
**Contact:** icecreammanapp@gmail.com  
**Package:** com.icecreamman.launch

---

## 1. Introduction

The Ice Cream Man ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application ("The Ice Cream Man" or "App"), available on the Google Play Store.

By downloading, installing, or using the App, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with the terms of this Privacy Policy, please do not access the App.

---

## 2. Dual-Marketplace Architecture

The Ice Cream Man operates as a **dual-marketplace platform** connecting two distinct user roles within a single application:

| Role | Description | Key Data Interactions |
|------|-------------|----------------------|
| **Customer** | Orders ice cream delivery to their location | Shares location data (at their chosen precision) with assigned Driver |
| **Driver/Vendor** | Receives and fulfills customer delivery requests | Shares real-time GPS location for proximity verification and navigation |

Each role has different data collection requirements, retention periods, and privacy controls as described below.

---

## 3. Information We Collect

### 3.1 Location Data — Customer Explicit Choice

Customers have **explicit control** over what location information is shared with Drivers. Before each order, Customers choose one of three sharing modes:

| Sharing Mode | What Driver Receives | GPS Coordinates Shared? |
|--------------|---------------------|------------------------|
| **Exact Address** | Full street address from GPS reverse geocoding | Yes — precise coordinates shared with assigned Driver |
| **Street Name Only** | Street name without house number | Partial — coordinates used for proximity only, exact address withheld |
| **Custom Meetup Point** | Customer-written text description (e.g., "the stop sign on Oak St") | No — Driver receives only the text landmark description |

Customers may also provide optional **delivery instructions** (free-text, e.g., "Blue house with white fence" or "I'll be at the park bench"). These instructions are visible only to the assigned Driver during the active delivery.

### 3.2 Location Data — Driver

Drivers share their GPS location with the system for:
- Receiving requests from Customers in their registered coverage area (zip code)
- Enabling the **1000-foot proximity verification** required to mark a delivery as complete
- Providing real-time ETA estimates to waiting Customers

### 3.3 Location Data — Temporary Caching and Immediate Destruction

**Critical Privacy Safeguard:** Customer location data is temporarily cached locally on the Driver's device (via AsyncStorage) **solely for the duration of active navigation** to the delivery point. The moment a delivery is marked as complete (or cancelled), **all customer location data is automatically and permanently destroyed** from the Driver's device. This includes:
- Delivery address/coordinates
- Delivery instructions text
- Customer meetup point descriptions
- Any cached navigation data

No customer location history is retained on any device or server after delivery completion. There is no "order history" that reveals past customer locations to Drivers.

### 3.4 Payment Information

The App uses **Google Play Billing** exclusively for the one-time $25 Driver registration fee. We do not collect, store, or process any credit card numbers, bank account details, or financial credentials directly. All payment processing is handled entirely by Google Play's secure infrastructure. We store only:
- Transaction ID (for receipt verification)
- Purchase verification token (encrypted in device Keychain/Keystore)

### 3.5 Account Information

| Data Type | Purpose | Required |
|-----------|---------|----------|
| Name | Account identification and display to other party during delivery | Yes |
| Email address | Account authentication (via OAuth) | Yes |
| Area/Zip code (Drivers) | Coverage zone matching | Yes |
| Truck registration info (Drivers) | Service verification | Yes |

### 3.6 Device Information

| Data Type | Purpose |
|-----------|---------|
| Device platform (Android/iOS/Web) | UI rendering and feature compatibility |
| App state (foreground/background) | Battery-efficient polling management |
| Push notification token | Delivery alerts and order notifications |

---

## 4. How We Use Your Information

| Data Type | Usage | Retention |
|-----------|-------|-----------|
| Customer GPS coordinates | Route Driver to delivery location | **Deleted immediately upon delivery completion** |
| Customer delivery instructions | Display to Driver during active delivery | **Deleted immediately upon delivery completion** |
| Customer share mode choice | Determine what info Driver sees | Session-only; not stored permanently |
| Driver GPS coordinates | Calculate proximity to Customer (1000ft zone) | Session-only; not stored permanently |
| Driver area/zip code | Match Drivers with nearby Customer requests | Stored locally on Driver's device until changed |
| Registration payment token | Verify one-time $25 fee was paid | Stored in device Keychain/Keystore |
| Account information | Authentication and display | Until account deletion |

---

## 5. Information Sharing and Disclosure

We do **not** sell, rent, or share your personal data with any third parties for advertising, analytics, or marketing purposes.

### 5.1 Between Users (During Active Delivery Only)

| Shared With | Data Shared | Duration |
|-------------|-------------|----------|
| Driver | Customer's location (per chosen sharing mode) + delivery instructions | Active delivery only — destroyed on completion |
| Customer | Driver's first name + real-time ETA | Active delivery only |

### 5.2 With Service Providers

| Provider | Purpose | Data Shared |
|----------|---------|-------------|
| Google Play Billing | Process $25 registration fee | Transaction metadata (no card details) |
| OpenStreetMap Nominatim | Reverse geocoding (coordinates → address) | GPS coordinates (no user identity) |

### 5.3 Legal Requirements

We may disclose your information if required by law or in response to valid requests by public authorities (e.g., a court or government agency).

---

## 6. Data Security

We implement industry-standard security measures including:

- **OWASP-compliant security headers** on all server responses (HSTS, CSP, X-Frame-Options, etc.)
- **Rate limiting** to prevent abuse (100 requests/minute general; 5 requests/minute for payment endpoints)
- **Input sanitization** to prevent XSS, SQL injection, and command injection attacks
- **Purchase token validation** and tamper-detection for payment receipts
- **Device Keychain/Keystore encryption** for sensitive data (iOS Keychain, Android Keystore)
- **Coordinate validation** to prevent GPS spoofing
- **Automatic data destruction** upon delivery completion
- **Lifecycle-aware polling** that pauses all network activity when app is backgrounded

---

## 7. Background Location Disclosure

**This app collects location data to enable real-time tracking for ice cream deliveries even when the app is closed or not in use.**

This applies specifically to:
- **Drivers** who have an active delivery in progress (background location enables continued navigation)
- **Customers** — location is collected only while the app is in the foreground during order placement

---

## 8. Children's Privacy

The Ice Cream Man is designed for use by all ages. However, we do not knowingly collect personal information from children under 13 without parental consent. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at icecreammanapp@gmail.com and we will take steps to delete such information.

---

## 9. Vendor Screening Disclosure

The Ice Cream Man does NOT perform background checks, criminal history checks, driving record checks, or any other form of screening on vendors who register through the App. Vendor registration requires only payment of the registration fee and completion of the registration form. Users interact with vendors at their own discretion.

---

## 10. Your Rights and Choices

| Right | Description | How to Exercise |
|-------|-------------|-----------------|
| Access | View your personal data | In-app profile settings |
| Correction | Update inaccurate data | In-app profile settings |
| Deletion | Request account and data deletion | Email icecreammanapp@gmail.com |
| Location control | Change sharing mode per order, or disable location entirely | In-app delivery options / device settings |
| Data portability | Export your data | Email icecreammanapp@gmail.com |

---

## 11. California Residents (CCPA)

If you are a California resident, you have additional rights under the California Consumer Privacy Act:
- Right to know what personal information is collected
- Right to know whether personal information is sold or disclosed
- Right to opt-out of the sale of personal information
- Right to non-discrimination for exercising your rights

**We do not sell personal information to third parties.**

---

## 12. Changes to This Privacy Policy

We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy within the App and updating the "Last Updated" date above.

---

## 13. Contact Us

| Method | Details |
|--------|---------|
| Email | icecreammanapp@gmail.com |
| Developer | Mindy Gaines |
| App | The Ice Cream Man |
| Location | Beaverton, Oregon, United States |

---

**By using The Ice Cream Man app, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.**

*Sweetly yours, ❤️ -Mindy Gaines*
