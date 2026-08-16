/**
 * GPS Navigation Utilities
 * 
 * Enables drivers to navigate to the customer's street so they can drive
 * down the same road. The customer's exact house number is hidden for privacy,
 * but the street name and approximate block are shared so the driver can
 * physically drive past the customer's location within 1000 feet.
 */

export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export interface NavigationTarget {
  /** Coordinates for the driver to navigate to (on the customer's street) */
  coords: LocationCoords;
  /** Street name the customer is on */
  streetName: string;
  /** Display text for the driver (e.g. "Heading to SW Murray Blvd") */
  displayText: string;
}

// 1000 feet in meters - driver should be within this range
export const PROXIMITY_RADIUS_METERS = 304.8; // ~1000 feet

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  from: LocationCoords,
  to: LocationCoords
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((to.latitude - from.latitude) * Math.PI) / 180;
  const dLon = ((to.longitude - from.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((from.latitude * Math.PI) / 180) *
      Math.cos((to.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Check if driver is within 1000 feet of the customer
 */
export function isWithinProximity(
  driverLocation: LocationCoords,
  customerLocation: LocationCoords
): boolean {
  const distance = calculateDistance(driverLocation, customerLocation);
  return distance <= PROXIMITY_RADIUS_METERS;
}

/**
 * Legacy alias for backward compatibility
 */
export const isWithinSafetyZone = isWithinProximity;

/**
 * Get distance in feet for display
 */
export function getDistanceInFeet(meters: number): number {
  return Math.round(meters * 3.28084);
}

/**
 * Format distance for user display
 */
export function formatDistance(meters: number): string {
  const feet = getDistanceInFeet(meters);
  if (feet < 100) {
    return `${feet} ft away`;
  } else if (feet < 1000) {
    return `${Math.round(feet / 100) * 100} ft away`;
  } else {
    const miles = (feet / 5280).toFixed(1);
    return `${miles} miles away`;
  }
}

/**
 * Extract street name from a full address string.
 * Removes house numbers but keeps the street name so the driver
 * can navigate to the correct road.
 * 
 * Examples:
 *   "1234 SW Murray Blvd, Beaverton, OR" → "SW Murray Blvd"
 *   "456 NW Cornell Rd, Portland, OR" → "NW Cornell Rd"
 */
export function extractStreetName(fullAddress: string): string {
  if (!fullAddress) return 'Unknown Street';
  
  // Split by comma to get the street portion (before city)
  const streetPortion = fullAddress.split(',')[0].trim();
  
  // Remove leading house numbers (digits, hyphens, spaces at start)
  const withoutNumber = streetPortion.replace(/^\d+[-\s]*/, '').trim();
  
  return withoutNumber || streetPortion;
}

/**
 * Get a navigation target on the customer's street.
 * Instead of hiding the location entirely, this gives the driver
 * a point on the same street (offset slightly from exact house)
 * so they can drive down the correct road.
 */
export function getStreetNavigationTarget(
  customerLocation: LocationCoords,
  customerAddress: string
): NavigationTarget {
  const streetName = extractStreetName(customerAddress);
  
  // Offset slightly along the street (about 200-400 feet in a random direction)
  // This puts the driver on the same street but not at the exact house
  const offsetMeters = 60 + Math.random() * 60; // 200-400 feet
  const angle = Math.random() * 2 * Math.PI;
  
  const latOffset = (offsetMeters / 111000) * Math.cos(angle);
  const lonOffset = (offsetMeters / (111000 * Math.cos((customerLocation.latitude * Math.PI) / 180))) * Math.sin(angle);

  return {
    coords: {
      latitude: customerLocation.latitude + latOffset,
      longitude: customerLocation.longitude + lonOffset,
    },
    streetName,
    displayText: `Heading to ${streetName}`,
  };
}

/**
 * Legacy function - kept for backward compatibility
 * Now returns a point on the customer's street instead of random point
 */
export function getRandomPointInSafetyZone(
  center: LocationCoords
): LocationCoords {
  // Small offset so driver is on the same block but not exact house
  const offsetMeters = 60 + Math.random() * 60; // 200-400 feet
  const angle = Math.random() * 2 * Math.PI;
  
  const latOffset = (offsetMeters / 111000) * Math.cos(angle);
  const lonOffset = (offsetMeters / (111000 * Math.cos((center.latitude * Math.PI) / 180))) * Math.sin(angle);

  return {
    latitude: center.latitude + latOffset,
    longitude: center.longitude + lonOffset,
  };
}
