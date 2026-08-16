import { describe, it, expect, vi } from 'vitest';
import {
  validateCertificatePin,
  verifyCertificateTransparency,
  generateAndroidNetworkSecurityConfig,
  generateIOSATSConfig,
  getPinningStatus,
  PINNED_CERTIFICATES,
  shouldEnforceSSLPinning,
} from '../lib/ssl-pinning';

vi.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

describe('SSL Certificate Pinning', () => {
  describe('PINNED_CERTIFICATES configuration', () => {
    it('should start with no production pins until API host is configured', () => {
      expect(Object.keys(PINNED_CERTIFICATES)).toHaveLength(0);
    });

    it('should not pin the retired Manus template host', () => {
      expect(PINNED_CERTIFICATES['icecreamapp-q7oiswec.manus.space']).toBeUndefined();
    });
  });

  describe('validateCertificatePin', () => {
    it('should return valid=true for any domain when no pins are configured', () => {
      const result = validateCertificatePin(
        'api.example.com',
        'any_hash_value'
      );
      expect(result.valid).toBe(true);
      expect(result.matchedPin).toBeNull();
      expect(result.error).toBeNull();
    });

    it('should return valid=true for unknown domains (not pinned)', () => {
      const result = validateCertificatePin('unknown-domain.com', 'any_hash_value');
      expect(result.valid).toBe(true);
      expect(result.matchedPin).toBeNull();
    });

    it('should include timestamp in result', () => {
      const before = Date.now();
      const result = validateCertificatePin('unknown.com', 'hash');
      expect(result.timestamp).toBeGreaterThanOrEqual(before);
      expect(result.timestamp).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('verifyCertificateTransparency', () => {
    it('should return true for valid SCT timestamp', () => {
      const validTimestamp = Date.now() - 86400000;
      expect(verifyCertificateTransparency('test.com', validTimestamp)).toBe(true);
    });

    it('should return false for future SCT timestamp (forgery)', () => {
      const futureTimestamp = Date.now() + 172800000;
      expect(verifyCertificateTransparency('test.com', futureTimestamp)).toBe(false);
    });

    it('should return true for null SCT (graceful fallback)', () => {
      expect(verifyCertificateTransparency('test.com', null)).toBe(true);
    });

    it('should return true for old but valid SCT', () => {
      const oldTimestamp = Date.now() - 200 * 24 * 60 * 60 * 1000;
      expect(verifyCertificateTransparency('test.com', oldTimestamp)).toBe(true);
    });
  });

  describe('generateAndroidNetworkSecurityConfig', () => {
    it('should generate valid XML', () => {
      const xml = generateAndroidNetworkSecurityConfig();
      expect(xml).toContain('<?xml version="1.0"');
      expect(xml).toContain('<network-security-config>');
      expect(xml).toContain('</network-security-config>');
    });

    it('should include cleartext traffic disabled', () => {
      const xml = generateAndroidNetworkSecurityConfig();
      expect(xml).toContain('cleartextTrafficPermitted="false"');
    });

    it('should not include Manus template host', () => {
      const xml = generateAndroidNetworkSecurityConfig();
      expect(xml).not.toContain('manus.space');
    });

    it('should include debug overrides for development', () => {
      const xml = generateAndroidNetworkSecurityConfig();
      expect(xml).toContain('<debug-overrides>');
    });
  });

  describe('generateIOSATSConfig', () => {
    it('should disable arbitrary loads', () => {
      const config = generateIOSATSConfig();
      expect(config.NSAppTransportSecurity.NSAllowsArbitraryLoads).toBe(false);
    });

    it('should allow localhost for development', () => {
      const config = generateIOSATSConfig();
      expect(config.NSAppTransportSecurity.NSExceptionDomains.localhost).toBeDefined();
      expect(
        config.NSAppTransportSecurity.NSExceptionDomains.localhost
          .NSExceptionAllowsInsecureHTTPLoads
      ).toBe(true);
    });
  });

  describe('getPinningStatus / shouldEnforceSSLPinning', () => {
    it('should report platform', () => {
      const status = getPinningStatus();
      expect(status.platform).toBe('ios');
    });

    it('should list zero domains while pins are disabled', () => {
      const status = getPinningStatus();
      expect(status.domains).toEqual([]);
      expect(status.pinCount).toBe(0);
    });

    it('should not enforce pinning with empty pin set', () => {
      expect(shouldEnforceSSLPinning()).toBe(false);
    });
  });
});
