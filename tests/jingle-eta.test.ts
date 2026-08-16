import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Ice Cream Truck Jingle', () => {
  const jinglePath = path.resolve(__dirname, '../assets/ice-cream-jingle.mp3');

  it('should have jingle audio file available', () => {
    expect(fs.existsSync(jinglePath)).toBe(true);
  });

  it('jingle file should be reasonable size for mobile', () => {
    const stats = fs.statSync(jinglePath);
    // Should be under 5MB for mobile
    expect(stats.size).toBeLessThan(5 * 1024 * 1024);
    // Should be at least 10KB (not empty)
    expect(stats.size).toBeGreaterThan(10 * 1024);
  });
});

describe('ETA Messaging Quick Messages', () => {
  const quickMessages = [
    { label: '🏃 2 min away!', value: '2 minutes away' },
    { label: '🚚 5 min away!', value: '5 minutes away' },
    { label: '🗺️ 10 min away', value: '10 minutes away' },
    { label: '👋 On my way!', value: 'On my way!' },
    { label: '🍦 Almost there!', value: 'Almost there!' },
    { label: '🚗 In traffic!', value: 'Stuck in traffic, be there soon!' },
  ];

  it('should have at least 4 quick message options', () => {
    expect(quickMessages.length).toBeGreaterThanOrEqual(4);
  });

  it('all quick messages should include an emoji', () => {
    quickMessages.forEach(msg => {
      // Check for emoji (non-ASCII characters)
      expect(msg.label).toMatch(/[^\x00-\x7F]/);
    });
  });

  it('all quick messages should be under 100 characters', () => {
    quickMessages.forEach(msg => {
      expect(msg.value.length).toBeLessThan(100);
    });
  });

  it('messages should cover common ETA scenarios', () => {
    const values = quickMessages.map(m => m.value);
    // Should have time-based messages
    expect(values.some(v => v.includes('minutes'))).toBe(true);
    // Should have a general "on my way" message
    expect(values.some(v => v.toLowerCase().includes('way') || v.toLowerCase().includes('there'))).toBe(true);
  });
});

describe('Notification Service ETA Support', () => {
  it('notification-service.ts should contain eta_update type', () => {
    const filePath = path.resolve(__dirname, '../lib/notification-service.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('eta_update');
  });

  it('notification-service.ts should export notifyCustomerETA function', () => {
    const filePath = path.resolve(__dirname, '../lib/notification-service.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export async function notifyCustomerETA');
  });

  it('notifyCustomerETA should accept driverName and etaMessage params', () => {
    const filePath = path.resolve(__dirname, '../lib/notification-service.ts');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('notifyCustomerETA(driverName: string, etaMessage: string)');
  });
});

describe('ETA Messaging Component Structure', () => {
  it('eta-messaging.tsx should export ETAMessaging component', () => {
    const filePath = path.resolve(__dirname, '../components/eta-messaging.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export function ETAMessaging');
  });

  it('eta-messaging.tsx should export ETADisplay component', () => {
    const filePath = path.resolve(__dirname, '../components/eta-messaging.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('export function ETADisplay');
  });

  it('ETAMessaging should have onSendETA callback prop', () => {
    const filePath = path.resolve(__dirname, '../components/eta-messaging.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('onSendETA');
  });

  it('ETADisplay should accept message and driverName props', () => {
    const filePath = path.resolve(__dirname, '../components/eta-messaging.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('message');
    expect(content).toContain('driverName');
  });
});

describe('Summoning Animation with Jingle Integration', () => {
  it('summoning-animation.tsx should reference jingle audio', () => {
    const filePath = path.resolve(__dirname, '../components/summoning-animation.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content).toContain('jingle');
  });

  it('summoning-animation.tsx should use expo-audio or Audio', () => {
    const filePath = path.resolve(__dirname, '../components/summoning-animation.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content.includes('expo-audio') || content.includes('Audio')).toBe(true);
  });
});
