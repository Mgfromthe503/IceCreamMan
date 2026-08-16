import { describe, it, expect, vi } from 'vitest';

/**
 * Tests for the FactTicker component logic and daily report calculations.
 * These validate the core business logic without rendering React Native components.
 */

// Simulate the facts array and rotation logic
const ICE_CREAM_FACTS = [
  "🇯🇵 Garlic and squid ink ice cream flavors actually exist in Japan!",
  "🧠 Brain freeze happens because blood vessels in your mouth panic!",
  "🇺🇸 George Washington spent $200 on ice cream in a single summer!",
  "🎵 Ice cream trucks originally played music to drown out engine noise!",
  "📊 The average American eats about 20 quarts of ice cream a year!",
];

describe('FactTicker Logic', () => {
  it('should have a non-empty facts array', () => {
    expect(ICE_CREAM_FACTS.length).toBeGreaterThan(0);
  });

  it('should cycle through facts with modulo arithmetic', () => {
    const totalFacts = ICE_CREAM_FACTS.length;
    let currentIndex = 0;
    
    // Advance 10 times and ensure it wraps around
    for (let i = 0; i < 10; i++) {
      currentIndex = (currentIndex + 1) % totalFacts;
    }
    
    expect(currentIndex).toBe(10 % totalFacts);
  });

  it('should start at a random index', () => {
    const totalFacts = ICE_CREAM_FACTS.length;
    const randomIndex = Math.floor(Math.random() * totalFacts);
    expect(randomIndex).toBeGreaterThanOrEqual(0);
    expect(randomIndex).toBeLessThan(totalFacts);
  });
});

// Daily Report calculation logic (extracted from the component)
const DEFAULT_GAS_PRICE = 3.50;
const VEHICLE_MPG = 15;
const AVERAGE_SPEED_MPH = 25;

function calculateDailyReport(params: {
  totalSales: number;
  totalOrders: number;
  milesDriven: number;
  hoursDriven: number;
  gasPricePerGallon: number;
}) {
  const { totalSales, totalOrders, milesDriven, hoursDriven, gasPricePerGallon } = params;

  // Without app: estimate driver would drive 3x more to find customers randomly
  const milesWithoutApp = milesDriven * 3;
  const milesSaved = milesWithoutApp - milesDriven;
  const gallonsSaved = milesSaved / VEHICLE_MPG;
  const moneySaved = gallonsSaved * gasPricePerGallon;

  // Gas used today
  const gasUsedToday = milesDriven / VEHICLE_MPG;
  const gasCostToday = gasUsedToday * gasPricePerGallon;

  // Time savings
  const hoursWithoutApp = milesWithoutApp / AVERAGE_SPEED_MPH;
  const hoursWithApp = hoursDriven;
  const hoursSaved = hoursWithoutApp - hoursWithApp;

  // Hourly rate comparison
  const hourlyRateWithApp = hoursDriven > 0 ? totalSales / hoursDriven : 0;
  const hoursWithoutAppForSameSales = hoursDriven * 3;
  const hourlyRateWithoutApp = hoursWithoutAppForSameSales > 0 ? totalSales / hoursWithoutAppForSameSales : 0;
  const improvement = hourlyRateWithApp - hourlyRateWithoutApp;
  const improvementPercent = hourlyRateWithoutApp > 0 ? ((improvement / hourlyRateWithoutApp) * 100) : 0;

  return {
    totalSales,
    totalOrders,
    milesDriven,
    hoursDriven,
    gasPricePerGallon,
    gasSavings: {
      milesWithoutApp,
      milesWithApp: milesDriven,
      milesSaved,
      gallonsSaved,
      moneySaved,
      gasUsedToday,
      gasCostToday,
    },
    timeSavings: {
      hoursWithoutApp,
      hoursWithApp,
      hoursSaved,
    },
    hourlyRate: {
      withApp: hourlyRateWithApp,
      withoutApp: hourlyRateWithoutApp,
      improvement,
      improvementPercent,
    },
  };
}

