import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock React Native Platform
vi.mock('react-native', () => ({
  Platform: { OS: 'web' },
}));

// Mock expo-secure-store
vi.mock('expo-secure-store', () => ({
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 0,
}));

describe('Security Module - Client Side', () => {
  let security: typeof import('../lib/security');

  beforeEach(async () => {
    vi.resetModules();
    security = await import('../lib/security');
  });

  describe('sanitizeInput', () => {
    it('removes script tags', () => {
      const input = 'Hello <script>alert("xss")</script> World';
      const result = security.sanitizeInput(input);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('</script>');
      expect(result).toContain('Hello');
      expect(result).toContain('World');
    });

    it('removes event handlers', () => {
      const input = 'Click me onload="evil()" please';
      const result = security.sanitizeInput(input);
      expect(result).not.toContain('onload=');
    });

    it('removes null bytes', () => {
      const input = 'Hello\0World';
      const result = security.sanitizeInput(input);
      expect(result).not.toContain('\0');
    });

    it('removes command injection characters', () => {
      const input = 'test; rm -rf /; echo $HOME | cat';
      const result = security.sanitizeInput(input);
      expect(result).not.toContain(';');
      expect(result).not.toContain('|');
      expect(result).not.toContain('$');
    });

    it('limits length to 1000 characters', () => {
      const input = 'a'.repeat(2000);
      const result = security.sanitizeInput(input);
      expect(result.length).toBeLessThanOrEqual(1000);
    });

    it('handles empty/null input', () => {
      expect(security.sanitizeInput('')).toBe('');
      expect(security.sanitizeInput(null as any)).toBe('');
      expect(security.sanitizeInput(undefined as any)).toBe('');
    });

    it('preserves normal text', () => {
      const input = 'Blue house with white fence';
      const result = security.sanitizeInput(input);
      expect(result).toBe('Blue house with white fence');
    });
  });

  describe('sanitizeAddress', () => {
    it('allows valid address characters', () => {
      const input = '123 Main St, Apt #4, Beaverton, OR';
      const result = security.sanitizeAddress(input);
      expect(result).toBe("123 Main St, Apt #4, Beaverton, OR");
    });

    it('removes dangerous characters', () => {
      const input = '123 Main St; DROP TABLE users;--';
      const result = security.sanitizeAddress(input);
      expect(result).not.toContain(';');
      expect(result).not.toContain('DROP');
    });

    it('limits length to 200 characters', () => {
      const input = 'a'.repeat(300);
      const result = security.sanitizeAddress(input);
      expect(result.length).toBeLessThanOrEqual(200);
    });

    it('handles empty input', () => {
      expect(security.sanitizeAddress('')).toBe('');
      expect(security.sanitizeAddress(null as any)).toBe('');
    });
  });

  describe('validateCoordinates', () => {
    it('accepts valid coordinates', () => {
      expect(security.validateCoordinates(45.4872, -122.8044)).toBe(true);
      expect(security.validateCoordinates(0, 0)).toBe(true);
      expect(security.validateCoordinates(-90, 180)).toBe(true);
      expect(security.validateCoordinates(90, -180)).toBe(true);
    });

    it('rejects invalid latitude', () => {
      expect(security.validateCoordinates(91, 0)).toBe(false);
      expect(security.validateCoordinates(-91, 0)).toBe(false);
    });

    it('rejects invalid longitude', () => {
      expect(security.validateCoordinates(0, 181)).toBe(false);
      expect(security.validateCoordinates(0, -181)).toBe(false);
    });

    it('rejects NaN values', () => {
      expect(security.validateCoordinates(NaN, 0)).toBe(false);
      expect(security.validateCoordinates(0, NaN)).toBe(false);
    });

    it('rejects non-number values', () => {
      expect(security.validateCoordinates('45' as any, 0)).toBe(false);
      expect(security.validateCoordinates(0, '122' as any)).toBe(false);
    });
  });

  describe('validatePurchaseToken', () => {
    it('accepts valid tokens', () => {
      const validToken = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEF';
      expect(security.validatePurchaseToken(validToken)).toBe(true);
    });

    it('rejects null/empty tokens', () => {
      expect(security.validatePurchaseToken(null)).toBe(false);
      expect(security.validatePurchaseToken('')).toBe(false);
    });

    it('rejects tokens that are too short', () => {
      expect(security.validatePurchaseToken('abc')).toBe(false);
      expect(security.validatePurchaseToken('short')).toBe(false);
    });

    it('rejects tokens with invalid characters', () => {
      const invalidToken = 'valid_token_but_has_<script>_in_it';
      expect(security.validatePurchaseToken(invalidToken)).toBe(false);
    });
  });

  describe('isRateLimited', () => {
    it('allows requests within limit', () => {
      // Use unique action name to avoid cross-test contamination
      const action = 'test_action_' + Date.now();
      expect(security.isRateLimited(action, 3, 60000)).toBe(false);
      expect(security.isRateLimited(action, 3, 60000)).toBe(false);
      expect(security.isRateLimited(action, 3, 60000)).toBe(false);
    });

    it('blocks requests over limit', () => {
      const action = 'test_block_' + Date.now();
      security.isRateLimited(action, 2, 60000);
      security.isRateLimited(action, 2, 60000);
      expect(security.isRateLimited(action, 2, 60000)).toBe(true);
    });
  });

  describe('generateTransactionFingerprint', () => {
    it('generates unique fingerprints', () => {
      const fp1 = security.generateTransactionFingerprint();
      const fp2 = security.generateTransactionFingerprint();
      expect(fp1).not.toBe(fp2);
    });

    it('includes platform identifier', () => {
      const fp = security.generateTransactionFingerprint();
      expect(fp).toContain('web');
    });
  });

  describe('maskSensitiveData', () => {
    it('masks all but last 4 characters', () => {
      const result = security.maskSensitiveData('1234567890');
      expect(result).toBe('******7890');
    });

    it('handles short strings', () => {
      expect(security.maskSensitiveData('abc')).toBe('****');
      expect(security.maskSensitiveData('')).toBe('****');
    });
  });

  describe('maskLocationForPrivacy', () => {
    it('reduces coordinate precision', () => {
      const result = security.maskLocationForPrivacy(45.487234, -122.804456);
      expect(result.lat).toBe(45.487);
      expect(result.lng).toBe(-122.804);
    });
  });

  describe('generateSecureId', () => {
    it('generates ID of specified length', () => {
      const id = security.generateSecureId(16);
      expect(id.length).toBe(16);
    });

    it('generates unique IDs', () => {
      const id1 = security.generateSecureId();
      const id2 = security.generateSecureId();
      expect(id1).not.toBe(id2);
    });

    it('only contains alphanumeric characters', () => {
      const id = security.generateSecureId(100);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('createSecureReceipt', () => {
    it('creates a receipt with all required fields', async () => {
      const receipt = await security.createSecureReceipt(
        'txn_123',
        'icm_vendor_registration',
        'valid_token_abcdefghijklmnop'
      );
      expect(receipt.transactionId).toBe('txn_123');
      expect(receipt.productId).toBe('icm_vendor_registration');
      expect(receipt.purchaseTime).toBeGreaterThan(0);
      expect(receipt.fingerprint).toBeTruthy();
      expect(receipt.integrityHash).toBeTruthy();
    });

    it('receipt integrity verification works', async () => {
      const receipt = await security.createSecureReceipt(
        'txn_456',
        'icm_vendor_registration',
        'another_valid_token_xyz123456'
      );
      expect(security.verifyReceiptIntegrity(receipt)).toBe(true);

      // Tamper with receipt
      const tampered = { ...receipt, purchaseTime: 999 };
      expect(security.verifyReceiptIntegrity(tampered)).toBe(false);
    });
  });
});
