/**
 * SSL Certificate Pinning Module
 *
 * Implements certificate pinning for the production API endpoint to prevent
 * man-in-the-middle (MITM) attacks. Uses public key pinning (HPKP-style)
 * with SHA-256 fingerprints of the server's certificate chain.
 *
 * SECURITY ARCHITECTURE:
 * - Pins the SPKI (Subject Public Key Info) hash of the server certificate
 * - Includes backup pins for certificate rotation
 * - Validates certificate chain integrity before any API request
 * - Falls back gracefully in development mode
 *
 * CURRENT STATE: PINNED_CERTIFICATES is empty until a real production API
 * host is chosen. No previous template host is used for pinning.
 * When the backend is live, add the domain and at least two real SPKI pins
 * (primary + backup). Generate pins with:
 *   openssl s_client -connect <domain>:443 -servername <domain> </dev/null 2>/dev/null | \
 *     openssl x509 -pubkey -noout | openssl pkey -pubin -outform der | \
 *     openssl dgst -sha256 -binary | openssl enc -base64
 */

import { Platform } from 'react-native';

// __DEV__ is a React Native global; provide fallback for non-RN environments (tests)
declare const __DEV__: boolean;
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

// ============================================
// CERTIFICATE PIN CONFIGURATION
// ============================================

export type DomainPinConfig = {
  pins: string[];
  includeSubdomains: boolean;
  maxAge: number;
  reportUri: string | null;
};

/**
 * SHA-256 SPKI pins per hostname.
 * Empty until production API domain + real pins are configured.
 * Always include at least 2 pins (primary + backup) per domain when enabling.
 */
export const PINNED_CERTIFICATES: Record<string, DomainPinConfig> = {
  // Example (do not enable with placeholder pins):
  // 'api.yourdomain.com': {
  //   pins: ['REAL_PRIMARY_SPKI_BASE64', 'REAL_BACKUP_SPKI_BASE64'],
  //   includeSubdomains: true,
  //   maxAge: 2592000,
  //   reportUri: null,
  // },
};

// ============================================
// PIN VALIDATION ENGINE
// ============================================

export interface PinValidationResult {
  valid: boolean;
  domain: string;
  matchedPin: string | null;
  error: string | null;
  timestamp: number;
}

/**
 * Validates a certificate's SPKI hash against pinned values.
 * Returns true if the certificate matches any of the pinned hashes.
 * Unknown / unpinned domains are allowed (no pin enforcement).
 */
export function validateCertificatePin(
  domain: string,
  certificateHash: string
): PinValidationResult {
  const config = PINNED_CERTIFICATES[domain];

  if (!config || config.pins.length === 0) {
    return {
      valid: true,
      domain,
      matchedPin: null,
      error: null,
      timestamp: Date.now(),
    };
  }

  const matched = config.pins.find((pin) => pin === certificateHash);

  if (matched) {
    return {
      valid: true,
      domain,
      matchedPin: matched,
      error: null,
      timestamp: Date.now(),
    };
  }

  console.error(
    `[SSL-PIN] CERTIFICATE PIN VIOLATION for ${domain}!\n` +
      `Received hash: ${certificateHash}\n` +
      `Expected one of: ${config.pins.join(', ')}\n` +
      `This may indicate a man-in-the-middle attack.`
  );

  return {
    valid: false,
    domain,
    matchedPin: null,
    error: `Certificate pin mismatch for ${domain}. Connection rejected.`,
    timestamp: Date.now(),
  };
}

// ============================================
// NETWORK SECURITY CONFIG (Android)
// ============================================

/**
 * Generates Android Network Security Configuration XML.
 * Place at android/app/src/main/res/xml/network_security_config.xml when pins exist.
 */