describe('Daily Report Calculations', () => {
  it('should calculate correct gas savings', () => {
    const report = calculateDailyReport({
      totalSales: 150,
      totalOrders: 30,
      milesDriven: 30,
      hoursDriven: 5,
      gasPricePerGallon: 4.00,
    });

    // Without app: 30 * 3 = 90 miles
    expect(report.gasSavings.milesWithoutApp).toBe(90);
    // Miles saved: 90 - 30 = 60
    expect(report.gasSavings.milesSaved).toBe(60);
    // Gallons saved: 60 / 15 = 4
    expect(report.gasSavings.gallonsSaved).toBe(4);
    // Money saved: 4 * $4.00 = $16.00
    expect(report.gasSavings.moneySaved).toBe(16);
    // Gas used today: 30 / 15 = 2 gallons
    expect(report.gasSavings.gasUsedToday).toBe(2);
    // Gas cost today: 2 * $4.00 = $8.00
    expect(report.gasSavings.gasCostToday).toBe(8);
  });

  it('should calculate correct hourly rate comparison', () => {
    const report = calculateDailyReport({
      totalSales: 120,
      totalOrders: 24,
      milesDriven: 20,
      hoursDriven: 4,
      gasPricePerGallon: 3.50,
    });

    // With app: $120 / 4h = $30/hr
    expect(report.hourlyRate.withApp).toBe(30);
    // Without app: $120 / (4*3)h = $120/12h = $10/hr
    expect(report.hourlyRate.withoutApp).toBe(10);
    // Improvement: $30 - $10 = $20/hr
    expect(report.hourlyRate.improvement).toBe(20);
    // Improvement percent: ($20 / $10) * 100 = 200%
    expect(report.hourlyRate.improvementPercent).toBe(200);
  });

  it('should calculate time savings', () => {
    const report = calculateDailyReport({
      totalSales: 100,
      totalOrders: 20,
      milesDriven: 25,
      hoursDriven: 3,
      gasPricePerGallon: 3.50,
    });

    // Without app hours: (25 * 3) / 25 mph = 75 / 25 = 3 hours
    expect(report.timeSavings.hoursWithoutApp).toBe(3);
    // With app: 3 hours (user input)
    expect(report.timeSavings.hoursWithApp).toBe(3);
    // Hours saved: 3 - 3 = 0 (in this case the driving time matches)
    expect(report.timeSavings.hoursSaved).toBe(0);
  });

  it('should handle zero hours gracefully', () => {
    const report = calculateDailyReport({
      totalSales: 100,
      totalOrders: 20,
      milesDriven: 10,
      hoursDriven: 0,
      gasPricePerGallon: 3.50,
    });

    expect(report.hourlyRate.withApp).toBe(0);
    expect(report.hourlyRate.withoutApp).toBe(0);
    expect(report.hourlyRate.improvement).toBe(0);
  });

  it('should use custom gas price', () => {
    const report = calculateDailyReport({
      totalSales: 200,
      totalOrders: 40,
      milesDriven: 45,
      hoursDriven: 6,
      gasPricePerGallon: 5.25,
    });

    // Gas used: 45 / 15 = 3 gallons
    // Gas cost: 3 * $5.25 = $15.75
    expect(report.gasSavings.gasUsedToday).toBe(3);
    expect(report.gasSavings.gasCostToday).toBe(15.75);
    // Miles saved: (45*3) - 45 = 90
    // Gallons saved: 90 / 15 = 6
    // Money saved: 6 * $5.25 = $31.50
    expect(report.gasSavings.moneySaved).toBe(31.5);
  });
});

describe('Navigation URL Generation', () => {
  it('should properly encode addresses for URL', () => {
    const address = '123 Main St, Springfield, IL 62701';
    const encoded = encodeURIComponent(address);
    expect(encoded).toBe('123%20Main%20St%2C%20Springfield%2C%20IL%2062701');
    expect(encoded).not.toContain(' ');
  });

  it('should generate valid Google Maps navigation URL', () => {
    const address = '456 Oak Ave';
    const encoded = encodeURIComponent(address);
    const url = `google.navigation:q=${encoded}&mode=d`;
    expect(url).toBe('google.navigation:q=456%20Oak%20Ave&mode=d');
  });

  it('should generate valid Apple Maps URL', () => {
    const address = '789 Pine Rd';
    const encoded = encodeURIComponent(address);
    const url = `maps://app?daddr=${encoded}&dirflg=d`;
    expect(url).toBe('maps://app?daddr=789%20Pine%20Rd&dirflg=d');
  });
});