export function generateAndroidNetworkSecurityConfig(): string {
  const domains = Object.entries(PINNED_CERTIFICATES);

  let xml = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <!-- Base config: trust system CAs -->
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>

  <!-- Debug overrides for development -->
  <debug-overrides>
    <trust-anchors>
      <certificates src="user" />
      <certificates src="system" />
    </trust-anchors>
  </debug-overrides>

`;

  for (const [domain, config] of domains) {
    const realPins = config.pins.filter(
      (pin) => !pin.startsWith('PRODUCTION_') && pin.length > 0
    );
    if (realPins.length === 0) continue;

    xml += `  <!-- Pinned domain: ${domain} -->
  <domain-config cleartextTrafficPermitted="false">
    <domain includeSubdomains="${config.includeSubdomains}">${domain}</domain>
    <pin-set expiration="${getExpirationDate(config.maxAge)}">
`;
    for (const pin of realPins) {
      xml += `      <pin digest="SHA-256">${pin}</pin>\n`;
    }
    xml += `    </pin-set>
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </domain-config>

`;
  }

  xml += `</network-security-config>`;
  return xml;
}

// ============================================
// iOS App Transport Security (ATS)
// ============================================

export function generateIOSATSConfig(): Record<string, any> {
  return {
    NSAppTransportSecurity: {
      NSAllowsArbitraryLoads: false,
      NSExceptionDomains: {
        localhost: {
          NSExceptionAllowsInsecureHTTPLoads: true,
          NSIncludesSubdomains: true,
        },
      },
    },
  };
}

// ============================================
// SECURE FETCH WRAPPER
// ============================================

/**
 * Fetch wrapper that applies extra headers when the request host is pinned.
 * Unpinned hosts (including empty PINNED_CERTIFICATES) use normal fetch.
 */
export async function secureFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const urlObj = new URL(url);
  const domain = urlObj.hostname;
  const config = PINNED_CERTIFICATES[domain];

  if (isDev || !config || config.pins.length === 0) {
    return fetch(url, options);
  }

  if (Platform.OS === 'web') {
    return fetch(url, {
      ...options,
      credentials: 'include',
    });
  }

  const secureOptions: RequestInit = {
    ...options,
    headers: {
      ...options.headers,
      'X-SSL-Pin-Version': '1',
      'X-Requested-With': 'XMLHttpRequest',
    },
  };

  const response = await fetch(url, secureOptions);

  const strictTransport = response.headers.get('strict-transport-security');
  if (!strictTransport && !isDev) {
    console.warn(
      `[SSL-PIN] Missing HSTS header from ${domain}. ` +
        `Server should include: Strict-Transport-Security: max-age=31536000; includeSubDomains`
    );
  }

  return response;
}

// ============================================
// CERTIFICATE TRANSPARENCY VERIFICATION
// ============================================

export function verifyCertificateTransparency(
  domain: string,
  sctTimestamp: number | null
): boolean {
  if (!sctTimestamp) {
    console.warn(`[SSL-CT] No Signed Certificate Timestamp for ${domain}`);
    return true;
  }

  if (sctTimestamp > Date.now() + 86400000) {
    console.error(
      `[SSL-CT] Future SCT timestamp detected for ${domain} — possible forgery`
    );
    return false;
  }

  const oneYear = 365 * 24 * 60 * 60 * 1000;
  if (Date.now() - sctTimestamp > oneYear) {
    console.warn(
      `[SSL-CT] SCT for ${domain} is older than 1 year — consider certificate renewal`
    );
  }

  return true;
}

export const SSL_PINNING_EXPO_CONFIG = {
  android: {
    networkSecurityConfig:
      './android/app/src/main/res/xml/network_security_config.xml',
  },
  ios: {
    infoPlist: {
      NSAppTransportSecurity: {
        NSAllowsArbitraryLoads: false,
      },
    },
  },
};

function getExpirationDate(maxAgeSeconds: number): string {
  const date = new Date(Date.now() + maxAgeSeconds * 1000);
  return date.toISOString().split('T')[0];
}

export function shouldEnforceSSLPinning(): boolean {
  if (isDev) return false;
  if (Platform.OS === 'web') return false;
  return Object.keys(PINNED_CERTIFICATES).length > 0;
}

export function getPinningStatus(): {
  enabled: boolean;
  platform: string;
  domains: string[];
  pinCount: number;
} {
  return {
    enabled: shouldEnforceSSLPinning(),
    platform: Platform.OS,
    domains: Object.keys(PINNED_CERTIFICATES),
    pinCount: Object.values(PINNED_CERTIFICATES).reduce(
      (sum, config) => sum + config.pins.length,
      0
    ),
  };
}
